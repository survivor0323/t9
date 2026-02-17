-- Add card_color column to profiles
alter table profiles 
add column if not exists card_color text;

-- Update the handle_new_user function to assign a random color
create or replace function public.handle_new_user()
returns trigger as $$
declare
  random_color text;
begin
  -- Generate a random hex color
  -- We'll us a set of predefined pastel/nice colors to ensure good contrast, 
  -- or just a simple random hex generator. Let's stick to a simple random hex for now.
  -- Or even better, let's use a postgres snippet to generate a random color.
  -- to_hex(floor(random() * 16777215)::int) ensures a hex value.
  -- lpad ensures it is 6 chars long.
  -- '#' || lpad(to_hex(floor(random() * 16777215)::int), 6, '0')
  
  -- Let's pick from a curated list of nice colors to ensure quality
  -- ['#FFDBF5', '#E4F1EE', '#D9E8FC', '#F0E6EF', '#EBEAD3', '#D4E2D4']
  -- For simplicity in SQL, we'll just generate a random one or leave it null (random assignment in UI fallback)
  -- But user asked for random assignment ON START.
  
  select (array['#eec9d2', '#f4b6c2', '#f6eac2', '#eee6ab', '#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94'])[floor(random() * 9 + 1)] into random_color;

  insert into public.profiles (id, full_name, avatar_url, card_color)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', random_color);
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing users with random colors if they have none
update profiles 
set card_color = (array['#eec9d2', '#f4b6c2', '#f6eac2', '#eee6ab', '#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5', '#ff8b94'])[floor(random() * 9 + 1)]
where card_color is null;
