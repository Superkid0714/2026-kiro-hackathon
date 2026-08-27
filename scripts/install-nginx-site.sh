#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/opt/roompact-campus}"
NGINX_AVAILABLE="/etc/nginx/sites-available/roompact"
NGINX_ENABLED="/etc/nginx/sites-enabled/roompact"
SOURCE_CONF="${APP_DIR}/deploy/nginx/roompact.conf"

if [ ! -f "${SOURCE_CONF}" ]; then
  echo "[nginx] config not found: ${SOURCE_CONF}"
  exit 1
fi

sudo apt-get update
sudo apt-get install -y nginx

sudo cp "${SOURCE_CONF}" "${NGINX_AVAILABLE}"
sudo ln -sfn "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
