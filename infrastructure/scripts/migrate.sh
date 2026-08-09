#!/bin/bash
# LANStream — Database migration runner
#
# Usage:
#   ./scripts/migrate.sh          — run pending migrations
#   ./scripts/migrate.sh generate — generate migration files
#   ./scripts/migrate.sh push     — push schema directly (dev only)
#   ./scripts/migrate.sh studio   — open Drizzle Studio

set -euo pipefail

cd "$(dirname "$0")/.."

case "${1:-migrate}" in
  generate)
    echo "Generating migrations..."
    pnpm --filter @lanstream/portal exec drizzle-kit generate
    ;;
  push)
    echo "Pushing schema directly (dev only)..."
    pnpm --filter @lanstream/portal exec drizzle-kit push
    ;;
  studio)
    echo "Opening Drizzle Studio..."
    pnpm --filter @lanstream/portal exec drizzle-kit studio
    ;;
  migrate)
    echo "Running migrations..."
    pnpm --filter @lanstream/portal exec drizzle-kit migrate
    ;;
  *)
    echo "Usage: $0 {migrate|generate|push|studio}"
    exit 1
    ;;
esac
