# DMV Scraper Setup Guide

## Overview

The AVAT DMV Scraper automatically fetches collision reports from the [California DMV Autonomous Vehicle Collision Reports](https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/) page and stores them in Neon PostgreSQL.

## Architecture

### Components

1. **Cloudflare Worker** (`backend-cloudflare/src/dmv-scraper.js`)
   - Scrapes HTML from DMV website
   - Extracts PDF links and metadata
   - Stores reports in Neon database
   - Runs daily at 5:00 AM UTC via cron trigger

2. **Database Tables** (in Neon PostgreSQL)
   - `dmv_reports` - Stores metadata for each collision report
   - `dmv_scrape_runs` - Tracks scraper execution history

3. **API Endpoints**
   - `POST /api/v1/scraper/dmv/run` - Manual trigger
   - `GET /api/v1/scraper/status` - View statistics

## Setup

### 1. Database Schema

Ensure the following tables exist in your Neon database:

```sql
-- DMV Reports table
CREATE TABLE IF NOT EXISTS dmv_reports (
    id SERIAL PRIMARY KEY,
    manufacturer TEXT NOT NULL,
    incident_date DATE NOT NULL,
    year INTEGER NOT NULL,
    sequence_num INTEGER DEFAULT 1,
    display_text TEXT,
    page_url TEXT,
    pdf_url TEXT,
    source_slug TEXT UNIQUE NOT NULL,
    pdf_sha256 TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'downloaded', 'parsed', 'error'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dmv_reports_manufacturer ON dmv_reports(manufacturer);
CREATE INDEX idx_dmv_reports_incident_date ON dmv_reports(incident_date);
CREATE INDEX idx_dmv_reports_status ON dmv_reports(status);

-- DMV Scrape Runs table
CREATE TABLE IF NOT EXISTS dmv_scrape_runs (
    id SERIAL PRIMARY KEY,
    status TEXT NOT NULL, -- 'success', 'partial', 'error'
    found INTEGER DEFAULT 0,
    new INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP
);
```

### 2. Environment Variables

Add to `wrangler.toml` (already configured):

```toml
[vars]
DATABASE_URL = "postgresql://user:password@host/database?sslmode=require"

# Optional: Secret token for manual trigger
# Run: wrangler secret put SCRAPER_SECRET
# SCRAPER_SECRET = "Bearer your-secret-token"
```

### 3. Cron Schedule

The scraper runs daily at 5:00 AM UTC. This is configured in `wrangler.toml`:

```toml
[triggers]
crons = [
  "0 5 * * *"  # Daily at 5:00 AM UTC
]
```

### 4. Deploy

```bash
cd backend-cloudflare
npm install
wrangler deploy
```

## Usage

### Automatic (Cron)

The scraper runs automatically every day at 5:00 AM UTC. Check logs in Cloudflare dashboard.

### Manual Trigger

```bash
# Trigger a scrape manually
curl -X POST https://avat-backend.v-naradasi.workers.dev/api/v1/scraper/dmv/run \
  -H "Authorization: Bearer your-secret-token"

# Check scraper status
curl https://avat-backend.v-naradasi.workers.dev/api/v1/scraper/status
```

### Stress Test

Run the comprehensive stress test to verify all reports are captured:

```bash
cd backend-cloudflare
export DATABASE_URL="your_database_url"
node test-scraper.js
```

Expected output:
- ✅ 868+ total reports
- ✅ All major companies (Waymo, Cruise, Zoox, Tesla, Nuro, etc.)
- ✅ Date range: 2014-2025
- ✅ No missing PDF URLs or invalid dates

## Data Flow

```
DMV Website (HTML)
    ↓
Cloudflare Worker (scraper)
    ↓
Neon PostgreSQL (dmv_reports table)
    ↓
Dashboard API (/api/v1/stats, /api/v1/analytics/overview)
    ↓
Frontend Dashboard
```

## Monitoring

### Check Latest Run

```bash
curl https://avat-backend.v-naradasi.workers.dev/api/v1/scraper/status
```

Response:
```json
{
  "latest_run": {
    "id": 123,
    "status": "success",
    "found": 875,
    "new": 7,
    "errors": 0,
    "created_at": "2025-10-08T05:00:15Z",
    "finished_at": "2025-10-08T05:00:42Z"
  },
  "statistics": {
    "total_reports": 875,
    "total_companies": 18,
    "earliest_date": "2014-10-14",
    "latest_date": "2025-10-07"
  },
  "status_breakdown": [
    { "status": "new", "count": 875 }
  ]
}
```

### Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your Workers & Pages project
3. Click "Logs" to view scraper execution logs
4. Check "Cron Triggers" for scheduled execution history

## Troubleshooting

### Issue: Scraper not running on schedule

**Solution**: Check cron trigger is enabled in Cloudflare dashboard:
1. Workers & Pages → Your worker → Settings → Triggers → Cron Triggers
2. Verify `0 5 * * *` is listed and enabled

### Issue: Reports not being saved to database

**Solution**: 
1. Check `DATABASE_URL` is correctly set in wrangler.toml
2. Verify database connection: `curl https://avat-backend.v-naradasi.workers.dev/api/v1/stats`
3. Check Cloudflare Worker logs for errors

### Issue: Fewer than 868 reports found

**Solution**:
1. Run the stress test: `node test-scraper.js`
2. Check DMV website structure hasn't changed
3. Verify HTML parsing regex in `dmv-scraper.js`
4. Look for errors in latest scrape run

### Issue: PDF URLs are broken

**Solution**:
1. DMV may have changed PDF URL structure
2. Check a sample PDF URL manually
3. Update `DMV_DOMAIN` and URL construction logic if needed

## Data Quality

The scraper performs the following validation:

1. **Parse anchor text** - Extracts manufacturer, date, sequence number
2. **Construct PDF URL** - Handles both relative and absolute URLs
3. **Deduplicate** - Uses `source_slug` (unique constraint)
4. **Error tracking** - Records errors in `dmv_scrape_runs`

## Future Enhancements

### Phase 2: PDF Download & Parsing

Currently, the scraper only stores PDF URLs. To download and parse PDFs:

1. **Option A**: Extend Cloudflare Worker
   - Use external PDF parsing API (pdf.co, Adobe PDF Services)
   - Store parsed data in `accidents` table

2. **Option B**: Separate Processing Job
   - Python backend downloads PDFs on schedule
   - Uses existing `pdfplumber` + `pytesseract` logic
   - Cloudflare Worker just tracks what needs processing

3. **Option C**: Hybrid Approach
   - Worker scrapes + stores URLs (current)
   - GitHub Action runs Python backend daily
   - Python backend processes `status='new'` reports

## API Reference

### POST /api/v1/scraper/dmv/run

Manually trigger a scrape.

**Headers:**
- `Authorization: Bearer <token>` (optional, set via `SCRAPER_SECRET`)

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 875,
    "new": 7,
    "updated": 868,
    "errors": 0
  },
  "companies": ["Waymo", "Cruise", "Zoox", ...],
  "elapsed": "12.5s"
}
```

### GET /api/v1/scraper/status

Get scraper statistics and latest run info.

**Response:**
```json
{
  "latest_run": { ... },
  "statistics": { ... },
  "status_breakdown": [ ... ],
  "timestamp": "2025-10-08T12:00:00Z"
}
```

## Links

- [DMV Collision Reports](https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Neon PostgreSQL](https://neon.tech/)

