#!/usr/bin/env bash
# Deploys the latest main branch to the VPS. Run as the 'pathway' user on the server.
# WARNING: this discards uncommitted changes in /opt/pathwaygh (the server should have none).
set -euo pipefail

APP=/opt/pathwaygh
cd "$APP"

echo "== fetching main"
git fetch --quiet origin main
git reset --hard origin/main

echo "== installing requirements"
cd backend
source venv/bin/activate
pip install --quiet -r requirements.txt

echo "== running migrations"
set -a; source /etc/pathwaygh/api.env; set +a
alembic upgrade head

echo "== restarting service"
sudo systemctl restart pathwaygh-api
sleep 3

echo "== health check"
curl -fsS http://127.0.0.1:8000/health
echo
echo "deploy finished at $(date -u +%FT%TZ)"
