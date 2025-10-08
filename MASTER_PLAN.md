# 🎯 MASTER PLAN: DMV PDF Data Pipeline
## Complete End-to-End Implementation Strategy

**Last Updated**: October 8, 2025  
**Status**: 📋 Ready to Execute  
**Estimated Storage**: 500MB - 1GB (PDFs + processed data)

---

## 📊 EXECUTIVE SUMMARY

### The Plan
1. **Phase 1**: Process all 733 PDFs locally (one-time, 2-4 hours)
2. **Phase 2**: Migrate parsed data to Neon PostgreSQL (one-time, 5 minutes)
3. **Phase 3**: Deploy GitHub Actions for daily updates (3-4 PDFs/day)

### Why This Approach?
- ✅ **FREE**: Uses local CPU for bulk work, GitHub Actions for ongoing (18% of free tier)
- ✅ **FAST**: All data available in hours, not weeks
- ✅ **TESTED**: Local testing before any deployment
- ✅ **SCALABLE**: Can handle 50 PDFs/day and still be free

### Resource Requirements
- **Disk Space**: 1.5 GB (500MB PDFs + 500MB SQLite + 500MB buffer)
- **RAM**: 4 GB minimum (8 GB recommended for OCR)
- **CPU Time**: 2-4 hours one-time
- **Network**: ~1 GB download from DMV

---

## 🎯 PHASE 1: LOCAL BULK PROCESSING

**Goal**: Download and parse all 733 PDFs on your local machine  
**Time**: 2-4 hours one-time  
**Storage**: ~1 GB local disk  
**Cost**: $0 (your machine)

### Step 1.1: Environment Setup ✅ ALREADY DONE

**What**: Verify all dependencies are installed

**Test Script**:
```bash
# Test: Verify Python environment
cd /Users/vikyath/Projects/AVAT
python3 -c "
import pdfplumber
import pytesseract
import requests
from bs4 import BeautifulSoup
print('✅ All dependencies installed')
"
```

**Expected Output**: `✅ All dependencies installed`

**If fails**: Run `pip install -r requirements.txt && brew install poppler tesseract`

---

### Step 1.2: Create Local Storage Structure

**What**: Set up directories for PDFs and processed data

**Implementation**:
```bash
# Create storage directories
mkdir -p /Users/vikyath/Projects/AVAT/local/pdfs/{2019,2020,2021,2022,2023,2024,2025}
mkdir -p /Users/vikyath/Projects/AVAT/local/databases
mkdir -p /Users/vikyath/Projects/AVAT/local/test-data
mkdir -p /Users/vikyath/Projects/AVAT/local/logs

# Verify structure
tree -L 2 /Users/vikyath/Projects/AVAT/local/
```

**Test Script**:
```bash
# Test: Verify directory structure
cd /Users/vikyath/Projects/AVAT
[ -d "local/pdfs/2025" ] && echo "✅ PDF directories created" || echo "❌ Failed"
[ -d "local/databases" ] && echo "✅ Database directory created" || echo "❌ Failed"
```

**Expected Output**: All ✅ checks pass

---

### Step 1.3: Populate dmv_reports Table from Neon

**What**: Copy dmv_reports metadata from Neon to local SQLite

**Why**: We need PDF URLs and metadata to download PDFs

**Implementation**:
```bash
# Export dmv_reports from Neon
psql 'postgresql://neondb_owner:npg_ntuV0RslfA8k@ep-aged-leaf-adig818q-pooler.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require' -c "\COPY (SELECT * FROM dmv_reports) TO '/Users/vikyath/Projects/AVAT/local/test-data/dmv_reports.csv' CSV HEADER;"

# Import to local SQLite
sqlite3 /Users/vikyath/Projects/AVAT/local/databases/enhanced_accidents.db << 'EOF'
-- Create dmv_reports table if not exists
CREATE TABLE IF NOT EXISTS dmv_reports (
    id INTEGER PRIMARY KEY,
    manufacturer TEXT,
    incident_date DATE,
    year INTEGER,
    sequence_num INTEGER DEFAULT 1,
    display_text TEXT,
    page_url TEXT,
    pdf_url TEXT,
    source_slug TEXT UNIQUE,
    pdf_sha256 TEXT,
    status TEXT DEFAULT 'new',
    error_msg TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import CSV
.mode csv
.import /Users/vikyath/Projects/AVAT/local/test-data/dmv_reports.csv dmv_reports_temp
INSERT OR IGNORE INTO dmv_reports SELECT * FROM dmv_reports_temp WHERE id > 0;
DROP TABLE dmv_reports_temp;
EOF
```

**Test Script**:
```bash
# Test: Verify dmv_reports imported
sqlite3 /Users/vikyath/Projects/AVAT/local/databases/enhanced_accidents.db << 'EOF'
SELECT 
  COUNT(*) as total_reports,
  COUNT(DISTINCT manufacturer) as total_companies,
  MIN(incident_date) as earliest,
  MAX(incident_date) as latest
FROM dmv_reports;
EOF
```

**Expected Output**:
```
total_reports|total_companies|earliest|latest
733|29|2019-01-07|2025-09-18
```

---

### Step 1.4: Test PDF Download & Parse (Sample of 5)

**What**: Download and parse 5 PDFs to test the pipeline

**Why**: Validate everything works before processing 733 PDFs

**Test Script**:
```bash
cd /Users/vikyath/Projects/AVAT

# Create test script
cat > local/test-data/test_pdf_pipeline.py << 'PYTHON_EOF'
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection

# Override database path for local testing
os.environ['DATABASE_URL'] = 'sqlite:///local/databases/enhanced_accidents.db'

def test_sample_pdfs():
    print("🧪 Testing PDF pipeline with 5 sample PDFs...")
    
    scraper = DMVScraperService()
    
    # Process only 5 PDFs
    result = scraper.sync_pdfs(limit=5)
    
    print(f"\n📊 Results:")
    print(f"   Downloaded: {result['downloaded']}")
    print(f"   Parsed: {result['parsed']}")
    print(f"   Errors: {result['errors']}")
    
    # Verify data in accidents table
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM accidents")
        count = cur.fetchone()[0]
        print(f"   Total accidents in DB: {count}")
        
        # Show sample data
        cur.execute("""
            SELECT company, city, incident_date, damage_severity 
            FROM accidents 
            LIMIT 3
        """)
        print(f"\n📝 Sample records:")
        for row in cur.fetchall():
            print(f"   {row[0]} | {row[1]} | {row[2]} | {row[3]}")
    
    assert result['parsed'] > 0, "❌ No PDFs were parsed!"
    print("\n✅ Test passed! Pipeline is working.")

if __name__ == "__main__":
    test_sample_pdfs()
PYTHON_EOF

# Run test
python local/test-data/test_pdf_pipeline.py
```

**Expected Output**:
```
🧪 Testing PDF pipeline with 5 sample PDFs...
📊 Results:
   Downloaded: 5
   Parsed: 5
   Errors: 0
   Total accidents in DB: 5

📝 Sample records:
   Waymo | San Francisco | 2025-09-18 | minor
   Zoox | Foster City | 2025-09-09 | minor
   Cruise | San Francisco | 2024-12-15 | moderate

✅ Test passed! Pipeline is working.
```

**If fails**: Check logs in terminal, verify PDF URLs are accessible

---

### Step 1.5: FULL BULK PROCESSING (733 PDFs)

**What**: Download and parse ALL 733 PDFs

**Estimated Time**: 2-4 hours (depends on DMV server speed)

**Storage Check First**:
```bash
# Check available disk space
df -h /Users/vikyath/Projects/AVAT/local/
# Need at least 2 GB free
```

**Implementation Script**:
```bash
cd /Users/vikyath/Projects/AVAT

# Create production processing script with progress tracking
cat > scripts/bulk_process_pdfs.py << 'PYTHON_EOF'
import sys
import os
import time
from datetime import datetime
sys.path.insert(0, os.path.abspath('.'))

from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection

# Use local SQLite database
os.environ['DATABASE_URL'] = 'sqlite:///local/databases/enhanced_accidents.db'

def bulk_process_all_pdfs():
    print("=" * 60)
    print("🚀 BULK PDF PROCESSING - ALL 733 PDFs")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check initial status
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
        pending = cur.fetchone()[0]
        print(f"📋 Pending PDFs to process: {pending}")
    
    scraper = DMVScraperService()
    
    # Process ALL PDFs (no limit)
    start_time = time.time()
    result = scraper.sync_pdfs(limit=1000)  # High limit to get all
    elapsed = time.time() - start_time
    
    print()
    print("=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"   Downloaded: {result['downloaded']}")
    print(f"   Parsed: {result['parsed']}")
    print(f"   Errors: {result['errors']}")
    print(f"   Time elapsed: {elapsed/60:.1f} minutes")
    print(f"   Avg per PDF: {elapsed/max(result['parsed'], 1):.1f} seconds")
    
    # Verify final data
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM accidents")
        total = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(DISTINCT company) FROM accidents")
        companies = cur.fetchone()[0]
        
        cur.execute("""
            SELECT company, COUNT(*) as count 
            FROM accidents 
            GROUP BY company 
            ORDER BY count DESC 
            LIMIT 10
        """)
        top_companies = cur.fetchall()
        
        print()
        print(f"✅ Total accidents in database: {total}")
        print(f"✅ Unique companies: {companies}")
        print()
        print("📈 Top 10 Companies:")
        for company, count in top_companies:
            print(f"   {company}: {count}")
    
    print()
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print("🎉 BULK PROCESSING COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    bulk_process_all_pdfs()
PYTHON_EOF

# Run bulk processing
python scripts/bulk_process_pdfs.py 2>&1 | tee local/logs/bulk_process_$(date +%Y%m%d_%H%M%S).log
```

**Expected Output** (abbreviated):
```
============================================================
🚀 BULK PDF PROCESSING - ALL 733 PDFs
============================================================
Started at: 2025-10-08 15:30:00

📋 Pending PDFs to process: 733

[... processing for 2-4 hours ...]

============================================================
📊 FINAL RESULTS
============================================================
   Downloaded: 733
   Parsed: 728
   Errors: 5
   Time elapsed: 142.3 minutes
   Avg per PDF: 11.7 seconds

✅ Total accidents in database: 728
✅ Unique companies: 29

📈 Top 10 Companies:
   Waymo: 326
   Cruise: 134
   Zoox: 129
   GM Cruise: 44
   Apple: 21
   ...

Finished at: 2025-10-08 17:52:23
============================================================
🎉 BULK PROCESSING COMPLETE!
============================================================
```

**Test After Completion**:
```bash
# Verify database integrity
sqlite3 /Users/vikyath/Projects/AVAT/local/databases/enhanced_accidents.db << 'EOF'
-- Check for nulls in critical fields
SELECT 
  COUNT(*) as total,
  COUNT(company) as has_company,
  COUNT(city) as has_city,
  COUNT(location_lat) as has_coords,
  COUNT(damage_severity) as has_severity
FROM accidents;

-- Check data quality
SELECT 
  'Companies' as metric, 
  COUNT(DISTINCT company) as count 
FROM accidents
UNION ALL
SELECT 'Cities', COUNT(DISTINCT city) FROM accidents
UNION ALL
SELECT 'Date Range', COUNT(*) FROM accidents WHERE timestamp IS NOT NULL;
EOF
```

**Expected Output**:
```
total|has_company|has_city|has_coords|has_severity
728|728|720|450|680

metric|count
Companies|29
Cities|45
Date Range|728
```

---

## 🎯 PHASE 2: MIGRATION TO NEON

**Goal**: Export local data and import to Neon PostgreSQL  
**Time**: 5-10 minutes  
**Storage**: ~50 MB SQL dump  
**Cost**: $0

### Step 2.1: Export Local SQLite to SQL Dump

**What**: Create PostgreSQL-compatible SQL dump from SQLite

**Implementation**:
```bash
cd /Users/vikyath/Projects/AVAT

# Create conversion script (SQLite → PostgreSQL)
cat > scripts/export_to_postgres.py << 'PYTHON_EOF'
import sqlite3
import sys

def sqlite_to_postgres_dump(sqlite_db, output_file):
    """Convert SQLite accidents table to PostgreSQL dump"""
    
    conn = sqlite3.connect(sqlite_db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Get all accidents
    cur.execute("SELECT * FROM accidents ORDER BY id")
    rows = cur.fetchall()
    
    print(f"📊 Exporting {len(rows)} accidents...")
    
    with open(output_file, 'w') as f:
        # Write header
        f.write("-- PostgreSQL dump of accidents table\n")
        f.write("-- Generated from local SQLite database\n\n")
        
        # Truncate existing data
        f.write("TRUNCATE TABLE accidents CASCADE;\n\n")
        
        # Reset sequence
        f.write("SELECT setval('accidents_id_seq', 1, false);\n\n")
        
        # Write inserts
        for row in rows:
            cols = row.keys()
            values = []
            
            for col in cols:
                val = row[col]
                if val is None:
                    values.append('NULL')
                elif isinstance(val, str):
                    # Escape single quotes
                    escaped = val.replace("'", "''")
                    values.append(f"'{escaped}'")
                elif isinstance(val, (int, float)):
                    values.append(str(val))
                else:
                    values.append(f"'{val}'")
            
            cols_str = ', '.join(cols)
            vals_str = ', '.join(values)
            
            f.write(f"INSERT INTO accidents ({cols_str}) VALUES ({vals_str});\n")
        
        # Reset sequence to max ID
        f.write(f"\nSELECT setval('accidents_id_seq', (SELECT MAX(id) FROM accidents));\n")
    
    print(f"✅ Exported to {output_file}")
    conn.close()

if __name__ == "__main__":
    sqlite_to_postgres_dump(
        'local/databases/enhanced_accidents.db',
        'local/sql/accidents-bulk-import.sql'
    )
PYTHON_EOF

# Run export
python scripts/export_to_postgres.py
```

**Test Export**:
```bash
# Verify SQL dump created
ls -lh /Users/vikyath/Projects/AVAT/local/sql/accidents-bulk-import.sql
# Should be ~20-50 MB

# Check first few lines
head -20 /Users/vikyath/Projects/AVAT/local/sql/accidents-bulk-import.sql
```

---

### Step 2.2: Import to Neon (Production Database)

**What**: Load all parsed accident data into Neon

**Pre-flight Check**:
```bash
# Test Neon connection
psql 'postgresql://neondb_owner:npg_ntuV0RslfA8k@ep-aged-leaf-adig818q-pooler.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require' -c "SELECT version();"
```

**Implementation**:
```bash
# Import data to Neon
psql 'postgresql://neondb_owner:npg_ntuV0RslfA8k@ep-aged-leaf-adig818q-pooler.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require' < /Users/vikyath/Projects/AVAT/local/sql/accidents-bulk-import.sql

echo "✅ Import complete!"
```

**Verification Test**:
```bash
# Test: Verify data in Neon
psql 'postgresql://neondb_owner:npg_ntuV0RslfA8k@ep-aged-leaf-adig818q-pooler.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require' << 'EOF'
-- Check total count
SELECT COUNT(*) as total_accidents FROM accidents;

-- Check company distribution
SELECT company, COUNT(*) as count 
FROM accidents 
GROUP BY company 
ORDER BY count DESC 
LIMIT 10;

-- Check data quality
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT company) as companies,
  COUNT(DISTINCT city) as cities,
  COUNT(location_lat) as with_coordinates,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM accidents;
EOF
```

**Expected Output**:
```
 total_accidents 
-----------------
             728

   company    | count 
--------------+-------
 Waymo        |   326
 Cruise       |   134
 Zoox         |   129
 ...

 total | companies | cities | with_coordinates |  earliest  |   latest   
-------+-----------+--------+------------------+------------+------------
   728 |        29 |     45 |              450 | 2019-01-15 | 2025-09-18
```

---

### Step 2.3: Test Dashboard with Real Data

**What**: Verify dashboard displays the new data correctly

**Test Script**:
```bash
# Test production API endpoints
curl "https://avat-backend.v-naradasi.workers.dev/api/v1/stats" | jq '.'
curl "https://avat-backend.v-naradasi.workers.dev/api/v1/analytics/overview" | jq '.data.company_stats[:5]'
curl "https://avat-backend.v-naradasi.workers.dev/api/v1/accidents?limit=5" | jq '.data.accidents[:2]'
```

**Expected**: All endpoints return real data, not fallback data

**Manual Test**: Open https://vikyath-n.github.io/AVAT/dashboard and verify:
- ✅ Map shows accident locations
- ✅ Charts show company/city distributions
- ✅ Stats show real counts (not hardcoded values)

---

## 🎯 PHASE 3: GITHUB ACTIONS DAILY AUTOMATION

**Goal**: Automate daily PDF processing for new reports (3-4/day)  
**Time**: 5-10 minutes/day  
**GitHub Minutes**: ~150/month (7.5% of free tier)  
**Cost**: $0

### Step 3.1: Create GitHub Actions Workflow

**What**: Set up automated daily PDF processing

**Implementation**:

Create `.github/workflows/parse-new-pdfs.yml`:

```yaml
name: Parse New DMV PDFs

on:
  schedule:
    # Run at 5:30 AM UTC (30 min after scraper finishes)
    - cron: '30 5 * * *'
  
  # Allow manual trigger for testing
  workflow_dispatch:
    inputs:
      limit:
        description: 'Max PDFs to process'
        required: false
        default: '10'

permissions:
  contents: read

concurrency:
  group: pdf-parser
  cancel-in-progress: false

jobs:
  parse-pdfs:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install system dependencies (OCR)
        run: |
          sudo apt-get update
          sudo apt-get install -y poppler-utils tesseract-ocr
          tesseract --version
      
      - name: Install Python dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Parse new PDFs
        env:
          DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
        run: |
          python << 'PYTHON_EOF'
          import os
          import sys
          from datetime import datetime
          
          # Set database to Neon
          os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', '')
          
          from backend.services.dmv_scraper_service import DMVScraperService
          from backend.utils.database import get_db_connection
          
          print("=" * 60)
          print(f"🤖 AUTOMATED PDF PARSING - {datetime.now()}")
          print("=" * 60)
          
          # Check pending PDFs
          with get_db_connection() as conn:
              cur = conn.cursor()
              cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
              pending = cur.fetchone()[0]
              print(f"📋 Pending PDFs: {pending}")
          
          if pending == 0:
              print("✅ No new PDFs to process. All done!")
              sys.exit(0)
          
          # Process up to 10 new PDFs per run (usually 3-4)
          scraper = DMVScraperService()
          result = scraper.sync_pdfs(limit=${{ github.event.inputs.limit || 10 }})
          
          print()
          print("📊 Results:")
          print(f"   Downloaded: {result['downloaded']}")
          print(f"   Parsed: {result['parsed']}")
          print(f"   Errors: {result['errors']}")
          
          # Verify
          with get_db_connection() as conn:
              cur = conn.cursor()
              cur.execute("SELECT COUNT(*) FROM accidents")
              total = cur.fetchone()[0]
              print(f"   Total accidents now: {total}")
          
          print("=" * 60)
          if result['errors'] > 0:
              print(f"⚠️  Completed with {result['errors']} errors")
              sys.exit(1)
          else:
              print("✅ SUCCESS!")
          PYTHON_EOF
      
      - name: Summary
        if: always()
        run: |
          echo "### PDF Processing Complete! 🎉" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Check logs above for details." >> $GITHUB_STEP_SUMMARY
```

---

### Step 3.2: Add GitHub Secret for Database

**What**: Configure Neon database connection in GitHub

**Implementation**:

```bash
# Go to GitHub repository settings
open "https://github.com/vikyath-n/AVAT/settings/secrets/actions"

# Add secret:
# Name: NEON_DATABASE_URL
# Value: postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-adig818q.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require
```

**Test Secret**:
```bash
# Trigger manual workflow run
gh workflow run parse-new-pdfs.yml
sleep 10
gh run list --workflow=parse-new-pdfs.yml --limit 1
```

---

### Step 3.3: Test GitHub Actions Locally First

**What**: Test the workflow logic locally before deploying

**Test Script**:
```bash
cd /Users/vikyath/Projects/AVAT

# Simulate GitHub Actions environment locally
cat > scripts/test_github_actions_locally.py << 'PYTHON_EOF'
import os
import sys
from datetime import datetime

# Simulate production environment
os.environ['DATABASE_URL'] = 'postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-adig818q.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require'

from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection

print("=" * 60)
print(f"🧪 TESTING GITHUB ACTIONS LOGIC LOCALLY")
print("=" * 60)

# Check pending
with get_db_connection() as conn:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM dmv_reports WHERE status='new'")
    pending = cur.fetchone()[0]
    print(f"📋 Pending PDFs in Neon: {pending}")

if pending == 0:
    print("✅ No new PDFs. Test passed!")
    sys.exit(0)

# Process 1 PDF as test
scraper = DMVScraperService()
result = scraper.sync_pdfs(limit=1)

print()
print("📊 Test Results:")
print(f"   Downloaded: {result['downloaded']}")
print(f"   Parsed: {result['parsed']}")
print(f"   Errors: {result['errors']}")

assert result['errors'] == 0, "❌ Test failed with errors"
print("\n✅ GitHub Actions logic test PASSED!")
PYTHON_EOF

# Run local test
python scripts/test_github_actions_locally.py
```

**Expected Output**:
```
============================================================
🧪 TESTING GITHUB ACTIONS LOGIC LOCALLY
============================================================
📋 Pending PDFs in Neon: 0

✅ No new PDFs. Test passed!
```

---

## 📋 COMPLETE TODO CHECKLIST

### Phase 1: Local Processing
- [ ] **1.1** Verify Python dependencies
- [ ] **1.2** Create local storage directories
- [ ] **1.3** Import dmv_reports from Neon to local SQLite
- [ ] **1.4** Test pipeline with 5 sample PDFs
- [ ] **1.5** Run bulk processing (733 PDFs, ~2-4 hours)
- [ ] **1.5a** Verify 700+ accidents in local DB

### Phase 2: Migration
- [ ] **2.1** Export local SQLite to PostgreSQL dump
- [ ] **2.2** Import dump to Neon production database
- [ ] **2.3** Verify data in Neon (count, quality checks)
- [ ] **2.4** Test dashboard with real data
- [ ] **2.5** Confirm all endpoints return real data

### Phase 3: Automation
- [ ] **3.1** Create `.github/workflows/parse-new-pdfs.yml`
- [ ] **3.2** Add `NEON_DATABASE_URL` secret to GitHub
- [ ] **3.3** Test workflow logic locally first
- [ ] **3.4** Trigger manual workflow run on GitHub
- [ ] **3.5** Verify workflow completes successfully
- [ ] **3.6** Wait 24 hours, verify daily cron runs

---

## 🧪 TEST SUMMARY

| Phase | Test | Expected Result | Status |
|-------|------|-----------------|--------|
| 1.1 | Dependencies | ✅ All installed | ⏳ Pending |
| 1.2 | Directories | ✅ Structure created | ⏳ Pending |
| 1.3 | Import metadata | 733 reports in SQLite | ⏳ Pending |
| 1.4 | Sample 5 PDFs | 5 parsed successfully | ⏳ Pending |
| 1.5 | Bulk 733 PDFs | 700+ parsed (5-10 errors OK) | ⏳ Pending |
| 2.1 | Export SQL | ~50 MB .sql file | ⏳ Pending |
| 2.2 | Import Neon | 700+ rows in accidents | ⏳ Pending |
| 2.3 | Data quality | All checks pass | ⏳ Pending |
| 2.4 | Dashboard | Real data displayed | ⏳ Pending |
| 3.1 | Workflow file | Valid YAML syntax | ⏳ Pending |
| 3.2 | GitHub secret | Connection succeeds | ⏳ Pending |
| 3.3 | Local test | Connects to Neon OK | ⏳ Pending |
| 3.4 | Manual trigger | Workflow runs | ⏳ Pending |
| 3.5 | Cron schedule | Runs daily at 5:30 UTC | ⏳ Pending |

---

## 📊 STORAGE & RESOURCE TRACKING

### Disk Space Breakdown
```
local/
├── pdfs/           ~500 MB (733 PDF files)
├── databases/      ~200 MB (SQLite + indexes)
├── sql/            ~50 MB  (PostgreSQL dump)
├── logs/           ~10 MB  (processing logs)
└── test-data/      ~50 MB  (CSV exports, tests)
                    ─────────
Total:              ~810 MB
```

### GitHub Actions Usage
```
Daily run:
- 3-4 new PDFs × 3 min each = ~12 minutes/day
- Monthly: 12 min × 30 days = 360 minutes/month
- Quota: 2000 minutes/month
- Usage: 18% of free tier ✅
```

---

## 🚨 ERROR HANDLING

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Permission denied: dmv_reports` | Using wrong DB credentials | Use `neondb_owner` for migrations |
| `Module not found: enhanced_data_pipeline` | Missing dependency | `pip install -r requirements.txt` |
| `PDF download timeout` | DMV server slow | Retry failed PDFs manually |
| `OCR failed for page` | Bad scan quality | Skip page, use text extraction only |
| `Disk space full` | >1 GB PDFs | Clean up old files in `local/pdfs/` |

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ 700+ accidents in local SQLite database
- ✅ <5% error rate on PDF parsing
- ✅ All test scripts pass

### Phase 2 Complete When:
- ✅ 700+ accidents in Neon PostgreSQL
- ✅ Dashboard shows real data (not fallback)
- ✅ All API endpoints return correct counts

### Phase 3 Complete When:
- ✅ GitHub Actions workflow runs successfully
- ✅ Daily cron processes new PDFs automatically
- ✅ Zero manual intervention needed for 7 days

---

## 📞 NEXT STEPS

**Ready to begin?** Start with Phase 1.1:

```bash
cd /Users/vikyath/Projects/AVAT
python3 -c "import pdfplumber, pytesseract, requests; print('✅ Ready to start!')"
```

**Questions or issues?** Check the test scripts above - each step has validation built in.

**Estimated timeline:**
- Phase 1: 4-6 hours (mostly CPU time)
- Phase 2: 30 minutes
- Phase 3: 1 hour setup, then automated forever

**Total time to production**: ~1 day of work, FREE forever! 🎉

