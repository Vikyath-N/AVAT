#!/usr/bin/env bash
set -euo pipefail

API=${1:-"http://localhost:8000/api/v1"}

echo "Running integration tests against $API"

./scripts/test/api_smoke.sh "$API"
./scripts/test/load_scrape.sh "$API" 2

echo "Integration tests completed."
