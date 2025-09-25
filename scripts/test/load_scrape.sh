#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/test/load_scrape.sh https://your-api-host/api/v1 5
BASE_URL=${1:-"http://localhost:8000/api/v1"}
ROUNDS=${2:-3}

echo "Load test: $ROUNDS rounds of sync-index + sync-pdfs(limit=5)"
for i in $(seq 1 "$ROUNDS"); do
  echo "Round $i: index"
  curl -fsS -m 120 -X POST "$BASE_URL/reports/sync-index" >/dev/null && echo "  [OK] index"
  echo "Round $i: pdfs"
  curl -fsS -m 1800 -X POST "$BASE_URL/reports/sync-pdfs?limit=5" >/dev/null && echo "  [OK] pdfs"
done

echo "Load scrape completed."


