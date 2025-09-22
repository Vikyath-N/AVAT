"""
DMV Scraper Service (Phase 1 - index only)
 - Fetch DMV collision reports index
 - Normalize manufacturer, incident_date, sequence_num
 - Upsert into dmv_reports table
 - Track scrape runs in dmv_scrape_runs
Foundation for Phase 2 PDF download/parsing.
"""

import re
import requests
from datetime import datetime
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup

from utils.database import get_db_connection
from utils.logger import get_logger
from utils.pdf_parser import extract_text_and_pages, sha256_file
try:
    from enhanced_data_pipeline import EnhancedDataExtractor, AccidentRecord as EnhancedAccident
except ModuleNotFoundError:
    # Allow import when running inside backend/ working directory
    import sys, os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
    from enhanced_data_pipeline import EnhancedDataExtractor, AccidentRecord as EnhancedAccident

logger = get_logger(__name__)

DMV_BASE_URL = "https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/"
ABS_BASE = "https://www.dmv.ca.gov"

class DmvReport:
    def __init__(self, manufacturer: str, incident_date: datetime, year: int, display_text: str, page_url: str, pdf_url: Optional[str], source_slug: str, sequence_num: int):
        self.manufacturer = manufacturer
        self.incident_date = incident_date
        self.year = year
        self.display_text = display_text
        self.page_url = page_url
        self.pdf_url = pdf_url
        self.source_slug = source_slug
        self.sequence_num = sequence_num

class DMVScraperService:
    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update({
            "User-Agent": "AVATBot/1.0 (+https://avat-platform.com)"
        })
        self.extractor = EnhancedDataExtractor()

    def list_reports(self) -> List[DmvReport]:
        """Fetches the DMV page and returns normalized report entries for recent years."""
        try:
            resp = self.session.get(DMV_BASE_URL, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch DMV page: {e}")
            return []

        soup = BeautifulSoup(resp.text, 'html.parser')
        all_reports: List[DmvReport] = []

        # Process multiple years commonly present
        for year in ["2025", "2024", "2023"]:
            block = soup.find('div', id=f'acc-{year}')
            if not block:
                continue
            for a in block.find_all('a'):
                text = (a.get_text() or "").strip()
                href = a.get('href') or ''
                page_url = ABS_BASE + href if href.startswith('/') else href
                report = self._normalize_anchor(text, page_url, int(year))
                if report:
                    all_reports.append(report)

        logger.info(f"Discovered {len(all_reports)} DMV index entries")
        return all_reports

    def _normalize_anchor(self, text: str, page_url: str, year: int) -> Optional[DmvReport]:
        """Parses anchor text like 'Waymo August 21, 2025 (2) (PDF)'"""
        # Manufacturer = first token capitalized word(s) before date
        # Sequence like (2) optional
        seq = 1
        m_seq = re.search(r"\((\d+)\)\s*\(PDF\)$", text, re.IGNORECASE)
        if m_seq:
            try:
                seq = int(m_seq.group(1))
            except ValueError:
                seq = 1

        # Remove trailing '(#) (PDF)' or '(PDF)'
        clean = re.sub(r"\s*\(\d+\)\s*\(PDF\)$", "", text, flags=re.IGNORECASE)
        clean = re.sub(r"\s*\(PDF\)$", "", clean, flags=re.IGNORECASE)

        # Expect format: '<Manufacturer> <Month> <DD>, <YYYY>'
        m = re.match(r"^(?P<mfg>[A-Za-z .&'-]+)\s+(?P<month>[A-Za-z]+)\s+(?P<day>\d{1,2}),?\s+(?P<yr>\d{4})$", clean)
        if not m:
            # Some entries might omit comma or have small variations; try a looser pattern
            m = re.match(r"^(?P<mfg>[A-Za-z .&'-]+)\s+(?P<month>[A-Za-z]+)\s+(?P<day>\d{1,2})\s+(?P<yr>\d{4})$", clean)
        if not m:
            logger.debug(f"Unable to parse anchor text: {text}")
            return None

        manufacturer = m.group('mfg').strip()
        month = m.group('month')
        day = int(m.group('day'))
        yr = int(m.group('yr'))
        try:
            incident_date = datetime.strptime(f"{month} {day} {yr}", "%B %d %Y")
        except ValueError:
            return None

        # The page_url on DMV is a file endpoint already (pdf); keep also as pdf_url
        pdf_url = page_url if page_url.lower().endswith('.pdf') or '/file/' in page_url else None
        source_slug = self._slugify(f"{manufacturer}-{incident_date.date()}-{seq}")

        return DmvReport(
            manufacturer=manufacturer,
            incident_date=incident_date,
            year=yr,
            display_text=text,
            page_url=page_url,
            pdf_url=pdf_url,
            source_slug=source_slug,
            sequence_num=seq
        )

    def _slugify(self, s: str) -> str:
        s = s.lower()
        s = re.sub(r"[^a-z0-9]+", "-", s)
        return s.strip('-')

    def sync_index(self) -> Dict[str, Any]:
        """Upserts newly discovered reports into dmv_reports and records the scrape run."""
        started = datetime.utcnow()
        found = 0
        new = 0
        errors = 0

        reports = self.list_reports()
        found = len(reports)

        try:
            with get_db_connection() as conn:
                cur = conn.cursor()
                # Create run row
                cur.execute("INSERT INTO dmv_scrape_runs (status, found, new, errors, notes) VALUES (?, ?, ?, ?, ?)",
                            ("running", 0, 0, 0, "index"))
                run_id = cur.lastrowid

                for r in reports:
                    try:
                        cur.execute(
                            """
                            INSERT OR IGNORE INTO dmv_reports (
                                manufacturer, incident_date, year, display_text, page_url, pdf_url, source_slug, sequence_num, status
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
                            """,
                            (r.manufacturer, r.incident_date.date(), r.year, r.display_text, r.page_url, r.pdf_url, r.source_slug, r.sequence_num)
                        )
                        if cur.rowcount > 0:
                            new += 1
                    except Exception as e:
                        errors += 1
                        logger.error(f"Upsert error for {r.display_text}: {e}")

                # finalize run
                cur.execute(
                    "UPDATE dmv_scrape_runs SET finished_at = ?, status = ?, found = ?, new = ?, errors = ? WHERE id = ?",
                    (datetime.utcnow(), "success" if errors == 0 else "partial", found, new, errors, run_id)
                )
                conn.commit()
        except Exception as e:
            logger.error(f"sync_index failed: {e}")
            return {"status": "error", "found": found, "new": new, "errors": errors}

        return {"status": "ok", "found": found, "new": new, "errors": errors}

    # -------- Phase 2 methods --------
    def download_pdf(self, report_id: int) -> Optional[Dict[str, Any]]:
        """Download PDF for a report row and record metadata (dmv_pdf_files)."""
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, pdf_url, year, manufacturer, source_slug FROM dmv_reports WHERE id = ?", (report_id,))
            row = cur.fetchone()
            if not row or not row[1]:
                return None
            _id, pdf_url, year, manufacturer, slug = row

        import os
        os.makedirs("/Users/vikyath/Projects/AVAT/data/pdfs", exist_ok=True)
        dest_dir = f"/Users/vikyath/Projects/AVAT/data/pdfs/{year}/{manufacturer}"
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = f"{dest_dir}/{slug}.pdf"

        try:
            r = self.session.get(pdf_url, timeout=60)
            r.raise_for_status()
            with open(dest_path, 'wb') as f:
                f.write(r.content)
        except requests.RequestException as e:
            logger.error(f"PDF download failed for {report_id}: {e}")
            return None

        sha = sha256_file(dest_path)
        text, pages = extract_text_and_pages(dest_path)
        size = len(open(dest_path, 'rb').read())

        with get_db_connection() as conn:
            cur = conn.cursor()
            # upsert into dmv_pdf_files
            cur.execute(
                """
                INSERT OR IGNORE INTO dmv_pdf_files (report_id, local_path, size_bytes, pages, sha256)
                VALUES (?, ?, ?, ?, ?)
                """,
                (report_id, dest_path, size, pages, sha)
            )
            # update report status and sha
            cur.execute("UPDATE dmv_reports SET pdf_sha256 = ?, status = 'downloaded' WHERE id = ?", (sha, report_id))
            conn.commit()

        return {"path": dest_path, "sha256": sha, "pages": pages, "text": text}

    def parse_and_persist(self, report_id: int, text: str, pdf_url: str, pdf_path: str) -> Optional[int]:
        """Parse text into an accident record and insert into accidents."""
        # Extract metadata using EnhancedDataExtractor
        record: EnhancedAccident = self.extractor.process_single_report(type('obj', (), {'get': lambda *_: None, 'get_text': lambda *_: text, 'get_attribute_list': lambda *_: []})(), str(datetime.utcnow().year))  # quick reuse not relying on link
        # Fallback: fill minimal fields if above returns None
        if not record:
            record = EnhancedAccident(raw_text=text)

        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT manufacturer, incident_date FROM dmv_reports WHERE id = ?", (report_id,))
            m = cur.fetchone()
            manufacturer = m[0] if m else None
            incident_date = m[1] if m else None

            cur.execute(
                """
                INSERT INTO accidents (
                    timestamp, company, vehicle_make, vehicle_model, location_address, location_lat, location_lng, city, county, city_type,
                    intersection_type, damage_severity, weather_conditions, time_of_day, casualties, av_mode, speed_limit, traffic_signals, road_type,
                    damage_location, raw_text, report_url, source, source_report_id, pdf_url, pdf_local_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'dmv_pdf', ?, ?, ?)
                """,
                (
                    record.timestamp, manufacturer or record.company, record.vehicle_make, record.vehicle_model, record.location_address, record.location_lat, record.location_lng,
                    record.city, record.county, getattr(record, 'city_type', None), record.intersection_type, record.damage_severity, record.weather_conditions, record.time_of_day,
                    record.casualties, record.av_mode, record.speed_limit, record.traffic_signals, record.road_type, record.damage_location, record.raw_text or text, pdf_url, report_id, pdf_url, pdf_path
                )
            )
            accident_id = cur.lastrowid
            cur.execute("UPDATE dmv_reports SET status = 'parsed' WHERE id = ?", (report_id,))
            conn.commit()
            return accident_id

    def sync_pdfs(self, limit: int = 10) -> Dict[str, Any]:
        """Download and parse PDFs for newest 'new' or 'downloaded' reports, up to limit."""
        downloaded = 0
        parsed = 0
        errors = 0
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, pdf_url FROM dmv_reports WHERE (status = 'new' OR status = 'downloaded') AND pdf_url IS NOT NULL ORDER BY incident_date DESC LIMIT ?", (limit,))
            rows = cur.fetchall()

        for (report_id, pdf_url) in rows:
            try:
                meta = self.download_pdf(report_id)
                if meta:
                    downloaded += 1
                    if self.parse_and_persist(report_id, meta["text"], pdf_url, meta["path"]):
                        parsed += 1
            except Exception as e:
                logger.error(f"sync_pdfs error for report {report_id}: {e}")
                errors += 1

        return {"downloaded": downloaded, "parsed": parsed, "errors": errors}


