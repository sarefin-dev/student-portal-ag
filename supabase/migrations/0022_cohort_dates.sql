-- Add enrollment_cutoff_date and start_date to courses for cohorts
ALTER TABLE courses ADD COLUMN enrollment_cutoff_date timestamptz;
ALTER TABLE courses ADD COLUMN start_date timestamptz;
