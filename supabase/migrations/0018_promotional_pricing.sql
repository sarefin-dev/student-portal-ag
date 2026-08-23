-- Add compare_at_price (original price) to courses, resources, and bundles
-- This allows displaying a promotional price alongside the original crossed-out price.

alter table courses
  add column compare_at_price numeric(12,2);

alter table resources
  add column compare_at_price numeric(12,2);

alter table bundles
  add column compare_at_price numeric(12,2);
