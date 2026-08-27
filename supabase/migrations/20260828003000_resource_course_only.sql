-- Add is_course_only column to resources
ALTER TABLE resources 
  ADD COLUMN IF NOT EXISTS is_course_only boolean NOT NULL DEFAULT false;

-- Update price check constraint to allow course-only resources without standalone pricing
ALTER TABLE resources DROP CONSTRAINT IF EXISTS chk_resource_price;
ALTER TABLE resources 
  ADD CONSTRAINT chk_resource_price CHECK (is_free = true or is_course_only = true or price_amount is not null);
