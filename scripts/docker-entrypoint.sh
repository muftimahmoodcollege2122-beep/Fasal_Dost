#!/bin/sh
# Runs database migrations, then starts the app. If migrations fail the container
# exits non-zero, so AWS keeps the previous healthy version running.
# Set RUN_MIGRATIONS=false to skip (e.g. if you migrate in a separate pipeline step).
set -e
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running database migrations..."
  npx tsx scripts/db-migrate.ts
else
  echo "[entrypoint] RUN_MIGRATIONS=false → skipping migrations"
fi
exec "$@"
