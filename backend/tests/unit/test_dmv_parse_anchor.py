from backend.services.dmv_scraper_service import DMVScraperService


def _norm(text, year=2025):
    svc = DMVScraperService()
    return svc._normalize_anchor(text, page_url="https://www.dmv.ca.gov/portal/file/waymo_09032025-pdf/", year=year)


def test_parse_basic_pdf_anchor():
    r = _norm("Waymo September 3, 2025 (PDF)")
    assert r is not None
    assert r.manufacturer == "Waymo"
    assert r.incident_date.year == 2025
    assert r.sequence_num == 1


def test_parse_with_sequence():
    r = _norm("Waymo August 21, 2025 (2) (PDF)")
    assert r is not None
    assert r.sequence_num == 2


def test_parse_without_comma():
    r = _norm("Zoox August 26 2025 (PDF)")
    assert r is not None
    assert r.manufacturer == "Zoox"


