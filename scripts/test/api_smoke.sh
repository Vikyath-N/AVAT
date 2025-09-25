#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/test/api_smoke.sh https://your-api-host/api/v1
BASE_URL=${1:-"http://localhost:8000/api/v1"}

echo "API Smoke Test against: $BASE_URL"

curl -fsSL "$BASE_URL/health" | jq . >/dev/null && echo "[OK] /health"
curl -fsSL "$BASE_URL/stats" | jq . >/dev/null && echo "[OK] /stats"
curl -fsSL "$BASE_URL/accidents?limit=1" | jq . >/dev/null && echo "[OK] /accidents?limit=1"
curl -fsSL "$BASE_URL/analytics/overview" | jq . >/dev/null && echo "[OK] /analytics/overview"
curl -fsSL -X POST "$BASE_URL/reports/sync-index" | jq . >/dev/null && echo "[OK] POST /reports/sync-index"
curl -fsSL -X POST "$BASE_URL/reports/sync-pdfs?limit=1" | jq . >/dev/null && echo "[OK] POST /reports/sync-pdfs?limit=1"

echo "Smoke test completed successfully."


