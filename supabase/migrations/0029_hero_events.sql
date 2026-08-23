-- ============================================================================
-- 0029_hero_events.sql
-- Hero Scheduling and Events Model
-- ============================================================================

-- 1) DEFAULT HERO TOGGLE
ALTER TABLE products ADD COLUMN is_hero_default boolean NOT NULL DEFAULT false;
-- Partial index ensures only one row can ever have is_hero_default = true
CREATE UNIQUE INDEX one_default_hero ON products (is_hero_default) WHERE is_hero_default;

-- 2) HERO SCHEDULE
CREATE TABLE hero_schedule (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  priority      int NOT NULL DEFAULT 0,
  headline      text,
  eyebrow       text,
  cta_label     text,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_hero_schedule_dates ON hero_schedule(starts_at, ends_at) WHERE enabled = true;

-- 3) EXTEND PRODUCTS AND PRODUCT ITEMS FOR EVENTS
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_kind_check;
ALTER TABLE products ADD CONSTRAINT products_kind_check CHECK (kind in ('single', 'bundle', 'service', 'event'));

ALTER TABLE product_items DROP CONSTRAINT IF EXISTS product_items_item_type_check;
ALTER TABLE product_items ADD CONSTRAINT product_items_item_type_check CHECK (item_type in ('course', 'digital_asset', 'service', 'event'));

-- 4) EVENTS TABLE
CREATE TABLE events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  description       text,
  event_type        text NOT NULL CHECK (event_type in ('webinar', 'masterclass', 'workshop', 'launch', 'live_class', 'meetup')),
  format            text NOT NULL CHECK (format in ('online', 'in_person', 'hybrid')),
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz NOT NULL,
  timezone          text NOT NULL DEFAULT 'Asia/Dhaka',
  join_url          text,
  venue             text,
  capacity          int,
  registration_type text NOT NULL DEFAULT 'free' CHECK (registration_type in ('free', 'free_email', 'paid')),
  is_recorded       boolean NOT NULL DEFAULT false,
  recording_url     text,
  host              text,
  cover_image_url   text,
  status            text NOT NULL DEFAULT 'scheduled' CHECK (status in ('scheduled', 'live', 'completed', 'cancelled')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 5) EVENT REGISTRATIONS
CREATE TABLE event_registrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES profiles(id),
  email        text NOT NULL,
  status       text NOT NULL DEFAULT 'registered' CHECK (status in ('registered', 'attended', 'no_show', 'cancelled')),
  entitlement_id uuid REFERENCES entitlements(id),
  registered_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE hero_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY hero_schedule_select_public ON hero_schedule FOR SELECT USING (true);
CREATE POLICY hero_schedule_write_admin ON hero_schedule FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_select_public ON events FOR SELECT USING (true);
CREATE POLICY events_write_admin ON events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_registrations_select ON event_registrations FOR SELECT USING (user_id = auth.uid() or is_admin());
CREATE POLICY event_registrations_write_admin ON event_registrations FOR ALL USING (is_admin()) WITH CHECK (is_admin());
