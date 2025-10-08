#!/usr/bin/env python3
"""
Import dmv_reports from Neon export CSV to local SQLite database
"""
import sqlite3
import csv
import sys
from pathlib import Path

def import_dmv_reports():
    """Import dmv_reports from CSV export"""
    
    # Paths
    project_root = Path(__file__).parent.parent
    csv_file = project_root / 'local/test-data/dmv_reports_export.csv'
    db_file = project_root / 'local/databases/enhanced_accidents.db'
    
    if not csv_file.exists():
        print(f"❌ CSV file not found: {csv_file}")
        sys.exit(1)
    
    print(f"📊 Importing dmv_reports from {csv_file.name}...")
    print(f"📂 Target database: {db_file}")
    
    # Connect to SQLite
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    
    # Clear existing data
    cur.execute("DELETE FROM dmv_reports")
    print(f"🗑️  Cleared existing {cur.rowcount} records")
    
    # Read CSV and insert
    imported = 0
    errors = 0
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                cur.execute("""
                    INSERT INTO dmv_reports (
                        id, manufacturer, incident_date, year, sequence_num,
                        display_text, page_url, pdf_url, source_slug, pdf_sha256,
                        status, error_msg, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    row['id'],
                    row['manufacturer'],
                    row['incident_date'] if row['incident_date'] else None,
                    int(row['year']) if row['year'] else None,
                    int(row['sequence_num']) if row['sequence_num'] else 1,
                    row['display_text'],
                    row['page_url'],
                    row['pdf_url'],
                    row['source_slug'] if row['source_slug'] else None,
                    row['pdf_sha256'] if row['pdf_sha256'] else None,
                    row['status'] if row['status'] else 'new',
                    row['error_msg'] if row['error_msg'] else None,
                    row['created_at'],
                    row['updated_at']
                ))
                imported += 1
                
                if imported % 100 == 0:
                    print(f"   Imported {imported} records...")
                    
            except Exception as e:
                errors += 1
                print(f"⚠️  Error importing row {row.get('id', '?')}: {e}")
    
    # Commit changes
    conn.commit()
    
    # Verify import
    cur.execute("SELECT COUNT(*) FROM dmv_reports")
    total = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
    new_count = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(DISTINCT manufacturer) FROM dmv_reports")
    companies = cur.fetchone()[0]
    
    cur.execute("SELECT MIN(incident_date), MAX(incident_date) FROM dmv_reports")
    date_range = cur.fetchone()
    
    print()
    print("=" * 60)
    print("✅ IMPORT COMPLETE!")
    print("=" * 60)
    print(f"   Total records: {total}")
    print(f"   Imported: {imported}")
    print(f"   Errors: {errors}")
    print(f"   Status 'new': {new_count}")
    print(f"   Unique manufacturers: {companies}")
    print(f"   Date range: {date_range[0]} to {date_range[1]}")
    print("=" * 60)
    
    # Show top manufacturers
    cur.execute("""
        SELECT manufacturer, COUNT(*) as count 
        FROM dmv_reports 
        GROUP BY manufacturer 
        ORDER BY count DESC 
        LIMIT 10
    """)
    
    print("\n📈 Top 10 Manufacturers:")
    for mfg, count in cur.fetchall():
        print(f"   {mfg}: {count}")
    
    conn.close()
    
    if total != 733:
        print(f"\n⚠️  Warning: Expected 733 records, got {total}")
        sys.exit(1)
    
    print("\n✅ All 733 dmv_reports successfully imported!")
    return True

if __name__ == "__main__":
    import_dmv_reports()

