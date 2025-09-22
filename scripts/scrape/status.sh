#!/usr/bin/env bash
set -euo pipefail
curl -s http://localhost:8000/api/v1/reports/summary | jq .
echo
curl -s 'http://localhost:8000/api/v1/reports/latest?limit=10' | jq .
