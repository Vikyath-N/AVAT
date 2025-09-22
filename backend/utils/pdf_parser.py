"""
PDF parsing utilities (Phase 2)
 - Extract raw text and page count from PDF
 - Run regex-based field extraction (leverages patterns from EnhancedDataExtractor)
"""

import hashlib
from typing import Dict, Any, Optional, Tuple
import pdfplumber


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def extract_text_and_pages(path: str) -> Tuple[str, int]:
    text_parts = []
    pages = 0
    with pdfplumber.open(path) as pdf:
        pages = len(pdf.pages)
        for p in pdf.pages:
            txt = p.extract_text() or ""
            text_parts.append(txt)
    return "\n".join(text_parts), pages


