#!/usr/bin/env python3
"""
Test PDF pipeline with 5 sample PDFs to validate parsing logic
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Override database path for local testing
os.environ['DATABASE_URL'] = f'sqlite:///{project_root}/local/databases/enhanced_accidents.db'

from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection

def test_sample_pdfs():
    """Test PDF pipeline with 5 sample PDFs"""
    
    print("=" * 60)
    print("🧪 TESTING PDF PIPELINE - 5 SAMPLE PDFs")
    print("=" * 60)
    print(f"Database: {os.environ['DATABASE_URL']}")
    print()
    
    # Check initial status
    with get_db_connection() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
        pending = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM accidents")
        existing_accidents = cur.fetchone()[0]
        
        print(f"📋 Status before test:")
        print(f"   Pending PDFs: {pending}")
        print(f"   Existing accidents: {existing_accidents}")
        print()
    
    if pending == 0:
        print("⚠️  No pending PDFs to process!")
        print("   All PDFs have already been processed.")
        return
    
    # Process only 5 PDFs
    print("🚀 Processing 5 sample PDFs...")
    print()
    
    scraper = DMVScraperService()
    
    try:
        result = scraper.sync_pdfs(limit=5)
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"   Downloaded: {result.get('downloaded', 0)}")
    print(f"   Parsed: {result.get('parsed', 0)}")
    print(f"   Errors: {result.get('errors', 0)}")
    
    # Verify data in accidents table
    with get_db_connection() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM accidents")
        total_accidents = cur.fetchone()[0]
        
        new_accidents = total_accidents - existing_accidents
        
        print(f"   New accidents added: {new_accidents}")
        print(f"   Total accidents now: {total_accidents}")
        
        # Show sample data
        cur.execute("""
            SELECT company, city, timestamp, damage_severity 
            FROM accidents 
            ORDER BY created_at DESC
            LIMIT 5
        """)
        
        print()
        print("📝 Sample records (most recent):")
        for row in cur.fetchall():
            company = row[0] or 'Unknown'
            city = row[1] or 'Unknown'
            date = row[2] or 'Unknown'
            severity = row[3] or 'Unknown'
            print(f"   {company} | {city} | {date} | {severity}")
        
        # Check dmv_reports status
        cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
        still_pending = cur.fetchone()[0]
        
        print()
        print(f"📋 Status after test:")
        print(f"   Remaining pending PDFs: {still_pending}")
    
    print("=" * 60)
    
    # Validate results
    if result.get('parsed', 0) == 0:
        print("❌ TEST FAILED: No PDFs were parsed!")
        sys.exit(1)
    
    if result.get('errors', 0) > 3:
        print(f"⚠️  TEST WARNING: High error rate ({result['errors']}/5 failed)")
        sys.exit(1)
    
    print("✅ TEST PASSED! Pipeline is working correctly.")
    print()
    print("Next step: Run bulk processing (Phase 1.5) to process all 733 PDFs")
    print("   Command: python scripts/bulk_process_pdfs.py")
    print("=" * 60)

if __name__ == "__main__":
    test_sample_pdfs()

