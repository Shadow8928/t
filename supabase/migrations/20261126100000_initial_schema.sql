-- System initial schema: profiles, devices, tasks, occurrences, timers, routines, sync, notifications
-- Default timezone: America/Chicago

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  new.version = coalesce(old.version, 0) + 1;
  return new;
end;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  timezone text not null default 'America/Chicago',
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. devices
-- ---------------------------------------------------------------------------
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_name text not null,
  platform text not null check (platform in ('desktop', 'ios', 'web')),
  push_token text,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1
);

create index devices_user_id_idx on public.devices (user_id);
create trigger devices_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  notes text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  fixed_time boolean not null default false,
  scheduled_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 1),
  recurrence jsonb,
  parent_task_id uuid references public.tasks (id) on delete set null,
  parent_occurrence_date date,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1,
  constraint fixed_time_requires_schedule check (
    fixed_time = false
    or scheduled_at is not null
    or recurrence is not null
  )
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_user_status_idx on public.tasks (user_id, status) where deleted_at is null;
create index tasks_user_scheduled_idx on public.tasks (user_id, scheduled_at)
  where deleted_at is null and scheduled_at is not null;
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. task_occurrences (materialized horizon + history)
-- ---------------------------------------------------------------------------
create table public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  occurrence_date date not null,
  scheduled_at timestamptz,
  fixed_time boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1,
  unique (task_id, occurrence_date)
);

create index task_occurrences_user_date_idx on public.task_occurrences (user_id, occurrence_date);
create trigger task_occurrences_updated_at
  before update on public.task_occurrences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. timer_sessions (one active per user enforced via partial unique index + RPCs)
-- ---------------------------------------------------------------------------
create table public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  routine_step_id uuid,
  state text not null check (state in ('running', 'paused', 'completed', 'cancelled')),
  started_at timestamptz not null,
  ends_at timestamptz not null,
  paused_at timestamptz,
  remaining_ms_when_paused bigint,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1
);

create index timer_sessions_user_id_idx on public.timer_sessions (user_id);
create unique index timer_sessions_one_active_per_user
  on public.timer_sessions (user_id)
  where state in ('running', 'paused');
create trigger timer_sessions_updated_at
  before update on public.timer_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. routines
-- ---------------------------------------------------------------------------
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('morning', 'night', 'custom')),
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1
);

create index routines_user_id_idx on public.routines (user_id);
create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. routine_steps
-- ---------------------------------------------------------------------------
create table public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  duration_minutes integer not null check (duration_minutes >= 1),
  sort_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1,
  unique (routine_id, sort_order)
);

create index routine_steps_routine_id_idx on public.routine_steps (routine_id);
create trigger routine_steps_updated_at
  before update on public.routine_steps
  for each row execute function public.set_updated_at();

alter table public.timer_sessions
  add constraint timer_sessions_routine_step_fk
  foreign key (routine_step_id) references public.routine_steps (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 8. routine_executions (history preserved)
-- ---------------------------------------------------------------------------
create table public.routine_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1
);

create index routine_executions_user_idx on public.routine_executions (user_id, started_at desc);
create trigger routine_executions_updated_at
  before update on public.routine_executions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. sync_ops (server log / tombstones companion)
-- ---------------------------------------------------------------------------
create table public.sync_ops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  client_op_id text not null,
  entity_type text not null,
  entity_id uuid not null,
  op text not null check (op in ('create', 'update', 'delete')),
  payload jsonb not null default '{}'::jsonb,
  base_version integer,
  applied boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, client_op_id)
);

create index sync_ops_user_created_idx on public.sync_ops (user_id, created_at);

-- ---------------------------------------------------------------------------
-- 10. sync_cursors
-- ---------------------------------------------------------------------------
create table public.sync_cursors (
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id uuid not null references public.devices (id) on delete cascade,
  cursor timestamptz not null default '1970-01-01'::timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, device_id)
);

-- ---------------------------------------------------------------------------
-- 11. notification_preferences
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default false,
  task_reminders boolean not null default true,
  timer_alerts boolean not null default true,
  routine_prompts boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  permission_requested_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  version integer not null default 1
);

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. notification_outbox
-- ---------------------------------------------------------------------------
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  payload jsonb not null default '{}'::jsonb,
  deliver_at timestamptz not null,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index notification_outbox_due_idx
  on public.notification_outbox (deliver_at)
  where delivered_at is null and cancelled_at is null;

-- ---------------------------------------------------------------------------
-- Profile bootstrap on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, timezone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'timezone', 'America/Chicago')
  );
  insert into public.notification_preferences (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.tasks enable row level security;
alter table public.task_occurrences enable row level security;
alter table public.timer_sessions enable row level security;
alter table public.routines enable row level security;
alter table public.routine_steps enable row level security;
alter table public.routine_executions enable row level security;
alter table public.sync_ops enable row level security;
alter table public.sync_cursors enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_outbox enable row level security;

create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

create policy devices_all_own on public.devices for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tasks_all_own on public.tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy task_occurrences_all_own on public.task_occurrences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy timer_sessions_all_own on public.timer_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy routines_all_own on public.routines for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy routine_steps_all_own on public.routine_steps for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy routine_executions_all_own on public.routine_executions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sync_ops_all_own on public.sync_ops for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sync_cursors_all_own on public.sync_cursors for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_all_own on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_outbox_select_own on public.notification_outbox for select using (user_id = auth.uid());
create policy notification_outbox_update_own on public.notification_outbox for update using (user_id = auth.uid());
