#!/usr/bin/env bash
set -euo pipefail
# Lightweight structural check without a live Postgres.
root="$(cd "$(dirname "$0")/.." && pwd)"
migrations="$root/supabase/migrations"
required=(
  "create table public.profiles"
  "create table public.tasks"
  "create table public.timer_sessions"
  "create unique index timer_sessions_one_active_per_user"
  "create or replace function public.start_timer"
  "enable row level security"
)
combined="$(cat "$migrations"/*.sql)"
for needle in "${required[@]}"; do
  if ! grep -Fqi "$needle" <<<"$combined"; then
    echo "MISSING: $needle"
    exit 1
  fi
  echo "OK: $needle"
done
echo "SQL structural validation passed."
