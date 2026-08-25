DO $$
DECLARE
    const_name text;
BEGIN
    SELECT conname INTO const_name
    FROM pg_constraint
    JOIN pg_class ON conrelid = pg_class.oid
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE pg_class.relname = 'leads' 
      AND pg_namespace.nspname = 'public'
      AND contype = 'c'
      AND pg_get_constraintdef(pg_constraint.oid) LIKE '%new%';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.leads DROP CONSTRAINT ' || quote_ident(const_name);
    END IF;
END $$;

ALTER TABLE public.leads 
  ADD CONSTRAINT leads_status_check 
  CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost', 'bad'));

ALTER TABLE public.leads ADD CONSTRAINT leads_phone_interest_key UNIQUE (phone, interested_in);
