# Notifications

- Preference gate: request OS permission only after the user enables notifications.
- Quiet hours on profile / notification_preferences suppress delivery.
- Outbox table schedules future deliveries; Edge Function drains due rows.

## Free-tier cron limits

Supabase free tier schedules are limited (typically few cron jobs). Prefer a single `drain-notifications` + `complete-expired-timers` cadence (e.g. every minute) rather than many jobs. Document any hosted project schedule in deployment notes.
