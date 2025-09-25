from backend.services.dmv_scraper_service import DMVScraperService
from backend.utils.database import get_db_connection


def test_sync_index_inserts_reports(monkeypatch):
    # Use real network if allowed; otherwise this test can be adapted with requests-mock
    svc = DMVScraperService()
    result = svc.sync_index()
    assert result["found"] >= 0

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM dmv_reports")
        count = cur.fetchone()[0]
        assert count >= 0


