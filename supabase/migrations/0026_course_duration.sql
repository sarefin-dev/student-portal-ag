-- Add a text-based duration field to courses (e.g., '10 Hours', '6 Weeks')
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration text;
