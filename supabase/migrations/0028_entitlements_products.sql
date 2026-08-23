-- ============================================================================
-- 0028_entitlements_products.sql
-- Massive refactor to introduce Products (SKUs), Services, and Entitlements.
-- ============================================================================

-- 1) WHAT YOU SELL — the SKU the marketing site lists and checkout charges for
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  kind text NOT NULL check (kind in ('single', 'bundle', 'service')),
  title text, 
  tagline text, 
  description text,
  price_amount numeric(12,2) NOT NULL DEFAULT 0, 
  currency text DEFAULT 'BDT',
  compare_at_amount numeric(12,2),
  pricing_model text DEFAULT 'one_time' check (pricing_model in ('free', 'one_time', 'installment')),
  status text DEFAULT 'draft' check (status in ('draft', 'active', 'archived', 'deactivated')),
  listed_on_site boolean DEFAULT false,
  is_featured boolean DEFAULT false, 
  featured_rank int,
  enrollment_state text DEFAULT 'open' check (enrollment_state in ('open', 'waitlist', 'coming_soon', 'closed')),
  thumbnail_url text, 
  og_image_url text, 
  seo_title text, 
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
create trigger trg_products_updated_at before update on products for each row execute function set_updated_at();

-- 2) WHAT A PRODUCT GRANTS — a single has 1 row, a bundle has many
CREATE TABLE product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  item_type text NOT NULL check (item_type in ('course', 'digital_asset', 'service')),
  item_id uuid NOT NULL, -- references courses(id) or digital_assets(id) or services(id)
  quantity int DEFAULT 1,
  is_free boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) SERVICES — human-delivered offerings
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE, 
  title text, 
  description text,
  service_type text NOT NULL check (service_type in ('cv_review', 'architecture_review', 'consulting_call', 'mentorship')),
  delivery_format text NOT NULL check (delivery_format in ('async_written', 'live_call')),
  duration_minutes int, 
  sessions_count int DEFAULT 1,
  turnaround_days int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) ENTITLEMENTS — the general "who has access to what, from which purchase"
CREATE TABLE entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  item_type text NOT NULL check (item_type in ('course', 'digital_asset', 'service')),
  item_id uuid NOT NULL,
  source_product_id uuid REFERENCES products(id),
  order_id uuid, -- references orders(id)
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz, 
  status text DEFAULT 'active' check (status in ('active', 'revoked', 'expired'))
);

-- 5) SERVICE FULFILLMENT — redeeming a purchased service
CREATE TABLE service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id uuid NOT NULL REFERENCES entitlements(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  service_id uuid NOT NULL REFERENCES services(id),
  status text DEFAULT 'pending' check (status in ('pending', 'scheduled', 'in_progress', 'delivered', 'closed')),
  scheduled_at timestamptz,
  input_url text,                   
  deliverable_url text,             
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
create trigger trg_service_bookings_updated_at before update on service_bookings for each row execute function set_updated_at();

-- 6) DIGITAL ASSETS (eBooks/Resources)
-- Update courses to allow ebook and digital_download
ALTER TABLE courses DROP CONSTRAINT courses_type_check;
ALTER TABLE courses ADD CONSTRAINT courses_type_check CHECK (type in ('live_cohort', 'recorded', 'text_based', 'mixed', 'ebook', 'digital_download'));

CREATE TABLE digital_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  asset_type text NOT NULL check (asset_type in ('pdf', 'epub', 'zip', 'audio', 'video_file', 'resource')),
  file_url text NOT NULL,
  file_size_kb integer,
  is_preview boolean NOT NULL DEFAULT false,
  version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 7) UPDATE ORDER ITEMS TO LINK TO PRODUCTS
-- We need to add product_id to order_items, because now checkout charges for a product.
ALTER TABLE order_items ADD COLUMN product_id uuid REFERENCES products(id);
ALTER TABLE order_items DROP CONSTRAINT chk_order_item_target;
-- An order item must target EITHER a course, a bundle, a resource, OR a product (the new way)
ALTER TABLE order_items ADD CONSTRAINT chk_order_item_target CHECK (
  (course_id is not null)::int + (bundle_id is not null)::int + (resource_id is not null)::int + (product_id is not null)::int = 1
);
-- Allow item_type to be 'product'
ALTER TABLE order_items DROP CONSTRAINT order_items_item_type_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_item_type_check CHECK (item_type in ('course', 'bundle', 'resource', 'product'));

-- RLS Policies
alter table products enable row level security;
create policy products_select_public on products for select using (listed_on_site = true or is_admin());
create policy products_write_admin on products for all using (is_admin()) with check (is_admin());

alter table product_items enable row level security;
create policy product_items_select_public on product_items for select using (true);
create policy product_items_write_admin on product_items for all using (is_admin()) with check (is_admin());

alter table services enable row level security;
create policy services_select_public on services for select using (true);
create policy services_write_admin on services for all using (is_admin()) with check (is_admin());

alter table entitlements enable row level security;
create policy entitlements_select on entitlements for select using (user_id = auth.uid() or is_admin());
create policy entitlements_write_admin on entitlements for all using (is_admin()) with check (is_admin());

alter table service_bookings enable row level security;
create policy service_bookings_select on service_bookings for select using (user_id = auth.uid() or is_admin());
create policy service_bookings_write_admin on service_bookings for all using (is_admin()) with check (is_admin());
