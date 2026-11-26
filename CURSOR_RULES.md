# Cursor rules — System

1. Prefer shared packages over duplicating domain logic in apps.
2. Desktop is offline-first (Dexie + sync queue); never drop pending ops silently.
3. Match design tokens exactly; no purple-on-white or cream/terracotta defaults.
4. SQL migrations are the source of truth for schema and RLS.
5. Document free-tier cron limits when adding scheduled jobs.
6. Keep PRs focused; update docs (`docs/*.md`) alongside behavior changes.
