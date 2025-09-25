#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   MAPBOX_TOKEN=pk.xxx ./scripts/test/mapbox_token.sh
#   ./scripts/test/mapbox_token.sh pk.xxx

TOKEN=${1:-"${MAPBOX_TOKEN:-}"}
if [ -z "$TOKEN" ]; then
  echo "Provide a Mapbox public token via arg or MAPBOX_TOKEN env var" >&2
  exit 1
fi

echo "Testing Mapbox token (style metadata)..."
curl -fsSL "https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=$TOKEN" | jq .version >/dev/null
echo "[OK] styles API reachable"

echo "Testing Static Tiles (200 expected)..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/-122.4194,37.7749,10/256x256?access_token=$TOKEN")
if [ "$HTTP" != "200" ]; then
  echo "Tile fetch failed: HTTP $HTTP" >&2
  exit 2
fi
echo "[OK] static tile fetch"

echo "Mapbox token test passed."


