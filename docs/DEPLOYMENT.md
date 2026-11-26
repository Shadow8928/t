# Deployment

## Desktop PWA

```bash
pnpm install
pnpm build
# Serve apps/desktop/dist behind HTTPS (required for PWA + notifications)
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time.

## Supabase

1. Create a project (or use local CLI + Docker).
2. `npx supabase db push` / link project.
3. Deploy Edge Functions under `supabase/functions/`.
4. Configure Auth redirect URLs for the PWA origin.

## iOS

Requires macOS + Xcode. See `docs/DEVELOPMENT.md` for signing. Do not expect Linux CI to produce an `.ipa`.
