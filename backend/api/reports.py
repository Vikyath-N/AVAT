"""
Reports API endpoints for DMV scraping (Phase 1)
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from ..utils.database import get_db_connection
from ..utils.logger import get_logger
from ..services.dmv_scraper_service import DMVScraperService

router = APIRouter()
logger = get_logger(__name__)

@router.get("/latest")
async def get_latest_reports(limit: int = Query(50, ge=1, le=200)):
    try:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, manufacturer, incident_date, year, display_text, page_url, pdf_url, status, created_at
                FROM dmv_reports
                ORDER BY incident_date DESC, id DESC
                LIMIT ?
            """, (limit,))
            rows = [dict(zip([c[0] for c in cur.description], r)) for r in cur.fetchall()]
        return {"data": rows, "status": "success", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"get_latest_reports error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_reports_summary():
    try:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM dmv_reports")
            total = cur.fetchone()[0]
            cur.execute("SELECT year, COUNT(*) AS cnt FROM dmv_reports GROUP BY year ORDER BY year DESC")
            by_year = [dict(zip([c[0] for c in cur.description], r)) for r in cur.fetchall()]
            cur.execute("SELECT manufacturer, COUNT(*) AS cnt FROM dmv_reports GROUP BY manufacturer ORDER BY cnt DESC LIMIT 10")
            by_mfg = [dict(zip([c[0] for c in cur.description], r)) for r in cur.fetchall()]
            cur.execute("SELECT * FROM dmv_scrape_runs ORDER BY id DESC LIMIT 1")
            last_run = cur.fetchone()
            last_run_dict = dict(zip([c[0] for c in cur.description], last_run)) if last_run else None
        return {"data": {"total": total, "by_year": by_year, "by_manufacturer": by_mfg, "last_run": last_run_dict}, "status": "success", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"get_reports_summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runs")
async def get_scrape_runs(limit: int = Query(20, ge=1, le=100)):
    try:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT * FROM dmv_scrape_runs ORDER BY id DESC LIMIT ?", (limit,))
            rows = [dict(zip([c[0] for c in cur.description], r)) for r in cur.fetchall()]
        return {"data": rows, "status": "success", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"get_scrape_runs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-index")
async def sync_index_now():
    try:
        svc = DMVScraperService()
        result = svc.sync_index()
        return {"data": result, "status": "success", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"sync_index_now error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-pdfs")
async def sync_pdfs_now(limit: int = 10):
    try:
        svc = DMVScraperService()
        result = svc.sync_pdfs(limit=limit)
        return {"data": result, "status": "success", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"sync_pdfs_now error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


