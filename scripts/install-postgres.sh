#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/opt/roompact-campus}"
BACKEND_ENV="${APP_DIR}/backend/.env"
SCHEMA_PATH="${APP_DIR}/deploy/postgres/schema.sql"

if [ ! -f "${BACKEND_ENV}" ]; then
  echo "[postgres] missing env file: ${BACKEND_ENV}"
  exit 1
fi

set -a
. "${BACKEND_ENV}"
set +a

APP_DB="${ROOMPACT_POSTGRES_DB:-roompact_campus}"
APP_USER="${ROOMPACT_POSTGRES_USER:-roompact}"
APP_PASSWORD="${ROOMPACT_POSTGRES_PASSWORD:-roompact2026}"

sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl restart postgresql

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${APP_USER}') THEN
        CREATE ROLE ${APP_USER} LOGIN PASSWORD '${APP_PASSWORD}';
    ELSE
        ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}';
    END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_DB}'" | grep -q 1; then
  sudo -u postgres createdb -O "${APP_USER}" "${APP_DB}"
fi

if [ ! -f "${SCHEMA_PATH}" ]; then
  echo "[postgres] missing schema file: ${SCHEMA_PATH}"
  exit 1
fi

sudo -u postgres psql -d "${APP_DB}" -f "${SCHEMA_PATH}"
