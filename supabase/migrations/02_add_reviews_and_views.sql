-- Add views column to projects if not exists
alter table public.projects 
add column if not exists views integer default 0;

-- Create reviews table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reviews enable row level security;

create policy "Reviews are viewable by everyone." on reviews
  for select using (true);

create policy "Users can insert their own reviews." on reviews
  for insert with check (auth.uid() = user_id);

-- Restrict one review per user per project (optional, good for integrity)
alter table reviews add constraint unique_user_project_review unique (user_id, project_id);
