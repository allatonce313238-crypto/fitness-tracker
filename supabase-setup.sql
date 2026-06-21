-- Run this in your Supabase project → SQL Editor

-- 1. Create the workout_days table
create table if not exists workout_days (
  id              uuid primary key default gen_random_uuid(),
  day_number      int  not null unique,
  current_date    date not null,
  original_date   date not null,
  is_rescheduled  boolean default false,
  status          text default 'pending'
                  check (status in ('pending','completed','skipped')),
  completed_at    timestamptz,
  exercises_checked text[] default '{}',
  notes           text default '',
  image_url       text,
  body_weight     numeric,
  updated_at      timestamptz default now()
);

-- 2. Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workout_days_updated_at
  before update on workout_days
  for each row execute procedure set_updated_at();

-- 3. (Optional) disable RLS — single anonymous user, no auth
-- If you want to be safe, enable RLS and allow anon select/insert/update:
-- alter table workout_days enable row level security;
-- create policy "anon full access" on workout_days
--   for all using (true) with check (true);

-- ──────────────────────────────────────────────
-- Storage: create the workout-images bucket
-- ──────────────────────────────────────────────
-- In Supabase dashboard → Storage → New bucket:
--   Name:   workout-images
--   Public: true   (so image URLs are directly readable)
--
-- Or via SQL (storage schema is managed by Supabase internals,
-- so use the dashboard UI for the bucket):
--   Dashboard → Storage → Create bucket → "workout-images" → Public ✓
