#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${ROOMPACT_APP_DIR:-/opt/roompact-campus}"
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
  echo "[deploy] creating virtualenv"
  "${PYTHON_BIN}" -m venv .venv
fi

echo "[deploy] installing dependencies"
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -e .[dev]

echo "[deploy] running verification"
if command -v pwsh >/dev/null 2>&1; then
  pwsh ./scripts/verify.ps1
else
  .venv/bin/ruff check .
  .venv/bin/pytest
fi

if [ -d "deploy/systemd" ]; then
  echo "[deploy] installing systemd units"
  sudo bash ./scripts/install-systemd-services.sh
fi

echo "[deploy] restarting main backend"
sudo systemctl restart roompact-main-backend.service
sudo systemctl status roompact-main-backend.service --no-pager

if systemctl list-unit-files | grep -q "^roompact-ai-backend.service"; then
  if [ -f "${APP_DIR}/src/ai_backend/app.py" ]; then
    echo "[deploy] restarting ai backend"
    sudo systemctl restart roompact-ai-backend.service
    sudo systemctl status roompact-ai-backend.service --no-pager
  else
    echo "[deploy] ai backend source missing, skipping restart"
  fi
fi

echo "[deploy] completed"
