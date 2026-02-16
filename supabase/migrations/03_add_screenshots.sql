-- Add screenshots column to projects
alter table public.projects 
add column if not exists screenshots text[] default array[]::text[];
