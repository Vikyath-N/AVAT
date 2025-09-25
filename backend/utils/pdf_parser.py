"""
PDF parsing utilities (Phase 2)
 - Extract raw text and page count from PDF
 - Run regex-based field extraction (leverages patterns from EnhancedDataExtractor)
"""

import hashlib
from typing import Dict, Any, Optional, Tuple, List
import re
from collections import Counter
import pdfplumber
from PIL import Image
import pytesseract
from pytesseract import Output
from pdf2image import convert_from_path

SECTION1_FIELDS = {
    "manufacturer_name": (750, 450, 1200, 100),
    "business_name": (750, 550, 1200, 100)
}

SECTION2_FIELDS = {
    "date_of_accident": (450, 780, 350, 100),
    "time_of_accident": (900, 780, 200, 100),
    "vehicle_year": (1200, 780, 150, 100),
    "make": (1400, 780, 300, 100),
    "model": (1750, 780, 350, 100),
    "address": (450, 1020, 1200, 120),
    "city": (1650, 1020, 400, 120),
    "county": (2100, 1020, 400, 120),
    "state": (2500, 1020, 100, 120),
    "zip": (2600, 1020, 200, 120),
    "num_vehicles_involved": (2400, 1320, 300, 100)
}

SECTION2_CHECKBOXES = {
    "vehicle_was_moving": (440, 1290, 500, 1350),
    "vehicle_was_stopped_in_traffic": (440, 1360, 500, 1420)
}

SECTION5_CHECKBOXES = {
    "weather_clear": (440, 2100, 495, 2155),
    "weather_cloudy": (440, 2170, 495, 2225),
    "lighting_daylight": (990, 2100, 1045, 2155),
    "movement_stopped": (1410, 2100, 1465, 2155),
    "movement_proceeding_straight": (1410, 2170, 1465, 2225),
    "movement_slowing": (1410, 2310, 1465, 2365),
    "associated_none_apparent": (1950, 2310, 2005, 2365),
    "roadway_surface_dry": (2250, 2100, 2305, 2155),
    "roadway_conditions_none": (2250, 2380, 2305, 2435),
    "collision_head_on": (2680, 2100, 2735, 2155)
}
import os
import json


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def extract_text_and_pages(path: str) -> Tuple[str, int]:
    text_parts: List[str] = []
    pages = 0
    with pdfplumber.open(path) as pdf:
        pages = len(pdf.pages)
        for p in pdf.pages:
            txt = p.extract_text() or ""
            text_parts.append(txt)
    return "\n".join(text_parts), pages


def _remove_headers_footers(page_texts: List[str]) -> List[str]:
    """Heuristically remove repeated header/footer lines across pages (watermarks)."""
    # Count line occurrences across pages (set-based per page to avoid double counting)
    line_counts: Counter[str] = Counter()
    per_page_lines: List[List[str]] = []
    for txt in page_texts:
        lines = [l.strip() for l in txt.splitlines() if l.strip()]
        per_page_lines.append(lines)
        line_counts.update(set(lines))

    num_pages = max(1, len(page_texts))
    # Lines repeated on >= half the pages are likely headers/footers
    threshold = max(2, num_pages // 2)
    repeated = {line for line, cnt in line_counts.items() if cnt >= threshold}

    # Common DMV watermark/header/footer patterns
    ignore_patterns = [
        r"^STATE OF CALIFORNIA$",
        r"^Department of Motor Vehicles$",
        r"^Autonomous Vehicle Collision Report$",
        r"^Page\s+\d+\s+of\s+\d+$",
        r"^REDACTED$",
        r"^Confidential$",
        r"^—+$",
        r"^_+$",
    ]
    ignore_regex = re.compile("|".join(ignore_patterns), re.IGNORECASE)

    cleaned_pages: List[str] = []
    for lines in per_page_lines:
        kept = [l for l in lines if l not in repeated and not ignore_regex.search(l)]
        cleaned_pages.append("\n".join(kept))
    return cleaned_pages


def _normalize_whitespace(text: str) -> str:
    # Collapse excessive blank lines and trim spaces
    text = re.sub(r"\s+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_clean_text_and_pages(path: str) -> Tuple[str, int]:
    """
    Extract text and page count, de-watermarking by removing repeated headers/footers
    and common DMV watermark artifacts.
    """
    with pdfplumber.open(path) as pdf:
        pages = len(pdf.pages)
        page_texts = [(p.extract_text() or "") for p in pdf.pages]
    cleaned_pages = _remove_headers_footers(page_texts)
    cleaned = _normalize_whitespace("\n\n".join(cleaned_pages))
    return cleaned, pages


def ocr_full_text(path: str) -> str:
    """OCR the entire PDF (page by page) using Tesseract and return concatenated text."""
    texts: List[str] = []
    with pdfplumber.open(path) as pdf:
        for p in pdf.pages:
            # Render to image for OCR
            img = p.to_image(resolution=300).original.convert("L")
            txt = pytesseract.image_to_string(img)
            texts.append(txt)
    return _normalize_whitespace("\n\n".join(texts))


def extract_with_ocr_fallback(path: str) -> Tuple[str, int, bool]:
    """
    Try structural text extraction first; if key headers exist but fields are missing,
    fall back to OCR text and return (text, pages, used_ocr).
    """
    text, pages = extract_clean_text_and_pages(path)
    # If text lacks common field tokens, use OCR
    need_ocr = not any(k in text for k in ["DATE OF ACCIDENT", "TIME OF ACCIDENT", "VEHICLE YEAR", "ADDRESS/LOCATION OF ACCIDENT"])  # coarse
    if need_ocr:
        ocr_text = ocr_full_text(path)
        return ocr_text, pages, True
    return text, pages, False


# ---------------- Region-based OCR helpers ---------------- #

def _image_to_data(img: Image.Image) -> Dict[str, List]:
    return pytesseract.image_to_data(img, output_type=Output.DICT)


def _normalize_word(word: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "", word or "").lower()


def _find_phrase_bbox(data: Dict[str, List], phrase: str) -> Optional[Tuple[int, int, int, int]]:
    """Find bounding box for a phrase by consecutive word matching."""
    words = [_normalize_word(w) for w in phrase.split() if _normalize_word(w)]
    if not words:
        return None
    n = len(data["text"])
    for i in range(n):
        if _normalize_word(data["text"][i]) != words[0]:
            continue
        j = 1
        last = i
        while j < len(words) and (last + 1) < n and _normalize_word(data["text"][last + 1]) == words[j]:
            last += 1
            j += 1
        if j == len(words):
            xs = [data["left"][k] for k in range(i, last + 1)]
            ys = [data["top"][k] for k in range(i, last + 1)]
            ws = [data["width"][k] for k in range(i, last + 1)]
            hs = [data["height"][k] for k in range(i, last + 1)]
            x0 = min(xs)
            y0 = min(ys)
            x1 = max([xs[k - i] + ws[k - i] for k in range(i, last + 1)])
            y1 = max([ys[k - i] + hs[k - i] for k in range(i, last + 1)])
            return (x0, y0, x1, y1)
    return None


def _crop_right(img: Image.Image, bbox: Tuple[int, int, int, int], frac_w: float = 0.28, h_scale: float = 1.6) -> Image.Image:
    img_w, img_h = img.size
    x0, y0, x1, y1 = bbox
    width = int(img_w * frac_w)
    height = int((y1 - y0) * h_scale)
    cx0 = max(0, x1 + 10)
    cy0 = max(0, y0 - int((height - (y1 - y0)) / 2))
    cx1 = min(img_w, cx0 + width)
    cy1 = min(img_h, cy0 + height)
    return img.crop((cx0, cy0, cx1, cy1))


def _crop_field_area(img: Image.Image, anchor: Tuple[int, int], width: int, height: int) -> Image.Image:
    img_w, img_h = img.size
    x0 = max(0, anchor[0])
    y0 = max(0, anchor[1])
    x1 = min(img_w, x0 + width)
    y1 = min(img_h, y0 + height)
    return img.crop((x0, y0, x1, y1))


def _checkbox_checked(img: Image.Image, label_bbox: Tuple[int, int, int, int]) -> bool:
    """Check a small square left of label bbox for filled checkbox (dark pixels)."""
    x0, y0, _, y1 = label_bbox
    img_w, _ = img.size
    size = int((y1 - y0) * 0.9)
    cx1 = max(0, x0 - 8)
    cx0 = max(0, cx1 - size)
    cy0 = y0
    cy1 = y0 + size
    crop = img.crop((cx0, cy0, cx1, cy1)).convert('L')
    pixels = crop.load()
    dark = 0
    for yy in range(crop.size[1]):
        for xx in range(crop.size[0]):
            if pixels[xx, yy] < 140:
                dark += 1
    ratio = dark / max(1, crop.size[0] * crop.size[1])
    return ratio > 0.08


def extract_sections_with_regions(pdf_path: str) -> Dict[str, Any]:
    """
    Render page images and OCR targeted regions to populate key fields in sections 1 & 2,
    plus selected checkboxes in section 5.
    """
    result = {
        "section1": {},
        "section2": {},
        "section3": {},
        "section4": {},
        "section5": {
            "weather": [],
            "lighting": [],
            "movement_preceding_collision": [],
            "other_associated_factors": [],
            "roadway_surface": [],
            "roadway_conditions": [],
            "type_of_collision": []
        },
        "section6": {},
    }

    pages = convert_from_path(pdf_path, dpi=300, fmt='png')
    if not pages:
        return result
    page1 = pages[0]
    data = _image_to_data(page1)

    def _clean_text(t: str) -> str:
        t = t or ""
        t = t.replace('|', ' ').replace('—', '-').replace('–', '-')
        t = re.sub(r"\s+", " ", t)
        return t.strip()

    def read_field(rect: Tuple[int, int, int, int]) -> Optional[str]:
        crop = page1.crop((rect[0], rect[1], rect[0]+rect[2], rect[1]+rect[3])).convert('L')
        text = pytesseract.image_to_string(crop, config='--psm 7')
        text = _clean_text(text)
        return text or None

    def parse_date(t: Optional[str]) -> Optional[str]:
        if not t:
            return None
        m = re.search(r"(\d{1,2})[\-/](\d{1,2})[\-/](\d{2,4})", t)
        if m:
            mm, dd, yy = m.groups()
            if len(yy) == 2:
                yy = '20' + yy
            return f"{mm.zfill(2)}/{dd.zfill(2)}/{yy}"
        return None

    def parse_time(t: Optional[str]) -> Optional[str]:
        if not t:
            return None
        m = re.search(r"(\d{1,2}:\d{2})\s*(AM|PM)", t, re.IGNORECASE)
        return f"{m.group(1)} {m.group(2).upper()}" if m else None

    def parse_year(t: Optional[str]) -> Optional[str]:
        if not t:
            return None
        m = re.search(r"(20\d{2}|19\d{2})", t)
        return m.group(1) if m else None

    def parse_zip(t: Optional[str]) -> Optional[str]:
        if not t:
            return None
        m = re.search(r"\b(\d{5})(?:-\d{4})?\b", t)
        return m.group(1) if m else None

    def parse_state(t: Optional[str]) -> Optional[str]:
        if not t:
            return None
        m = re.search(r"\b([A-Z]{2})\b", t)
        return m.group(1) if m else None

    # Section 1 — Manufacturer / Business Name
    for key, rect in SECTION1_FIELDS.items():
        result["section1"][key] = read_field(rect)

    # Section 2 — Core fields
    for key, rect in SECTION2_FIELDS.items():
        text = read_field(rect)
        if key == "date_of_accident":
            text = parse_date(text)
        elif key == "time_of_accident":
            text = parse_time(text)
        elif key == "vehicle_year":
            text = parse_year(text)
        elif key == "state":
            text = parse_state(text)
        elif key == "zip":
            text = parse_zip(text)
        elif key == "num_vehicles_involved" and text:
            text = re.search(r"\d+", text).group(0) if re.search(r"\d+", text) else None
        result["section2"][key] = text

    # Vehicle was: Moving / Stopped in Traffic (checkboxes)
    stopped_bb = _find_phrase_bbox(data, "Stopped in Traffic")
    moving_bb = _find_phrase_bbox(data, "Vehicle was")
    if stopped_bb:
        result["section2"]["vehicle_was_stopped_in_traffic"] = _checkbox_checked(page1, stopped_bb)
    if moving_bb:
        result["section2"]["vehicle_was_moving"] = _checkbox_checked(page1, moving_bb)

    # Section 5 checkboxes mapping to semantic arrays
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["weather_clear"]):
        result["section5"]["weather"].append("CLEAR")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["weather_cloudy"]):
        result["section5"]["weather"].append("CLOUDY")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["lighting_daylight"]):
        result["section5"]["lighting"].append("DAYLIGHT")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["movement_stopped"]):
        result["section5"]["movement_preceding_collision"].append("STOPPED")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["movement_proceeding_straight"]):
        result["section5"]["movement_preceding_collision"].append("PROCEEDING STRAIGHT")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["movement_slowing"]):
        result["section5"]["movement_preceding_collision"].append("SLOWING/STOPPING")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["associated_none_apparent"]):
        result["section5"]["other_associated_factors"].append("NONE APPARENT")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["roadway_surface_dry"]):
        result["section5"]["roadway_surface"].append("DRY")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["roadway_conditions_none"]):
        result["section5"]["roadway_conditions"].append("NO UNUSUAL CONDITIONS")
    if _checkbox_checked(page1, SECTION5_CHECKBOXES["collision_head_on"]):
        result["section5"]["type_of_collision"].append("HEAD-ON")

    result["section6"]["present"] = True

    return result


def extract_damage_diagram_info(path: str, out_dir: str, slug: str) -> Tuple[Optional[str], Optional[Dict[str, float]]]:
    """
    Attempt to locate a "Shade in Damaged Area" diagram, crop it, save image, and
    compute coarse quadrant shading scores (front_left, front_right, rear_left, rear_right).
    Returns (saved_image_path, quadrant_scores) or (None, None) if not found.
    """
    try:
        os.makedirs(out_dir, exist_ok=True)
        with pdfplumber.open(path) as pdf:
            for page_index, p in enumerate(pdf.pages):
                text = (p.extract_text() or "").lower()
                has_phrase = "shade in damaged area" in text or "shaded in damaged area" in text

                # Determine diagram region heuristically
                width, height = p.width, p.height
                if has_phrase:
                    # Assume diagram sits below the phrase, roughly middle of page
                    y0 = height * 0.30
                    y1 = height * 0.80
                else:
                    # Fallback: center area
                    y0 = height * 0.25
                    y1 = height * 0.75
                x0 = width * 0.15
                x1 = width * 0.85

                bbox = (x0, y0, x1, y1)
                cropped = p.within_bbox(bbox)
                # Render cropped region to image
                try:
                    page_image = cropped.to_image(resolution=150)
                    pil_img = page_image.original
                except Exception:
                    # If rendering fails, skip page
                    continue

                # Convert to grayscale and compute quadrant darkness scores
                gray = pil_img.convert("L")
                img_w, img_h = gray.size
                pixels = gray.load()
                # Threshold for darkness (shading)
                threshold = 200

                def dark_ratio_region(x_start, y_start, x_end, y_end):
                    area = max(1, (x_end - x_start) * (y_end - y_start))
                    dark = 0
                    for yy in range(y_start, y_end):
                        for xx in range(x_start, x_end):
                            if pixels[xx, yy] < threshold:
                                dark += 1
                    return dark / area

                mid_x = img_w // 2
                mid_y = img_h // 2
                scores = {
                    "front_left": round(dark_ratio_region(0, 0, mid_x, mid_y), 3),
                    "front_right": round(dark_ratio_region(mid_x, 0, img_w, mid_y), 3),
                    "rear_left": round(dark_ratio_region(0, mid_y, mid_x, img_h), 3),
                    "rear_right": round(dark_ratio_region(mid_x, mid_y, img_w, img_h), 3),
                }

                # Save image
                out_path = os.path.join(out_dir, f"{slug}_diagram_p{page_index+1}.png")
                pil_img.save(out_path)
                return out_path, scores
    except Exception:
        return None, None

    return None, None


def parse_form_sections(clean_text: str) -> Dict[str, Any]:
    """
    Parse DMV AV form sections (1-6) from cleaned text. Heuristic parsing based on section headers
    and expected field labels. Returns a nested dict with keys 'section1'..'section6'.
    """
    s = clean_text
    def has(mark: str) -> bool:
        return mark.lower() in s.lower()

    sections: Dict[str, Any] = {
        "section1": {},
        "section2": {},
        "section3": {},
        "section4": {},
        "section5": {},
        "section6": {},
    }

    # SECTION 1 — MANUFACTURER’S INFORMATION
    mfg_name = None
    m = re.search(r"SECTION\s*1\s*—\s*MANUFACTURER[’']S\s*INFORMATION[\s\S]*?MANUFACTURER[’']S\s*NAME\s*(.+)", s, re.IGNORECASE)
    if m:
        mfg_name = m.group(1).splitlines()[0].strip()
    sections["section1"]["manufacturer_name"] = mfg_name

    # SECTION 2 — ACCIDENT INFORMATION/VEHICLE 1
    # Date
    m = re.search(r"DATE OF ACCIDENT\s*([0-9/\-]{8,10})", s, re.IGNORECASE)
    sections["section2"]["date_of_accident"] = m.group(1) if m else None
    # Time and AM/PM
    m = re.search(r"TIME OF ACCIDENT\s*([0-9:]{3,5})\s*(AM|PM)", s, re.IGNORECASE)
    if m:
        sections["section2"]["time_of_accident"] = f"{m.group(1)} {m.group(2).upper()}"
    else:
        sections["section2"]["time_of_accident"] = None
    # Year/Make/Model
    m = re.search(r"VEHICLE YEAR\s*(\d{4}).*?MAKE\s*([A-Za-z0-9\- ]+)\s*MODEL\s*([A-Za-z0-9\- ]+)", s, re.IGNORECASE|re.DOTALL)
    if m:
        sections["section2"].update({"vehicle_year": m.group(1).strip(), "make": m.group(2).strip(), "model": m.group(3).strip()})
    # Address / City / County / State / Zip
    m = re.search(r"ADDRESS/LOCATION OF ACCIDENT\s*(.+?)\s*CITY\s*(.+?)\s*COUNTY\s*(.+?)\s*STATE\s*(\w{2})\s*ZIP CODE\s*(\d{5})", s, re.IGNORECASE|re.DOTALL)
    if m:
        sections["section2"].update({
            "address": m.group(1).strip(),
            "city": m.group(2).strip(),
            "county": m.group(3).strip(),
            "state": m.group(4).strip(),
            "zip": m.group(5).strip(),
        })
    # Vehicle was (Moving/Stopped)
    sections["section2"]["vehicle_was"] = "Stopped in Traffic" if has("Stopped in Traffic") else ("Moving" if has("Vehicle was\n\s*Moving") else None)
    # Number of vehicles involved
    m = re.search(r"NUMBER OF VEHICLES INVOLVED\s*(\d+)", s, re.IGNORECASE)
    sections["section2"]["num_vehicles_involved"] = int(m.group(1)) if m else None

    # SECTION 3 — OTHER PARTY’S INFORMATION/VEHICLE 2 (heuristic placeholders)
    sections["section3"]["present"] = has("SECTION 3")

    # SECTION 4 — INJURY/DEATH, PROPERTY DAMAGE (checkbox cues)
    sections["section4"]["property_damage_present"] = has("PROPERTY DAMAGE")

    # SECTION 5 — ACCIDENT DETAILS (checkbox grid)
    # Weather
    sections["section5"]["weather"] = []
    if has("A. CLEAR"):
        sections["section5"]["weather"].append("CLEAR")
    if has("B. CLOUDY"):
        sections["section5"]["weather"].append("CLOUDY")
    if has("C. RAINING"):
        sections["section5"]["weather"].append("RAINING")
    # Lighting
    if has("A. DAYLIGHT"):
        sections["section5"]["lighting"] = "DAYLIGHT"
    # Movement preceding collision
    if has("B. PROCEEDING STRAIGHT"):
        sections["section5"]["movement_preceding_collision"] = "PROCEEDING STRAIGHT"
    if has("H. SLOWING/STOPPING"):
        sections["section5"]["movement_preceding_collision_secondary"] = "SLOWING/STOPPING"
    # Other associated factors
    if has("K. NONE APPARENT"):
        sections["section5"]["associated_factors"] = ["NONE APPARENT"]
    # Roadway surface
    if has("A. DRY"):
        sections["section5"]["roadway_surface"] = "DRY"
    # Type of collision
    if has("A. HEAD-ON"):
        sections["section5"]["type_of_collision"] = "HEAD-ON"

    # SECTION 6 — CERTIFICATION present
    sections["section6"]["present"] = has("SECTION 6")

    return sections


