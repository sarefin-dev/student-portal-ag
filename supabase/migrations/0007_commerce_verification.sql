-- ============================================================================
-- 0007_commerce_verification.sql
-- Orders, order items, installments, payments (never deleted — status/kind
-- only), and the bKash/Nagad verification engine.
-- ============================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  subtotal_amount numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  currency text not null default 'BDT',
  coupon_id uuid references coupons(id),
  referral_code_id uuid references referral_codes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- No deleted_at: orders are financial records, never deleted (§A2).
);
create index idx_orders_student on orders(student_id);
create index idx_orders_status_created on orders(status, created_at); -- abandoned-checkout sweep (FR-VER-10)
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_type text not null check (item_type in ('course', 'bundle', 'resource')),
  course_id uuid references courses(id) on delete restrict,
  bundle_id uuid references bundles(id) on delete restrict,
  resource_id uuid references resources(id) on delete restrict,
  unit_price_amount numeric(12,2) not null,
  uses_installments boolean not null default false,
  created_at timestamptz not null default now(),
  constraint chk_order_item_target check (
    (item_type = 'course' and course_id is not null and bundle_id is null and resource_id is null) or
    (item_type = 'bundle' and bundle_id is not null and course_id is null and resource_id is null) or
    (item_type = 'resource' and resource_id is not null and course_id is null and bundle_id is null)
  )
);
create index idx_order_items_order on order_items(order_id);

-- Now that order_items exists, complete the forward-referenced FKs.
alter table enrollments add constraint fk_enrollments_order_item
  foreign key (order_item_id) references order_items(id);
alter table resource_downloads add constraint fk_resource_downloads_order_item
  foreign key (order_item_id) references order_items(id);
alter table coupon_redemptions add constraint fk_coupon_redemptions_order
  foreign key (order_id) references orders(id);
alter table referral_attributions add constraint fk_referral_attributions_order
  foreign key (order_id) references orders(id);

create table installments (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  installment_number int not null,
  amount numeric(12,2) not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  paid_payment_id uuid, -- FK added below (forward reference to payments)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_item_id, installment_number)
);
create index idx_installments_status_due on installments(status, due_at); -- overdue sweep (FR-PAY-5)
create trigger trg_installments_updated_at before update on installments
  for each row execute function set_updated_at();

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  kind text not null check (kind in ('payment', 'refund')), -- §G13: amount always positive, kind carries direction
  method text not null check (method in ('bkash', 'nagad', 'bank_transfer', 'manual', 'gumroad_external')),
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'BDT',
  trx_id text,
  sender_msisdn text,
  entered_by uuid references profiles(id), -- admin, for manual entries; null for self-service/auto
  pending_verification_id uuid, -- FK added in this migration's verification section
  notes text,
  created_at timestamptz not null default now()
  -- No deleted_at, no update trigger: payments are append-only financial records.
);
create index idx_payments_order on payments(order_id);

alter table installments add constraint fk_installments_paid_payment
  foreign key (paid_payment_id) references payments(id);

-- ---------------------------------------------------------------------------
-- Verification engine (FR-VER-*)
-- ---------------------------------------------------------------------------
create table pending_verifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  installment_id uuid references installments(id), -- null = first/full payment; set = a later installment
  method text not null check (method in ('bkash', 'nagad', 'bank_transfer')),
  submitted_trx_id text not null,
  submitted_amount numeric(12,2) not null,
  submitted_sender_msisdn text,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'manual_review', 'rejected')),
  source text not null default 'checkout' check (source in ('checkout', 'direct_submission', 'google_form')),
  matched_transaction_id uuid, -- FK added below
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_pending_verifications_status on pending_verifications(status, created_at);
create trigger trg_pending_verifications_updated_at before update on pending_verifications
  for each row execute function set_updated_at();

alter table payments add constraint fk_payments_pending_verification
  foreign key (pending_verification_id) references pending_verifications(id);

create table received_transactions (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('bkash', 'nagad')),
  parsed_trx_id text not null,
  parsed_amount numeric(12,2) not null,
  sender_msisdn text,
  raw_sms_text text not null, -- retained for audit/debugging (§I16); admin-only RLS
  received_at timestamptz not null default now(),
  consumed_by_pending_verification_id uuid unique references pending_verifications(id), -- one-to-one guard, FR-VER-5
  created_at timestamptz not null default now(),
  unique (provider, parsed_trx_id) -- DB-level duplicate guard, not just app logic
);
create index idx_received_transactions_unconsumed
  on received_transactions(provider, parsed_trx_id) where consumed_by_pending_verification_id is null;

alter table pending_verifications add constraint fk_pending_verifications_matched_transaction
  foreign key (matched_transaction_id) references received_transactions(id);

-- ---------------------------------------------------------------------------
-- match_pending_verification: the core verification function (§L). Called
-- by the webhook route immediately after a new received_transaction is
-- inserted, and by the pg_cron poller as a periodic sweep for the reverse
-- order (TrxID submitted before the SMS arrives). Explicit function, not a
-- passive trigger cascade — this has real branching logic (match / amount
-- mismatch / already-consumed) that belongs in an imperative call, not a
-- reactive trigger chain.
-- ---------------------------------------------------------------------------
create or replace function match_pending_verification(p_pending_verification_id uuid)
returns text -- 'matched' | 'no_match' | 'amount_mismatch'
language plpgsql security definer as $$
declare
  v_pv pending_verifications%rowtype;
  v_txn received_transactions%rowtype;
  v_order orders%rowtype;
  v_item order_items%rowtype;
  v_payment_id uuid;
begin
  select * into v_pv from pending_verifications where id = p_pending_verification_id for update;
  if v_pv.status <> 'pending' then
    return v_pv.status;
  end if;

  select * into v_txn from received_transactions
  where provider = case v_pv.method when 'bkash' then 'bkash' when 'nagad' then 'nagad' end
    and parsed_trx_id = v_pv.submitted_trx_id
    and consumed_by_pending_verification_id is null
  for update;

  if not found then
    return 'no_match';
  end if;

  if v_txn.parsed_amount <> v_pv.submitted_amount then
    update pending_verifications set status = 'manual_review', updated_at = now()
    where id = p_pending_verification_id;
    return 'amount_mismatch';
  end if;

  -- Consume the transaction (one-to-one guard) and record the payment.
  update received_transactions set consumed_by_pending_verification_id = p_pending_verification_id
  where id = v_txn.id;

  insert into payments (order_id, kind, method, amount, trx_id, sender_msisdn, pending_verification_id)
  values (v_pv.order_id, 'payment', v_pv.method, v_pv.submitted_amount, v_pv.submitted_trx_id,
          v_pv.submitted_sender_msisdn, p_pending_verification_id)
  returning id into v_payment_id;

  update pending_verifications
  set status = 'matched', matched_transaction_id = v_txn.id, resolved_at = now()
  where id = p_pending_verification_id;

  if v_pv.installment_id is not null then
    update installments set status = 'paid', paid_payment_id = v_payment_id where id = v_pv.installment_id;
  else
    -- First/full payment: mark the order complete and auto-enroll (FR-VER-8).
    update orders set status = 'completed' where id = v_pv.order_id;

    for v_item in select * from order_items where order_id = v_pv.order_id loop
      if v_item.item_type = 'course' then
        insert into enrollments (student_id, course_id, source, order_item_id)
        values ((select student_id from orders where id = v_pv.order_id), v_item.course_id, 'self', v_item.id)
        on conflict (student_id, course_id) do nothing;
      elsif v_item.item_type = 'bundle' then
        insert into enrollments (student_id, course_id, source, order_item_id)
        select (select student_id from orders where id = v_pv.order_id), bi.course_id, 'self', v_item.id
        from bundle_items bi where bi.bundle_id = v_item.bundle_id
        on conflict (student_id, course_id) do nothing;
      end if;
      -- resource-type items are fulfilled via signed download link generation
      -- at the API layer, not an enrollment row.
    end loop;
  end if;

  insert into jobs (job_type, payload) values ('send_email', jsonb_build_object(
    'template', 'payment_verified', 'order_id', v_pv.order_id
  ));

  return 'matched';
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table orders enable row level security;
create policy orders_select_own_or_admin on orders for select using (student_id = auth.uid() or is_admin());
create policy orders_write_admin on orders for all using (is_admin()) with check (is_admin());
-- Order creation happens via the checkout API route (service role) so
-- pricing/coupon logic can't be forged by a direct client insert.

alter table order_items enable row level security;
create policy order_items_select on order_items for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.student_id = auth.uid())
);
create policy order_items_write_admin on order_items for all using (is_admin()) with check (is_admin());

alter table installments enable row level security;
create policy installments_select on installments for select using (
  is_admin() or exists (
    select 1 from order_items oi join orders o on o.id = oi.order_id
    where oi.id = order_item_id and o.student_id = auth.uid()
  )
);
create policy installments_write_admin on installments for all using (is_admin()) with check (is_admin());

alter table payments enable row level security;
create policy payments_select on payments for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.student_id = auth.uid())
);
create policy payments_write_admin on payments for all using (is_admin()) with check (is_admin());
-- Payment rows are otherwise created only by match_pending_verification()
-- (security definer) or an admin's manual-entry API route.

alter table pending_verifications enable row level security;
create policy pending_verifications_select on pending_verifications for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.student_id = auth.uid())
);
create policy pending_verifications_insert_own on pending_verifications for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.student_id = auth.uid())
);
create policy pending_verifications_admin_update on pending_verifications for update
  using (is_admin()) with check (is_admin());

alter table received_transactions enable row level security;
create policy received_transactions_admin_only on received_transactions
  for all using (is_admin()) with check (is_admin());
-- Inserts in practice come from the SMS webhook route under the service
-- role, which bypasses RLS; this policy governs client-side access only.
