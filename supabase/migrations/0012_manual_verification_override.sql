create or replace function force_approve_pending_verification(p_pending_id uuid, p_received_tx_id uuid default null)
returns void
language plpgsql security definer as $$
declare
  v_pv pending_verifications%rowtype;
  v_payment_id uuid;
  v_item order_items%rowtype;
begin
  -- 1. Ensure caller is admin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  select * into v_pv from pending_verifications where id = p_pending_id for update;
  if v_pv.status in ('matched', 'rejected') then
    return;
  end if;

  -- Consume the received transaction if one was provided
  if p_received_tx_id is not null then
    update received_transactions set consumed_by_pending_verification_id = p_pending_id
    where id = p_received_tx_id;
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
    update orders set status = 'completed' where id = v_pv.order_id;

    for v_item in select * from order_items where order_id = v_pv.order_id loop
      if v_item.item_type = 'course' then
        insert into enrollments (student_id, course_id, source, order_item_id)
        values ((select student_id from orders where id = v_pv.order_id), v_item.course_id, 'admin', v_item.id)
        on conflict (student_id, course_id) do nothing;
      elsif v_item.item_type = 'bundle' then
        insert into enrollments (student_id, course_id, source, order_item_id)
        select (select student_id from orders where id = v_pv.order_id), bi.course_id, 'admin', v_item.id
        from bundle_items bi where bi.bundle_id = v_item.bundle_id
        on conflict (student_id, course_id) do nothing;
      end if;
    end loop;
  end if;

  insert into jobs (job_type, payload) values ('send_email', jsonb_build_object(
    'template', 'payment_verified', 'order_id', v_pv.order_id
  ));

end;
$$;
