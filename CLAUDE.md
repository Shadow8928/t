# Claude / agent guidance — System

- Product name is **System**. GitHub host may still be `Shadow8928/t`; prefer renaming to `system`.
- Default timezone: `America/Chicago`.
- Dark design tokens live in `packages/design-tokens`. Do not invent a logo; text wordmark only until `assets/branding/original-logo/` is supplied.
- Domain logic (recurrence, timer remaining, validation) belongs in `packages/domain` and must stay covered by Vitest.
- One active timer per user — use Supabase RPCs (`start_timer`, `pause_timer`, `resume_timer`, `cancel_timer`, `complete_expired_timer`).
- Never commit secrets. Use `.env.example` as the template.
- iOS sources are in `apps/ios`; binary builds require macOS/Xcode.
- Update `PROJECT_STATUS.md` when completing phases.
