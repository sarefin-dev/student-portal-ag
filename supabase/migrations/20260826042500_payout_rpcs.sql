-- Create an RPC to calculate and generate payouts
create or replace function generate_instructor_payouts() returns int language plpgsql security definer as $$
declare
  v_payout_count int := 0;
  v_instructor record;
  v_payout_amount numeric;
  v_payout_id uuid;
begin
  -- Loop over all instructors who have a payout_percentage > 0
  for v_instructor in 
    select id, payout_percentage 
    from profiles 
    where payout_percentage > 0 
    and role in ('admin', 'instructor')
  loop
    -- Calculate how much they are owed for order items that haven't been paid out yet
    -- The item must belong to an order that is 'completed'
    select coalesce(sum(oi.price * (v_instructor.payout_percentage / 100.0)), 0)
    into v_payout_amount
    from order_items oi
    join orders o on o.id = oi.order_id
    join courses c on c.id = oi.course_id
    join instructor_assignments ia on ia.course_id = c.id
    where ia.instructor_id = v_instructor.id
    and o.status = 'completed'
    and oi.payout_id is null;

    if v_payout_amount > 0 then
      -- 1. Create the payout record
      insert into instructor_payouts (instructor_id, amount, period_start, period_end)
      values (v_instructor.id, v_payout_amount, '2020-01-01'::timestamptz, now())
      returning id into v_payout_id;

      -- 2. Mark the order items as belonging to this payout
      update order_items
      set payout_id = v_payout_id
      where id in (
        select oi.id
        from order_items oi
        join orders o on o.id = oi.order_id
        join courses c on c.id = oi.course_id
        join instructor_assignments ia on ia.course_id = c.id
        where ia.instructor_id = v_instructor.id
        and o.status = 'completed'
        and oi.payout_id is null
      );

      v_payout_count := v_payout_count + 1;
    end if;
  end loop;

  return v_payout_count;
end;
$$;

create or replace function mark_payout_as_paid(p_payout_id uuid, p_admin_id uuid, p_method text, p_trx text) returns void language plpgsql security definer as $$
declare
  v_payout instructor_payouts%rowtype;
  v_payment_id uuid;
begin
  select * into v_payout from instructor_payouts where id = p_payout_id;
  if not found or v_payout.status = 'paid' then
    raise exception 'Payout not found or already paid';
  end if;

  -- 1. Insert into ledger (payments)
  insert into payments (kind, method, amount, currency, trx_id, entered_by)
  values ('payout', p_method, v_payout.amount, 'BDT', p_trx, p_admin_id)
  returning id into v_payment_id;

  -- 2. Update payout status
  update instructor_payouts
  set status = 'paid',
      paid_at = now(),
      payment_id = v_payment_id
  where id = p_payout_id;
end;
$$;
