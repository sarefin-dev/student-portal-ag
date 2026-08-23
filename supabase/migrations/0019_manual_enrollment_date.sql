-- Allow admins to specify the actual payment date for manual enrollments
drop function if exists force_manual_enrollment(uuid, uuid, numeric, text, uuid);

create or replace function force_manual_enrollment(
  p_student_id uuid,
  p_course_id uuid,
  p_amount numeric,
  p_trx_id text,
  p_admin_id uuid,
  p_payment_date timestamptz default now()
) returns void language plpgsql security definer as $$
declare
  v_order_id uuid;
  v_order_item_id uuid;
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  insert into orders (student_id, total_amount, status, created_at)
  values (p_student_id, p_amount, 'completed', coalesce(p_payment_date, now()))
  returning id into v_order_id;

  insert into order_items (order_id, item_type, course_id, unit_price_amount, created_at)
  values (v_order_id, 'course', p_course_id, p_amount, coalesce(p_payment_date, now()))
  returning id into v_order_item_id;

  insert into payments (order_id, kind, method, amount, trx_id, entered_by, created_at)
  values (v_order_id, 'payment', 'manual', p_amount, p_trx_id, p_admin_id, coalesce(p_payment_date, now()));

  insert into enrollments (student_id, course_id, source, order_item_id, created_at)
  values (p_student_id, p_course_id, 'admin', v_order_item_id, coalesce(p_payment_date, now()))
  on conflict (student_id, course_id) do update 
  set updated_at = now();
end;
$$;
