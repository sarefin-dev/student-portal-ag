DO $$
DECLARE
    const_name text;
BEGIN
    SELECT conname INTO const_name
    FROM pg_constraint
    JOIN pg_class ON conrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_class.relname = 'courses' 
      AND pg_namespace.nspname = 'public'
      AND contype = 'c'
      AND pg_get_constraintdef(pg_constraint.oid) LIKE '%live_cohort%';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.courses DROP CONSTRAINT ' || quote_ident(const_name);
    END IF;
END $$;

ALTER TABLE public.courses 
  ADD CONSTRAINT courses_type_check 
  CHECK (type IN ('live_cohort', 'recorded', 'text_based', 'mixed', 'in_person'));
