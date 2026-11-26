# System

**Your day. Under control.**

Personal productivity operating system — offline-first desktop PWA + native iOS, backed by Supabase.

> GitHub host is currently [`Shadow8928/t`](https://github.com/Shadow8928/t). Renaming the repository to `system` is recommended.

## Monorepo

| Path | Purpose |
|------|---------|
| `apps/desktop` | Vite + React + TypeScript PWA (Dexie, Tailwind) |
| `apps/ios` | Native SwiftUI + SwiftData (build on macOS/Xcode) |
| `packages/domain` | Shared domain: recurrence, timer, validation |
| `packages/api-contracts` | DTO / RPC shapes |
| `packages/design-tokens` | Dark charcoal + green accent tokens |
| `supabase/` | Migrations, RLS, timer RPCs, Edge Functions |
| `docs/` | Architecture, sync, offline, deployment |

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm --filter @system/domain test
pnpm dev
```

Local Supabase (requires Docker):

```bash
npx supabase start
npx supabase db reset
# copy anon key into .env
```

Without Supabase credentials, the desktop app offers **Continue offline (local demo)**.

## Tests

```bash
pnpm test                 # domain + desktop unit
pnpm --filter @system/desktop test:e2e   # Playwright (starts Vite)
```

iOS XCTest: open `apps/ios/System.xcodeproj` on macOS and run **SystemTests**.

## Branding

Official logo: `assets/branding/original-logo/system-logo.png` (preserved unchanged).  
Packaging sizes (PWA / favicon / iOS AppIcon) are resized derivatives only — regenerate with `python3 scripts/generate-brand-icons.py`.

## Security

Never commit secrets. See `SECURITY.md` and `.env.example`.
