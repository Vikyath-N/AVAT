#!/usr/bin/env bash
set -euo pipefail
cd /Users/vikyath/Projects/AVAT
export PYTHONPATH=backend
python3 - <<'PY'
from services.dmv_scraper_service import DMVScraperService
s=DMVScraperService()
recs=s.list_reports()
print(f"Found: {len(recs)} entries")
for r in recs[:20]:
    print(r.year, r.manufacturer, r.incident_date.date(), r.pdf_url)
PY

