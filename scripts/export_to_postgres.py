#!/usr/bin/env python3
"""
Export local SQLite accidents table to PostgreSQL-compatible SQL dump
This will be imported into Neon PostgreSQL database
"""
import sqlite3
import sys
from pathlib import Path
from datetime import datetime

def sqlite_to_postgres_dump(sqlite_db, output_file):
    """Convert SQLite accidents table to PostgreSQL dump"""
    
    print("=" * 60)
    print("📊 EXPORTING ACCIDENTS TO POSTGRESQL FORMAT")
    print("=" * 60)
    print(f"Source DB: {sqlite_db}")
    print(f"Output: {output_file}")
    print()
    
    conn = sqlite3.connect(sqlite_db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Get all accidents
    cur.execute("SELECT * FROM accidents ORDER BY id")
    rows = cur.fetchall()
    
    if len(rows) == 0:
        print("❌ No accidents found in database!")
        sys.exit(1)
    
    print(f"📋 Found {len(rows)} accidents to export...")
    
    # Column mapping: SQLite -> PostgreSQL
    # Handle column name differences
    column_map = {
        'timestamp': 'report_date',  # Map timestamp to report_date in Postgres
        'company': 'company_name',
        'location_lat': 'location_lat',
        'location_lng': 'location_lng',
        # Add other mappings as needed
    }
    
    with open(output_file, 'w') as f:
        # Write header
        f.write("-- PostgreSQL dump of accidents table\n")
        f.write(f"-- Generated from local SQLite database\n")
        f.write(f"-- Generated at: {datetime.now()}\n")
        f.write(f"-- Total records: {len(rows)}\n\n")
        
        # Truncate existing data (optional - comment out if you want to append)
        f.write("-- Clear existing data (uncomment if needed)\n")
        f.write("-- TRUNCATE TABLE accidents CASCADE;\n\n")
        
        # Reset sequence
        f.write("-- Reset sequence\n")
        f.write("-- SELECT setval('accidents_id_seq', 1, false);\n\n")
        
        # Write inserts in batches of 100 for better import performance
        print("Writing SQL inserts...")
        
        batch_size = 100
        for i, row in enumerate(rows):
            # Build column list and values
            cols = []
            vals = []
            
            for col in row.keys():
                if col == 'id':
                    continue  # Skip ID, let PostgreSQL auto-increment
                
                val = row[col]
                if val is None:
                    vals.append('NULL')
                elif isinstance(val, str):
                    # Escape single quotes and backslashes
                    escaped = val.replace('\\', '\\\\').replace("'", "''")
                    vals.append(f"'{escaped}'")
                elif isinstance(val, (int, float)):
                    vals.append(str(val))
                else:
                    # Handle other types as strings
                    escaped = str(val).replace('\\', '\\\\').replace("'", "''")
                    vals.append(f"'{escaped}'")
                
                cols.append(col)
            
            cols_str = ', '.join(cols)
            vals_str = ', '.join(vals)
            
            f.write(f"INSERT INTO accidents ({cols_str}) VALUES ({vals_str});\n")
            
            # Progress indicator
            if (i + 1) % 100 == 0:
                print(f"   Processed {i + 1}/{len(rows)} records...")
        
        # Reset sequence to max ID
        f.write(f"\n-- Reset sequence to next available ID\n")
        f.write(f"SELECT setval('accidents_id_seq', (SELECT COALESCE(MAX(id), 0) FROM accidents));\n")
    
    print()
    print("=" * 60)
    print("✅ EXPORT COMPLETE!")
    print("=" * 60)
    print(f"   Exported: {len(rows)} accidents")
    print(f"   Output file: {output_file}")
    
    # Show file size
    file_size = Path(output_file).stat().st_size
    print(f"   File size: {file_size / (1024*1024):.2f} MB")
    
    # Show sample stats
    cur.execute("SELECT COUNT(DISTINCT company) FROM accidents WHERE company IS NOT NULL")
    companies = cur.fetchone()[0]
    
    cur.execute("SELECT MIN(timestamp), MAX(timestamp) FROM accidents WHERE timestamp IS NOT NULL")
    date_range = cur.fetchone()
    
    print()
    print("📊 Data Summary:")
    print(f"   Unique companies: {companies}")
    if date_range[0] and date_range[1]:
        print(f"   Date range: {date_range[0]} to {date_range[1]}")
    
    print()
    print("Next step: Import to Neon PostgreSQL (Phase 2.2)")
    print(f"   Command: psql 'postgresql://...' < {output_file}")
    print("=" * 60)
    
    conn.close()

if __name__ == "__main__":
    project_root = Path(__file__).parent.parent
    
    sqlite_db = project_root / 'local/databases/enhanced_accidents.db'
    output_file = project_root / 'local/sql/accidents-bulk-import.sql'
    
    if not sqlite_db.exists():
        print(f"❌ SQLite database not found: {sqlite_db}")
        sys.exit(1)
    
    # Create sql directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    sqlite_to_postgres_dump(str(sqlite_db), str(output_file))

