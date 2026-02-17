-- Create a new storage bucket for screenshots
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Set up RLS for the storage bucket
create policy "Screenshots are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'screenshots' );

create policy "Users can upload screenshots."
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots' and
    auth.role() = 'authenticated'
  );

create policy "Users can update their own screenshots."
  on storage.objects for update
  using (
    bucket_id = 'screenshots' and
    auth.uid() = owner
  );

create policy "Users can delete their own screenshots."
  on storage.objects for delete
  using (
    bucket_id = 'screenshots' and
    auth.uid() = owner
  );
