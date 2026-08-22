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

  select * into v_order from orders where id = v_pv.order_id;

  -- 1. Check if SMS matches what they submitted in the form
  if v_txn.parsed_amount <> v_pv.submitted_amount then
    update pending_verifications set status = 'manual_review', updated_at = now()
    where id = p_pending_verification_id;
    return 'amount_mismatch';
  end if;

  -- 2. Check if the payment actually covers the expected cost
  if v_txn.parsed_amount < v_order.total_amount then
    update pending_verifications set status = 'manual_review', updated_at = now()
    where id = p_pending_verification_id;
    return 'amount_mismatch';
  end if;

  -- Consume the transaction
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
    end loop;
  end if;

  insert into jobs (job_type, payload) values ('send_email', jsonb_build_object(
    'template', 'payment_verified', 'order_id', v_pv.order_id
  ));

  return 'matched';
end;
$$;
