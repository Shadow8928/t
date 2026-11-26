# Database

Migrations: `supabase/migrations/`.

## Tables (12+)

profiles, devices, tasks, task_occurrences, timer_sessions, routines, routine_steps, routine_executions, sync_ops, sync_cursors, notification_preferences, notification_outbox

## RLS

Every user-owned table has RLS scoped to `auth.uid()`.

## Timer RPCs

`start_timer`, `pause_timer`, `resume_timer`, `cancel_timer`, `complete_expired_timer` — exclusivity via unique partial index on `(user_id) where state in ('running','paused')`.

## Local workflow

```bash
npx supabase start   # requires Docker
npx supabase db reset
```

Without Docker, apply SQL manually or use a hosted project with credentials in `.env` (never commit secrets).
