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
sudo -u postgres psql -d "${APP_DB}" -v ON_ERROR_STOP=1 <<SQL
ALTER DATABASE ${APP_DB} OWNER TO ${APP_USER};
ALTER SCHEMA public OWNER TO ${APP_USER};
GRANT ALL PRIVILEGES ON SCHEMA public TO ${APP_USER};
ALTER TABLE IF EXISTS profiles OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS profile_interviews OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS profile_recommendations OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS users OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS sessions OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS match_results OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS match_requests OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS chat_rooms OWNER TO ${APP_USER};
ALTER TABLE IF EXISTS chat_messages OWNER TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE profiles TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE profile_interviews TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE profile_recommendations TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE users TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE sessions TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE match_results TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE match_requests TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE chat_rooms TO ${APP_USER};
GRANT ALL PRIVILEGES ON TABLE chat_messages TO ${APP_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${APP_USER};
SQL
