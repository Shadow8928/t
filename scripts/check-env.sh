#!/usr/bin/env bash
set -euo pipefail
echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"
if [[ -f .env ]]; then
  echo ".env present (not printing values)"
else
  echo ".env missing — copy from .env.example"
fi
command -v docker >/dev/null && echo "Docker: $(docker --version)" || echo "Docker: not available"
command -v supabase >/dev/null && echo "supabase CLI present" || echo "supabase CLI: use npx supabase"
