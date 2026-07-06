#!/usr/bin/env bash
# rollback-migration.sh — Mark the last applied Prisma migration as rolled back
# Use this when a migration needs to be reverted in production.
#
# IMPORTANT: This script marks the migration as rolled back in Prisma's
# _prisma_migrations table. You must also manually revert the schema changes
# in the database before running this script.
#
# Usage: DATABASE_URL="postgresql://..." ./scripts/rollback-migration.sh [migration-name]
#
# If no migration name is provided, it will show the last applied migration.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_PATH="$SCRIPT_DIR/../../prisma/schema.prisma"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL environment variable is required"
  exit 1
fi

MIGRATION_NAME="${1:-}"

if [ -z "$MIGRATION_NAME" ]; then
  echo "ℹ️  No migration name provided. Showing last 5 applied migrations:"
  echo ""
  psql "$DATABASE_URL" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
  echo ""
  echo "Usage: $0 <migration-name>"
  echo "Example: $0 20240101000000_add_performance_indexes"
  exit 0
fi

echo "⚠️  Rolling back migration: $MIGRATION_NAME"
echo "   This marks it as rolled back in Prisma's tracking table."
echo "   Ensure you have manually reverted the database schema changes first."
echo ""
read -r -p "Continue? (y/N) " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

npx prisma migrate resolve \
  --rolled-back "$MIGRATION_NAME" \
  --schema="$SCHEMA_PATH"

echo "✅ Migration '$MIGRATION_NAME' marked as rolled back."
