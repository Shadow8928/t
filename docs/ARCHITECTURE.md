# Architecture

System is an offline-first personal productivity OS with three tiers:

| Layer | Tech |
|-------|------|
| Desktop | Vite + React + TypeScript PWA, Dexie (IndexedDB), Tailwind |
| iOS | Native SwiftUI + SwiftData + Keychain |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |

Shared TypeScript domain lives in `packages/domain` (recurrence, timer math, validation). API shapes live in `packages/api-contracts`. Visual tokens live in `packages/design-tokens`.

## Layout

- Desktop: left nav · main content · right timer panel
- iOS: bottom tabs (Today, Schedule, Routines, History, Settings)

## Authority

- PostgreSQL is source of truth when online.
- Local Dexie / SwiftData hold provisional state; sync queue never silently drops ops.
- One active timer per user enforced by partial unique index + RPCs.
