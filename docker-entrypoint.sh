#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_DB:-}" ]; then
    POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
    POSTGRES_PORT="${POSTGRES_PORT:-5432}"
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
  else
    echo "[entrypoint] DATABASE_URL is not set and POSTGRES_* fallback vars are missing." >&2
    echo "[entrypoint] Set DATABASE_URL or provide POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB." >&2
    exit 1
  fi
fi

./node_modules/.bin/prisma migrate deploy
exec node dist/server.js
