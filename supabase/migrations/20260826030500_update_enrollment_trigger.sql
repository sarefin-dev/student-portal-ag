-- Update force_approve_pending_verification
create or replace function force_approve_pending_verification(
  p_pending_id uuid,
  p_received_tx_id uuid default null,
  p_create_installment boolean default false,
  p_due_days int default 30
) returns void language plpgsql security definer as $$
declare
  v_pv pending_verifications%rowtype;
  v_payment_id uuid;
  v_item order_items%rowtype;
  v_order orders%rowtype;
  v_shortfall numeric;
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  select * into v_pv from pending_verifications where id = p_pending_id for update;
  if v_pv.status in ('matched', 'rejected') then return; end if;

  select * into v_order from orders where id = v_pv.order_id;

  if p_received_tx_id is not null then
    update received_transactions set consumed_by_pending_verification_id = p_pending_id
    where id = p_received_tx_id and consumed_by_pending_verification_id is null;
    if not found then raise exception 'Transaction already consumed or not found'; end if;
  end if;

  insert into payments (order_id, kind, method, amount, trx_id, sender_msisdn, pending_verification_id)
  values (v_pv.order_id, 'payment', v_pv.method, v_pv.submitted_amount, v_pv.submitted_trx_id,
          v_pv.submitted_sender_msisdn, p_pending_id)
  returning id into v_payment_id;

  update pending_verifications
  set status = 'matched', matched_transaction_id = p_received_tx_id, resolved_at = now(), resolved_by = auth.uid()
  where id = p_pending_id;

  if v_pv.installment_id is not null then
    update installments set status = 'paid', paid_payment_id = v_payment_id where id = v_pv.installment_id;
  else
    v_shortfall := v_order.total_amount - v_pv.submitted_amount;
    update orders set status = 'completed' where id = v_pv.order_id;
    
    if p_create_installment and v_shortfall > 0 then
      select * into v_item from order_items where order_id = v_pv.order_id limit 1;
      update order_items set uses_installments = true where id = v_item.id;
      insert into installments (order_item_id, installment_number, amount, due_at, status)
      values (v_item.id, 2, v_shortfall, now() + (p_due_days * interval '1 day'), 'pending');
    end if;

    for v_item in select * from order_items where order_id = v_pv.order_id loop
      if v_item.item_type = 'course' then
        insert into enrollments (student_id, course_id, source, order_item_id, routine_id)
        values ((select student_id from orders where id = v_pv.order_id), v_item.course_id, 'admin', v_item.id, v_item.routine_id)
        on conflict (student_id, course_id) do update set status = 'active', routine_id = coalesce(excluded.routine_id, enrollments.routine_id);
      elsif v_item.item_type = 'bundle' then
        insert into enrollments (student_id, course_id, source, order_item_id)
        select (select student_id from orders where id = v_pv.order_id), bi.course_id, 'admin', v_item.id
        from bundle_items bi where bi.bundle_id = v_item.bundle_id
        on conflict (student_id, course_id) do update set status = 'active';
      end if;
    end loop;
  end if;
end;
$$;

-- Update match_pending_verification (used by SMS cron)
create or replace function match_pending_verification() returns trigger language plpgsql security definer as $$
declare
  v_pv pending_verifications%rowtype;
  v_payment_id uuid;
  v_item order_items%rowtype;
begin
  select * into v_pv from pending_verifications
  where method = 'bkash' and status = 'pending' and submitted_trx_id = new.trx_id
  order by created_at desc limit 1;

  if not found then return new; end if;
  if new.amount < v_pv.submitted_amount then return new; end if;

  insert into payments (order_id, kind, method, amount, trx_id, sender_msisdn, pending_verification_id)
  values (v_pv.order_id, 'payment', 'bkash', new.amount, new.trx_id, new.sender_msisdn, v_pv.id)
  returning id into v_payment_id;

  update pending_verifications
  set status = 'matched', matched_transaction_id = new.id, resolved_at = now()
  where id = v_pv.id;

  new.consumed_by_pending_verification_id := v_pv.id;

  if v_pv.installment_id is not null then
    update installments set status = 'paid', paid_payment_id = v_payment_id where id = v_pv.installment_id;
  else
    update orders set status = 'completed' where id = v_pv.order_id;
    for v_item in select * from order_items where order_id = v_pv.order_id loop
      if v_item.item_type = 'course' then
        insert into enrollments (student_id, course_id, source, order_item_id, routine_id)
        values ((select student_id from orders where id = v_pv.order_id), v_item.course_id, 'self', v_item.id, v_item.routine_id)
        on conflict (student_id, course_id) do update set status = 'active', routine_id = coalesce(excluded.routine_id, enrollments.routine_id);
      elsif v_item.item_type = 'bundle' then
        insert into enrollments (student_id, course_id, source, order_item_id)
        select (select student_id from orders where id = v_pv.order_id), bi.course_id, 'self', v_item.id
        from bundle_items bi where bi.bundle_id = v_item.bundle_id
        on conflict (student_id, course_id) do update set status = 'active';
      end if;
    end loop;
  end if;

  return new;
end;
$$;
