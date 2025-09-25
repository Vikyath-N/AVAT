#!/usr/bin/env python3
"""
Ingest a local DMV PDF into the database using DMVScraperService.ingest_local_pdf
Usage:
  python scripts/test/ingest_local_pdf.py sample_data/Waymo_091025_Redacted.pdf
"""

import sys
import os
# Add backend package to sys.path so 'utils' and 'services' are importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

from services.dmv_scraper_service import DMVScraperService
from utils.database import get_db_connection
from utils.migrations import run_migrations


def main(path: str):
    # Ensure schema exists
    run_migrations()
    svc = DMVScraperService()
    accident_id = svc.ingest_local_pdf(path)
    print(f"Accident ID: {accident_id}")

    if accident_id:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, company, city, vehicle_make, damage_location, timestamp, form_sections FROM accidents WHERE id = ?", (accident_id,))
            row = cur.fetchone()
            if row:
                print("Inserted Accident:")
                print(dict(row))
            else:
                print("No accident row found.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Provide a path to a local PDF.")
        sys.exit(1)
    main(sys.argv[1])


