#!/usr/bin/env bash
set -euo pipefail
cd /Users/vikyath/Projects/AVAT
export PYTHONPATH=backend
python3 - <<'PY'
from services.dmv_scraper_service import DMVScraperService
s=DMVScraperService()
print(s.sync_index())
PY

