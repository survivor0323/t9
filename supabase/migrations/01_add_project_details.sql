-- Add new columns to the existing projects table
alter table public.projects 
add column if not exists url text,
add column if not exists description text;

-- Ensure RLS is still enabled (it should be, but good to double check safety)
alter table projects enable row level security;
