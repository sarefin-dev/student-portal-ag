-- Add coming_soon to courses status check constraint
ALTER TABLE courses DROP CONSTRAINT courses_status_check;
ALTER TABLE courses ADD CONSTRAINT courses_status_check CHECK (status IN ('draft', 'active', 'archived', 'deactivated', 'coming_soon'));
