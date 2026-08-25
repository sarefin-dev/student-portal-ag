-- 1. Create the instructor payouts tracking table
create table if not exists instructor_payouts (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles(id),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  payment_id uuid, -- linked to the payments table later
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- 2. Link order_items to payouts to prevent double-counting
alter table order_items add column if not exists payout_id uuid references instructor_payouts(id);

-- 3. Modify payments table to allow payout records in the ledger
alter table payments alter column order_id drop not null;
alter table payments drop constraint if exists payments_kind_check;
alter table payments add constraint payments_kind_check check (kind in ('payment', 'refund', 'payout'));

-- 4. Link payouts to payments
alter table instructor_payouts add constraint fk_instructor_payouts_payment foreign key (payment_id) references payments(id);

-- RLS
alter table instructor_payouts enable row level security;
create policy "Instructors can view their own payouts" on instructor_payouts for select using (auth.uid() = instructor_id);
create policy "Admins manage payouts" on instructor_payouts for all using (is_admin());
