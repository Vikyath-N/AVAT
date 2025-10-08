#!/usr/bin/env python3
"""
Test GitHub Actions PDF processing logic locally
This simulates what will happen in GitHub Actions
"""
import os
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Use Neon PostgreSQL (production database)
os.environ['DATABASE_URL'] = 'postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-adig818q.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require'

from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection

print("=" * 60)
print("🧪 TESTING GITHUB ACTIONS LOGIC LOCALLY")
print("=" * 60)
print(f"Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Database: Neon PostgreSQL (production)")
print()

# Check pending PDFs
try:
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as count FROM dmv_reports WHERE status='new'")
        result = cur.fetchone()
        pending = result['count'] if isinstance(result, dict) else result[0]
        
        cur.execute("SELECT COUNT(*) as count FROM accidents")
        result = cur.fetchone()
        total_accidents = result['count'] if isinstance(result, dict) else result[0]
        
        print(f"📋 Current Status:")
        print(f"   Pending PDFs in Neon: {pending}")
        print(f"   Total accidents in Neon: {total_accidents}")
except Exception as e:
    print(f"❌ Database connection error: {e}")
    print()
    print("⚠️  Make sure you have:")
    print("   1. Network connectivity")
    print("   2. Valid DATABASE_URL credentials")
    sys.exit(1)

if pending == 0:
    print()
    print("✅ No new PDFs to process. All caught up!")
    print("   GitHub Actions will skip processing when run.")
    print()
    print("=" * 60)
    print("✅ TEST PASSED!")
    print("=" * 60)
    sys.exit(0)

print()
print(f"🚀 Testing with 3 sample PDFs (to skip 404s)...")
print()

# Process 3 PDFs as test (some may 404)
scraper = DMVScraperService()

try:
    result = scraper.sync_pdfs(limit=3)
except Exception as e:
    print(f"❌ Processing error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print()
print("📊 Test Results:")
print(f"   Downloaded: {result.get('downloaded', 0)}")
print(f"   Parsed: {result.get('parsed', 0)}")
print(f"   Errors: {result.get('errors', 0)}")

# Verify data was added
try:
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as count FROM accidents")
        result = cur.fetchone()
        new_total = result['count'] if isinstance(result, dict) else result[0]
        
        added = new_total - total_accidents
        print(f"   New accidents added: {added}")
        print(f"   Total accidents now: {new_total}")
except Exception as e:
    print(f"⚠️  Could not verify: {e}")

print()
print("=" * 60)

if result.get('errors', 0) > 0 and added == 0:
    print("⚠️  TEST WARNING: Errors occurred and no data was added")
    print("   Check logs above for details")
elif result.get('parsed', 0) == 0 and added == 0:
    print("❌ TEST FAILED: No PDFs were parsed and no accidents added")
    sys.exit(1)
else:
    print("✅ TEST PASSED!")
    print()
    if added > 0:
        print(f"   Successfully added {added} accident(s) to Neon database!")
    if result.get('parsed', 0) > 0:
        print(f"   Parsed {result['parsed']} PDF(s) (as reported by scraper)")
    print()
    print("   GitHub Actions workflow is ready to deploy!")
    print("   Next steps:")
    print("   1. Add NEON_DATABASE_URL secret to GitHub")
    print("   2. Commit and push the workflow file")
    print("   3. Test with manual trigger")

print("=" * 60)

