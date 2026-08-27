-- Add is_lead to instructor_assignments to denote the primary instructor for certificates
alter table instructor_assignments add column if not exists is_lead boolean not null default false;
