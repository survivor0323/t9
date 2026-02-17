-- Add rating columns to projects table
alter table projects 
add column if not exists average_rating numeric(3,1) default 0,
add column if not exists review_count integer default 0;

-- Function to calculate and update rating
create or replace function public.update_project_rating()
returns trigger as $$
begin
  update projects
  set 
    average_rating = (
        select coalesce(round(avg(rating), 1), 0) 
        from reviews 
        where project_id = coalesce(new.project_id, old.project_id)
    ),
    review_count = (
        select count(*) 
        from reviews 
        where project_id = coalesce(new.project_id, old.project_id)
    )
  where id = coalesce(new.project_id, old.project_id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run on any review change
drop trigger if exists on_review_change on reviews;
create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure public.update_project_rating();

-- Backfill existing ratings
update projects p
set 
    average_rating = (select coalesce(round(avg(rating), 1), 0) from reviews r where r.project_id = p.id),
    review_count = (select count(*) from reviews r where r.project_id = p.id);
