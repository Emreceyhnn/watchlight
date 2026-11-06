#!/bin/sh
set -e

export CHECKPOINT_DISABLE=1
export PRISMA_HIDE_UPDATE_MESSAGE=1

cd /app 2>/dev/null || true
SCHEMA=packages/db/prisma/schema.prisma
PRISMA=packages/db/node_modules/.bin/prisma
TSX=packages/db/node_modules/.bin/tsx

echo "[db-init] applying pending migrations..."
if ! "$PRISMA" migrate deploy --schema "$SCHEMA" > /tmp/migrate_deploy.txt 2>&1; then
  cat /tmp/migrate_deploy.txt
  if grep -q "P3005" /tmp/migrate_deploy.txt; then
    echo "[db-init] database schema predates migration history — baselining as applied"
    "$PRISMA" migrate resolve --applied 20261104140130_init --schema "$SCHEMA"
    "$PRISMA" migrate deploy --schema "$SCHEMA"
  else
    exit 1
  fi
else
  cat /tmp/migrate_deploy.txt
fi

echo "[db-init] seeding (upsert-based — safe to re-run)..."
"$TSX" packages/db/prisma/seed.ts

echo "[db-init] done."
