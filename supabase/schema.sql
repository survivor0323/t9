-- ============================================================
-- M.hub DB Schema
-- ============================================================

-- profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  quiz_score integer default 0
);

alter table profiles enable row level security;
create policy "Profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile." on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- projects
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  type text default 'webapp' check (type in ('webapp', 'document')),
  status text default 'draft' check (status in ('draft', 'public', 'hidden')),
  description text,
  url text,
  file_url text,
  github_url text,
  tags text[] default '{}',
  category text,
  screenshots text[] default '{}',
  views integer default 0,
  clicks integer default 0,
  is_featured boolean default false,
  difficulty text check (difficulty in ('low', 'medium', 'high')),
  ai_feedback text,
  ai_feedback_at timestamp with time zone
);

alter table projects enable row level security;

create policy "Public projects are viewable by everyone." on projects
  for select using (status = 'public');

create policy "Owners can view their own projects." on projects
  for select using (auth.uid() = user_id);

create policy "Admins can view all projects." on projects
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Users can create their own projects." on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects." on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects." on projects
  for delete using (auth.uid() = user_id);

create policy "Admins can update any project." on projects
  for update using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete any project." on projects
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- reviews
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  unique(project_id, user_id)
);

alter table reviews enable row level security;
create policy "Reviews are viewable by everyone." on reviews for select using (true);
create policy "Authenticated users can create reviews." on reviews
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own reviews." on reviews
  for update using (auth.uid() = user_id);
create policy "Users can delete their own reviews." on reviews
  for delete using (auth.uid() = user_id);

-- bookmarks
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  unique(user_id, project_id)
);

alter table bookmarks enable row level security;
create policy "Users can view their own bookmarks." on bookmarks
  for select using (auth.uid() = user_id);
create policy "Users can create their own bookmarks." on bookmarks
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own bookmarks." on bookmarks
  for delete using (auth.uid() = user_id);

-- quiz_questions
create table if not exists quiz_questions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date unique,
  question text not null,
  options jsonb not null,
  answer integer not null,
  explanation text
);

alter table quiz_questions enable row level security;
create policy "Quiz questions viewable by authenticated users." on quiz_questions
  for select using (auth.uid() is not null);
create policy "Admins can manage quiz questions." on quiz_questions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- quiz_submissions
create table if not exists quiz_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  question_id uuid references quiz_questions(id) on delete cascade not null,
  is_correct boolean not null,
  unique(user_id, question_id)
);

alter table quiz_submissions enable row level security;
create policy "Users can view their own submissions." on quiz_submissions
  for select using (auth.uid() = user_id);
create policy "Users can submit their own answers." on quiz_submissions
  for insert with check (auth.uid() = user_id);

-- Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table projects;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Increment view count
create or replace function increment_views(project_id uuid)
returns void as $$
begin
  update projects set views = views + 1 where id = project_id;
end;
$$ language plpgsql security definer;

-- Increment click count
create or replace function increment_clicks(project_id uuid)
returns void as $$
begin
  update projects set clicks = clicks + 1 where id = project_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Storage buckets
-- ============================================================

-- screenshots bucket (public)
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- documents bucket (public)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Storage policies: screenshots
create policy "Authenticated users can upload screenshots"
  on storage.objects for insert
  with check (bucket_id = 'screenshots' and auth.uid() is not null);

create policy "Screenshots are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'screenshots');

create policy "Users can delete their own screenshots"
  on storage.objects for delete
  using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: documents
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "Documents are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Users can delete their own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
