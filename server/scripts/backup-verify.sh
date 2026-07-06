#!/usr/bin/env bash
# backup-verify.sh — Verify database backup restoration integrity
# Run after restoring a backup to confirm key tables have data.
# Exits non-zero if any table is empty (indicating a failed restore).
#
# Usage: DATABASE_URL="postgresql://..." ./scripts/backup-verify.sh

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL environment variable is required"
  exit 1
fi

echo "🔍 Verifying backup integrity..."

TABLES=("users" "monsters" "realms" "banners")
FAILED=0

for TABLE in "${TABLES[@]}"; do
  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d ' ')
  if [ -z "$COUNT" ] || [ "$COUNT" -eq 0 ]; then
    echo "❌ Table '$TABLE' is empty or unreachable (count: ${COUNT:-error})"
    FAILED=1
  else
    echo "✅ Table '$TABLE': $COUNT rows"
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo ""
  echo "❌ Backup verification FAILED — one or more tables are empty."
  exit 1
fi

echo ""
echo "✅ Backup verification passed — all key tables have data."
