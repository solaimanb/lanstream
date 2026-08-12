#!/bin/bash
# LANStream — Production deploy script
#
# Pulls latest code, rebuilds Docker containers, runs migrations, and restarts.
# Called by GitHub Actions or run manually.
#
# Usage:
#   ./scripts/deploy.sh              — full deploy
#   ./scripts/deploy.sh portal       — rebuild portal only
#   ./scripts/deploy.sh host         — rebuild host only

set -euo pipefail

REPO_DIR="/var/www/lanstream"
COMPOSE_DIR="$REPO_DIR/infrastructure/compose"
COMPOSE_CMD="docker compose -f compose.prod.yaml --env-file ../.env"
SERVICE="${1:-}"

cd "$REPO_DIR"

echo "▶ Pulling latest code..."
git fetch origin main
git reset --hard origin/main

cd "$COMPOSE_DIR"

case "$SERVICE" in
  portal)
    echo "▶ Rebuilding portal..."
    sg docker -c "$COMPOSE_CMD up -d --build portal"
    ;;
  host)
    echo "▶ Rebuilding host..."
    sg docker -c "$COMPOSE_CMD up -d --build host"
    ;;
  *)
    echo "▶ Running migrations..."
    sg docker -c "$COMPOSE_CMD up --no-deps migrate"

    echo "▶ Rebuilding all services..."
    sg docker -c "$COMPOSE_CMD up -d --build"
    ;;
esac

echo "▶ Cleaning up old images..."
sg docker -c "docker image prune -f"

echo "✅ Deploy complete — $(date)"
