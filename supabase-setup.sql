-- Run this in your Supabase project → SQL Editor

create table if not exists workout_days (
  id                uuid primary key default gen_random_uuid(),
  day_number        int  not null unique,
  scheduled_date    date not null,
  original_date     date not null,
  is_rescheduled    boolean default false,
  status            text default 'pending'
                    check (status in ('pending','completed','skipped')),
  completed_at      timestamptz,
  exercises_checked text[] default '{}',
  notes             text default '',
  image_url         text,
  body_weight       numeric,
  updated_at        timestamptz default now()
);

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
