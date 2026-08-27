#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${ROOMPACT_APP_DIR:-/opt/roompact-campus}"
SYSTEMD_DIR="/etc/systemd/system"

install -m 0644 "deploy/systemd/roompact-main-backend.service" \
  "${SYSTEMD_DIR}/roompact-main-backend.service"
install -m 0644 "deploy/systemd/roompact-ai-backend.service" \
  "${SYSTEMD_DIR}/roompact-ai-backend.service"

sed -i "s|__ROOMPACT_APP_DIR__|${APP_DIR}|g" "${SYSTEMD_DIR}/roompact-main-backend.service"
sed -i "s|__ROOMPACT_APP_DIR__|${APP_DIR}|g" "${SYSTEMD_DIR}/roompact-ai-backend.service"

systemctl daemon-reload
systemctl enable roompact-main-backend.service
systemctl enable roompact-ai-backend.service
