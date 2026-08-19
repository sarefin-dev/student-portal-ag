-- ============================================================================
-- 0006_storefront_promo.sql
-- Standalone resources, bundles, coupons, referrals, waitlist. These exist
-- before orders/payments (0007) because order_items references them.
-- ============================================================================

create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('article', 'ebook', 'infographic', 'presentation', 'other')),
  is_free boolean not null default false,
  price_amount numeric(12,2),
  currency text not null default 'BDT',
  storage_path text not null,
  watermark_enabled boolean not null default true,
  download_limit int, -- null = unlimited
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_resource_price check (is_free = true or price_amount is not null)
);
create trigger trg_resources_updated_at before update on resources
  for each row execute function set_updated_at();

create table resource_downloads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id),
  student_id uuid not null references profiles(id),
  order_item_id uuid, -- FK added in 0007 (forward reference); null if free
  downloaded_at timestamptz not null default now(),
  ip_address inet,
  created_at timestamptz not null default now()
);
create index idx_resource_downloads_lookup on resource_downloads(resource_id, student_id);

create table bundles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_amount numeric(12,2) not null,
  currency text not null default 'BDT',
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_bundles_updated_at before update on bundles
  for each row execute function set_updated_at();

create table bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references bundles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (bundle_id, course_id)
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12,2) not null,
  max_redemptions int,
  redemption_count int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_coupons_updated_at before update on coupons
  for each row execute function set_updated_at();

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id),
  order_id uuid, -- FK added in 0007 (forward reference)
  student_id uuid not null references profiles(id),
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enforce the redemption cap atomically at insert time (race-safe via the
-- row lock implied by the UPDATE in the same transaction).
create or replace function enforce_coupon_redemption_cap()
returns trigger language plpgsql as $$
declare
  v_max int;
  v_count int;
begin
  select max_redemptions, redemption_count into v_max, v_count
  from coupons where id = new.coupon_id for update;

  if v_max is not null and v_count >= v_max then
    raise exception 'Coupon redemption limit reached';
  end if;

  update coupons set redemption_count = redemption_count + 1 where id = new.coupon_id;
  return new;
end;
$$;
create trigger trg_coupon_redemption_cap
  before insert on coupon_redemptions
  for each row execute function enforce_coupon_redemption_cap();

create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references referral_codes(id),
  referred_student_id uuid not null references profiles(id),
  order_id uuid, -- FK added in 0007 (forward reference)
  credited boolean not null default false,
  created_at timestamptz not null default now()
);

create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  email text not null,
  student_id uuid references profiles(id), -- null if captured pre-account
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (course_id, email)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table resources enable row level security;
create policy resources_select_public on resources for select using (deleted_at is null);
create policy resources_write_admin on resources for all using (is_admin()) with check (is_admin());

alter table resource_downloads enable row level security;
create policy resource_downloads_select_own_or_admin on resource_downloads
  for select using (student_id = auth.uid() or is_admin());
create policy resource_downloads_insert_own on resource_downloads
  for insert with check (student_id = auth.uid());

alter table bundles enable row level security;
create policy bundles_select_public on bundles for select using (deleted_at is null);
create policy bundles_write_admin on bundles for all using (is_admin()) with check (is_admin());

alter table bundle_items enable row level security;
create policy bundle_items_select_public on bundle_items for select using (true);
create policy bundle_items_write_admin on bundle_items for all using (is_admin()) with check (is_admin());

alter table coupons enable row level security;
create policy coupons_select_admin on coupons for select using (is_admin());
-- Coupon validity is checked via a checkout API route running under the
-- service role (so a coupon code's discount value/cap isn't exposed to
-- unauthenticated browsing) — not via direct client-side RLS select.
create policy coupons_write_admin on coupons for all using (is_admin()) with check (is_admin());

alter table coupon_redemptions enable row level security;
create policy coupon_redemptions_select on coupon_redemptions
  for select using (student_id = auth.uid() or is_admin());
create policy coupon_redemptions_write_admin on coupon_redemptions
  for all using (is_admin()) with check (is_admin());
-- Inserts happen via the checkout route (service role); no direct client insert policy.

alter table referral_codes enable row level security;
create policy referral_codes_select_own_or_admin on referral_codes
  for select using (owner_id = auth.uid() or is_admin());
create policy referral_codes_write_admin on referral_codes for all using (is_admin()) with check (is_admin());

alter table referral_attributions enable row level security;
create policy referral_attributions_select_admin on referral_attributions
  for select using (is_admin());
create policy referral_attributions_write_admin on referral_attributions
  for all using (is_admin()) with check (is_admin());

alter table waitlist_entries enable row level security;
create policy waitlist_select_own_or_admin on waitlist_entries
  for select using (student_id = auth.uid() or is_admin());
create policy waitlist_insert_public on waitlist_entries
  for insert with check (true); -- App Flow SYS-08: capturable pre-account
create policy waitlist_write_admin on waitlist_entries
  for update using (is_admin()) with check (is_admin());
