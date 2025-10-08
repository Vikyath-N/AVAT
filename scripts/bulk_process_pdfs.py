#!/usr/bin/env python3
"""
Bulk process all 733 PDFs from DMV reports
This will take 2-4 hours depending on your machine and internet speed
"""
import sys
import os
import time
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Use local SQLite database
os.environ['DATABASE_URL'] = f'sqlite:///{project_root}/local/databases/enhanced_accidents.db'

from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection

def bulk_process_all_pdfs():
    """Process all pending PDFs in the database"""
    
    print("=" * 60)
    print("🚀 BULK PDF PROCESSING - ALL DMV PDFs")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Database: {os.environ['DATABASE_URL']}")
    print()
    
    # Check initial status
    with get_db_connection() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
        pending = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM accidents")
        existing_accidents = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT manufacturer) FROM dmv_reports")
        total_manufacturers = cur.fetchone()[0]
        
        print(f"📋 Initial Status:")
        print(f"   Pending PDFs: {pending}")
        print(f"   Existing accidents: {existing_accidents}")
        print(f"   Total manufacturers: {total_manufacturers}")
        print()
        
        if pending == 0:
            print("✅ All PDFs already processed!")
            print(f"   Total accidents in database: {existing_accidents}")
            return
        
        # Estimate time
        avg_time_per_pdf = 12  # seconds (conservative estimate)
        estimated_minutes = (pending * avg_time_per_pdf) / 60
        print(f"⏱️  Estimated time: {estimated_minutes:.0f} minutes ({estimated_minutes/60:.1f} hours)")
        print(f"   ({pending} PDFs × {avg_time_per_pdf}s average)")
        print()
    
    print("🚀 Starting bulk processing...")
    print("   This may take a while. Progress will be logged.")
    print()
    
    # Process ALL PDFs (no limit)
    scraper = DMVScraperService()
    
    start_time = time.time()
    try:
        # Process in batches to show progress
        total_downloaded = 0
        total_parsed = 0
        total_errors = 0
        
        # Process up to 1000 PDFs (should cover all 733)
        result = scraper.sync_pdfs(limit=1000)
        
        total_downloaded = result.get('downloaded', 0)
        total_parsed = result.get('parsed', 0)
        total_errors = result.get('errors', 0)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Processing interrupted by user")
        print("   Partial progress has been saved.")
    except Exception as e:
        print(f"\n\n❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
    
    elapsed = time.time() - start_time
    
    print()
    print("=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"   Downloaded: {total_downloaded}")
    print(f"   Parsed: {total_parsed}")
    print(f"   Errors: {total_errors}")
    print(f"   Time elapsed: {elapsed/60:.1f} minutes ({elapsed/3600:.2f} hours)")
    
    if total_parsed > 0:
        print(f"   Avg per PDF: {elapsed/total_parsed:.1f} seconds")
    
    # Verify final data
    with get_db_connection() as conn:
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM accidents")
        total_accidents = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT company) FROM accidents")
        companies = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
        still_pending = cur.fetchone()[0]
        
        new_accidents = total_accidents - existing_accidents
        
        print()
        print(f"✅ Total accidents in database: {total_accidents}")
        print(f"✅ New accidents added: {new_accidents}")
        print(f"✅ Unique companies: {companies}")
        print(f"📋 Still pending: {still_pending} PDFs")
        
        # Get top companies
        cur.execute("""
            SELECT company, COUNT(*) as count 
            FROM accidents 
            WHERE company IS NOT NULL
            GROUP BY company 
            ORDER BY count DESC 
            LIMIT 10
        """)
        top_companies = cur.fetchall()
        
        if top_companies:
            print()
            print("📈 Top 10 Companies:")
            for company, count in top_companies:
                print(f"   {company or 'Unknown'}: {count}")
        
        # Check data quality
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(company) as has_company,
                COUNT(city) as has_city,
                COUNT(location_lat) as has_coords,
                COUNT(damage_severity) as has_severity
            FROM accidents
        """)
        quality = cur.fetchone()
        
        print()
        print("📊 Data Quality:")
        print(f"   Total records: {quality[0]}")
        print(f"   With company: {quality[1]} ({100*quality[1]/max(quality[0],1):.1f}%)")
        print(f"   With city: {quality[2]} ({100*quality[2]/max(quality[0],1):.1f}%)")
        print(f"   With coordinates: {quality[3]} ({100*quality[3]/max(quality[0],1):.1f}%)")
        print(f"   With severity: {quality[4]} ({100*quality[4]/max(quality[0],1):.1f}%)")
    
    print()
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print("🎉 BULK PROCESSING COMPLETE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Verify data quality (check counts above)")
    print("  2. Export to PostgreSQL (Phase 2.1)")
    print("     Command: python scripts/export_to_postgres.py")
    print()
    
    # Save summary to file
    summary_file = project_root / 'local/logs' / f'bulk_process_summary_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    with open(summary_file, 'w') as f:
        f.write(f"Bulk Processing Summary\n")
        f.write(f"{'='*60}\n")
        f.write(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Downloaded: {total_downloaded}\n")
        f.write(f"Parsed: {total_parsed}\n")
        f.write(f"Errors: {total_errors}\n")
        f.write(f"Time: {elapsed/60:.1f} minutes\n")
        f.write(f"Total accidents: {total_accidents}\n")
        f.write(f"New accidents: {new_accidents}\n")
    
    print(f"📄 Summary saved to: {summary_file}")
    
    if total_parsed < 700:
        print()
        print(f"⚠️  Warning: Expected ~700+ accidents, got {total_parsed}")
        print("   Some PDFs may have failed. Check the logs above.")
        return False
    
    return True

if __name__ == "__main__":
    success = bulk_process_all_pdfs()
    sys.exit(0 if success else 1)

