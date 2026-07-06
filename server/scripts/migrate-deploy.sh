#!/usr/bin/env bash
# migrate-deploy.sh — Run Prisma production migrations
# Usage: ./scripts/migrate-deploy.sh
# Exits non-zero on failure so CI/CD pipelines can detect migration errors.

set -euo pipefail

echo "🗄  Running Prisma production migrations..."

# Resolve the schema path relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_PATH="$SCRIPT_DIR/../../prisma/schema.prisma"

if [ ! -f "$SCHEMA_PATH" ]; then
  echo "❌ Schema not found at: $SCHEMA_PATH"
  exit 1
fi

npx prisma migrate deploy --schema="$SCHEMA_PATH"

echo "✅ Migrations applied successfully."
