alter table order_items add column if not exists routine_id uuid references routines(id) on delete set null;
