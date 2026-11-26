# Development

## Prerequisites

- Node 20+, pnpm 10+
- Docker (for local Supabase)
- macOS + Xcode 15+ (iOS only)

## Setup

```bash
cp .env.example .env
pnpm install
pnpm --filter @system/domain test
pnpm dev
```

## iOS (macOS)

```bash
open apps/ios/System.xcodeproj
# Select a simulator or device
# Signing: set Team in Signing & Capabilities
# Run SystemTests target for XCTest
```

Linux agents implement Swift sources only; binary build is documented, not executed here.

## Repo rename

GitHub host is currently `Shadow8928/t`. Renaming the repository to `system` is recommended.
