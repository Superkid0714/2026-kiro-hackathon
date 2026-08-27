#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${ROOMPACT_APP_DIR:-/opt/roompact-campus}"
BACKEND_DIR="${APP_DIR}/backend"
BRANCH="${ROOMPACT_BRANCH:-main}"
PYTHON_BIN="${ROOMPACT_PYTHON_BIN:-python3}"
REPO_URL="${ROOMPACT_REPO:-}"

echo "[deploy] app dir: ${APP_DIR}"
echo "[deploy] branch: ${BRANCH}"

mkdir -p "${APP_DIR}"
cd "${APP_DIR}"

if [ ! -d ".git" ]; then
  if [ -z "${REPO_URL}" ]; then
    echo "[deploy] ROOMPACT_REPO is required on first deploy"
    exit 1
  fi
  echo "[deploy] cloning repository"
  git clone --branch "${BRANCH}" "${REPO_URL}" .
else
  echo "[deploy] syncing repository"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
fi

if [ ! -d ".venv" ]; then
  mkdir -p "${BACKEND_DIR}"
fi

if [ ! -d "${BACKEND_DIR}/.venv" ]; then
  echo "[deploy] creating virtualenv"
  "${PYTHON_BIN}" -m venv "${BACKEND_DIR}/.venv"
fi

echo "[deploy] installing dependencies"
"${BACKEND_DIR}/.venv/bin/pip" install --upgrade pip
"${BACKEND_DIR}/.venv/bin/pip" install -e "${BACKEND_DIR}[dev]"

echo "[deploy] running verification"
cd "${BACKEND_DIR}"
if command -v pwsh >/dev/null 2>&1; then
  pwsh ./scripts/verify.ps1
else
  "${BACKEND_DIR}/.venv/bin/ruff" check .
  "${BACKEND_DIR}/.venv/bin/pytest"
fi

cd "${APP_DIR}"

if [ ! -f "${BACKEND_DIR}/.env" ] && [ -f "${BACKEND_DIR}/.env.example" ]; then
  echo "[deploy] seeding backend .env from .env.example"
  cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
fi

set -a
. "${BACKEND_DIR}/.env"
set +a

if [ "${ROOMPACT_STORAGE_BACKEND:-local}" = "postgres" ]; then
  echo "[deploy] installing postgres"
  bash ./scripts/install-postgres.sh "${APP_DIR}"
fi

if [ -d "deploy/systemd" ]; then
  echo "[deploy] installing systemd units"
  sudo bash ./scripts/install-systemd-services.sh
fi

if [ -f "deploy/nginx/roompact.conf" ]; then
  echo "[deploy] installing nginx site"
  bash ./scripts/install-nginx-site.sh "${APP_DIR}"
fi

echo "[deploy] restarting main backend"
sudo systemctl restart roompact-main-backend.service
sudo systemctl status roompact-main-backend.service --no-pager

if systemctl list-unit-files | grep -q "^roompact-ai-backend.service"; then
  if [ -f "${BACKEND_DIR}/src/ai_backend/app.py" ]; then
    echo "[deploy] restarting ai backend"
    sudo systemctl restart roompact-ai-backend.service
    sudo systemctl status roompact-ai-backend.service --no-pager
  else
    echo "[deploy] ai backend source missing, skipping restart"
  fi
fi

echo "[deploy] checking public api health"
curl --fail --silent http://127.0.0.1/api/health >/dev/null || true

echo "[deploy] completed"
