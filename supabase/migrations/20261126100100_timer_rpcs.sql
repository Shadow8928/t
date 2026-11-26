-- Timer exclusivity RPCs — authoritative one active timer per user

create or replace function public.start_timer(
  p_duration_ms bigint,
  p_task_id uuid default null,
  p_routine_step_id uuid default null
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.timer_sessions;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;
  if p_duration_ms is null or p_duration_ms < 1000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_state');
  end if;

  if exists (
    select 1 from public.timer_sessions
    where user_id = v_uid and state in ('running', 'paused')
  ) then
    return jsonb_build_object('ok', false, 'error', 'timer_already_active');
  end if;

  insert into public.timer_sessions (
    user_id, task_id, routine_step_id, state, started_at, ends_at
  ) values (
    v_uid, p_task_id, p_routine_step_id, 'running',
    timezone('utc', now()),
    timezone('utc', now()) + make_interval(secs => (p_duration_ms / 1000.0))
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'timer', to_jsonb(v_row)
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'timer_already_active');
end;
$$;

create or replace function public.pause_timer(p_timer_id uuid)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.timer_sessions;
  v_remaining bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  select * into v_row from public.timer_sessions
  where id = p_timer_id and user_id = v_uid for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'timer_not_found');
  end if;
  if v_row.state <> 'running' then
    return jsonb_build_object('ok', false, 'error', 'invalid_state');
  end if;

  v_remaining := greatest(
    0,
    (extract(epoch from (v_row.ends_at - timezone('utc', now()))) * 1000)::bigint
  );

  update public.timer_sessions
  set state = 'paused',
      paused_at = timezone('utc', now()),
      remaining_ms_when_paused = v_remaining
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('ok', true, 'timer', to_jsonb(v_row));
end;
$$;

create or replace function public.resume_timer(p_timer_id uuid)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.timer_sessions;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  select * into v_row from public.timer_sessions
  where id = p_timer_id and user_id = v_uid for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'timer_not_found');
  end if;
  if v_row.state <> 'paused' then
    return jsonb_build_object('ok', false, 'error', 'invalid_state');
  end if;

  update public.timer_sessions
  set state = 'running',
      paused_at = null,
      remaining_ms_when_paused = null,
      ends_at = timezone('utc', now())
        + make_interval(secs => (coalesce(v_row.remaining_ms_when_paused, 0) / 1000.0))
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('ok', true, 'timer', to_jsonb(v_row));
end;
$$;

create or replace function public.cancel_timer(p_timer_id uuid)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.timer_sessions;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  select * into v_row from public.timer_sessions
  where id = p_timer_id and user_id = v_uid for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'timer_not_found');
  end if;
  if v_row.state not in ('running', 'paused') then
    return jsonb_build_object('ok', false, 'error', 'invalid_state');
  end if;

  update public.timer_sessions
  set state = 'cancelled',
      completed_at = timezone('utc', now())
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('ok', true, 'timer', to_jsonb(v_row));
end;
$$;

create or replace function public.complete_expired_timer(p_timer_id uuid default null)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.timer_sessions;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  if p_timer_id is null then
    select * into v_row from public.timer_sessions
    where user_id = v_uid and state = 'running' and ends_at <= timezone('utc', now())
    order by ends_at asc
    limit 1
    for update;
  else
    select * into v_row from public.timer_sessions
    where id = p_timer_id and user_id = v_uid
    for update;
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'timer_not_found');
  end if;
  if v_row.state <> 'running' or v_row.ends_at > timezone('utc', now()) then
    return jsonb_build_object('ok', false, 'error', 'invalid_state');
  end if;

  update public.timer_sessions
  set state = 'completed',
      completed_at = timezone('utc', now())
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('ok', true, 'timer', to_jsonb(v_row));
end;
$$;

grant execute on function public.start_timer(bigint, uuid, uuid) to authenticated;
grant execute on function public.pause_timer(uuid) to authenticated;
grant execute on function public.resume_timer(uuid) to authenticated;
grant execute on function public.cancel_timer(uuid) to authenticated;
grant execute on function public.complete_expired_timer(uuid) to authenticated;
