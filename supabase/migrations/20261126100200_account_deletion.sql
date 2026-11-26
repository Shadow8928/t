-- Soft account deletion: mark profile, cascade ownership remains via auth delete path.
-- Client should call Auth admin/user delete; this RPC clears personal data while signed in.

create or replace function public.delete_own_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  delete from public.notification_outbox where user_id = v_uid;
  delete from public.sync_ops where user_id = v_uid;
  delete from public.sync_cursors where user_id = v_uid;
  delete from public.timer_sessions where user_id = v_uid;
  delete from public.routine_executions where user_id = v_uid;
  delete from public.routine_steps where user_id = v_uid;
  delete from public.routines where user_id = v_uid;
  delete from public.task_occurrences where user_id = v_uid;
  delete from public.tasks where user_id = v_uid;
  delete from public.devices where user_id = v_uid;
  delete from public.notification_preferences where user_id = v_uid;
  delete from public.profiles where id = v_uid;

  -- Remove auth user (requires security definer)
  delete from auth.users where id = v_uid;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
