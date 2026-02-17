-- Drop the restrictive select policy if it exists
-- (Note: The policy name might vary, so we'll try to drop the likely one or you can drop it manually)
drop policy if exists "Users can view their own projects." on projects;
drop policy if exists "Public projects are viewable by everyone." on projects;

-- Create a new policy that allows everyone to see all projects
create policy "Projects are viewable by everyone."
  on projects for select
  using (true);

-- Ensure write policies are correct (Owner only)
-- Drop existing write policies just in case to avoid conflicts or duplications
drop policy if exists "Users can create their own projects." on projects;
drop policy if exists "Users can update their own projects." on projects;
drop policy if exists "Users can delete their own projects." on projects;

create policy "Users can create their own projects."
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects."
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects."
  on projects for delete
  using (auth.uid() = user_id);
