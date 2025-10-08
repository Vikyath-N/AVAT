"""
Enhanced Data Pipeline for AV Accident Analysis
Extracts detailed metadata from accident reports including:
- Vehicle make/model
- Geolocation data
- Intersection types
- Damage patterns
- Weather conditions
"""

import requests
from bs4 import BeautifulSoup
import sqlite3
import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging
from dataclasses import dataclass
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AccidentRecord:
    """Enhanced accident record with detailed metadata"""
    id: Optional[int] = None
    timestamp: Optional[datetime] = None
    company: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    location_address: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    city: Optional[str] = None
    county: Optional[str] = None
    intersection_type: Optional[str] = None
    damage_severity: Optional[str] = None
    weather_conditions: Optional[str] = None
    time_of_day: Optional[str] = None
    casualties: Optional[int] = None
    av_mode: Optional[str] = None  # autonomous, manual, disengagement
    speed_limit: Optional[int] = None
    traffic_signals: Optional[str] = None
    road_type: Optional[str] = None
    damage_location: Optional[str] = None  # front, rear, side, etc.
    raw_text: Optional[str] = None
    report_url: Optional[str] = None

class EnhancedDataExtractor:
    """Enhanced data extraction with NLP and geolocation capabilities"""
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="av_accident_analyzer")
        self.setup_database()
        
        # Enhanced regex patterns for metadata extraction
        self.patterns = {
            'vehicle_make': r'\b(Tesla|Waymo|Cruise|Zoox|Apple|Mercedes|BMW|Audi|Toyota|Honda|Ford|GM|Nissan|Hyundai|Kia|Volvo|Polestar|Lucid|Rivian|NIO|Xpeng|BYD)\b',
            'vehicle_model': r'\b(Model [SXY3]|Model S|Model 3|Model X|Model Y|Prius|Camry|Accord|F-150|Silverado|Altima|Elantra|XC90|S90|EQS|iX|e-tron)\b',
            'intersection_type': r'\b(intersection|traffic light|stop sign|roundabout|highway merge|freeway|arterial|residential)\b',
            'damage_severity': r'\b(minor|moderate|severe|total loss|no damage|property damage only)\b',
            'weather': r'\b(clear|rain|fog|cloudy|sunny|overcast|drizzle|storm)\b',
            'time_patterns': r'\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\b',
            'casualties': r'\b(\d+)\s*(?:injury|injuries|casualt|fatality|fatalities)\b',
            'av_mode': r'\b(autonomous|manual|disengaged|self-driving|autopilot)\b',
            'speed_limit': r'\b(\d+)\s*mph\b',
            'damage_location': r'\b(front|rear|side|left|right|driver|passenger)\s*(?:side|end|door|panel)?\b'
        }
        
        # City type classification
        self.city_types = {
            'urban': ['San Francisco', 'Los Angeles', 'San Diego', 'Oakland', 'Sacramento'],
            'suburban': ['Fremont', 'Mountain View', 'Palo Alto', 'Santa Clara', 'Sunnyvale'],
            'rural': ['Fresno', 'Bakersfield', 'Modesto', 'Stockton']
        }

    def setup_database(self):
        """Create enhanced database schema"""
        conn = sqlite3.connect('enhanced_accidents.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS accidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                company TEXT,
                vehicle_make TEXT,
                vehicle_model TEXT,
                location_address TEXT,
                location_lat REAL,
                location_lng REAL,
                city TEXT,
                county TEXT,
                city_type TEXT,
                intersection_type TEXT,
                damage_severity TEXT,
                weather_conditions TEXT,
                time_of_day TEXT,
                casualties INTEGER,
                av_mode TEXT,
                speed_limit INTEGER,
                traffic_signals TEXT,
                road_type TEXT,
                damage_location TEXT,
                raw_text TEXT,
                report_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processing_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT,
                status TEXT,
                error_message TEXT,
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()

    def extract_metadata(self, text: str) -> Dict:
        """Extract structured metadata from accident report text"""
        metadata = {}
        
        for field, pattern in self.patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if field == 'casualties':
                    metadata[field] = int(matches[0]) if matches[0].isdigit() else 0
                elif field == 'speed_limit':
                    metadata[field] = int(matches[0]) if matches[0].isdigit() else None
                else:
                    metadata[field] = matches[0]
        
        return metadata

    def parse_location(self, text: str) -> Tuple[Optional[str], Optional[float], Optional[float], Optional[str], Optional[str]]:
        """Extract and geocode location information"""
        # Common address patterns in accident reports
        address_patterns = [
            r'\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln)\b',
            r'\b[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln)\s+and\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Way|Lane|Ln)\b',
            r'\b(?:Highway|Hwy|Interstate|I-|State Route|SR|Route)\s*\d+\b'
        ]
        
        address = None
        for pattern in address_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                address = matches[0]
                break
        
        if not address:
            return None, None, None, None, None
        
        try:
            time.sleep(1)  # Rate limiting for geocoding
            location = self.geolocator.geocode(f"{address}, California, USA")
            if location:
                # Extract city and county from address components
                city = self.extract_city_from_address(location.address)
                county = self.extract_county_from_address(location.address)
                return address, location.latitude, location.longitude, city, county
        except GeocoderTimedOut:
            logger.warning(f"Geocoding timeout for address: {address}")
        except Exception as e:
            logger.error(f"Geocoding error for {address}: {e}")
        
        return address, None, None, None, None

    def extract_city_from_address(self, full_address: str) -> Optional[str]:
        """Extract city name from geocoded address"""
        parts = full_address.split(', ')
        for part in parts:
            if 'CA' not in part and 'California' not in part and not part.isdigit():
                return part.strip()
        return None

    def extract_county_from_address(self, full_address: str) -> Optional[str]:
        """Extract county from geocoded address"""
        if 'County' in full_address:
            parts = full_address.split(', ')
            for part in parts:
                if 'County' in part:
                    return part.replace('County', '').strip()
        return None

    def classify_city_type(self, city: str) -> str:
        """Classify city as urban, suburban, or rural"""
        if not city:
            return 'unknown'
        
        for city_type, cities in self.city_types.items():
            if any(known_city.lower() in city.lower() for known_city in cities):
                return city_type
        
        return 'suburban'  # Default classification

    def scrape_and_process_reports(self) -> List[AccidentRecord]:
        """Enhanced scraping with detailed report processing"""
        url = 'https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/'
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch DMV page: {e}")
            return []

        soup = BeautifulSoup(response.text, 'html.parser')
        records = []
        
        # Process multiple years
        for year in ['2023', '2024', '2025']:
            accordion = soup.find('div', id=f'acc-{year}')
            if not accordion:
                continue
                
            links = accordion.find_all('a')
            logger.info(f"Found {len(links)} reports for {year}")
            
            for link in links:
                try:
                    record = self.process_single_report(link, year)
                    if record:
                        records.append(record)
                except Exception as e:
                    logger.error(f"Error processing report {link.get('href', 'unknown')}: {e}")
                    continue
        
        return records

    def process_single_report(self, link, year: str) -> Optional[AccidentRecord]:
        """Process individual accident report with enhanced extraction"""
        href = link.get('href')
        text = link.get_text().strip()
        full_url = f"https://www.dmv.ca.gov{href}" if href else None
        
        if not text or len(text) < 10:
            return None
        
        # Create base record
        record = AccidentRecord(
            raw_text=text,
            report_url=full_url
        )
        
        # Extract metadata using NLP patterns
        metadata = self.extract_metadata(text)
        
        # Map extracted metadata to record fields
        record.company = metadata.get('vehicle_make') or self.extract_company_from_text(text)
        record.vehicle_make = metadata.get('vehicle_make')
        record.vehicle_model = metadata.get('vehicle_model')
        record.intersection_type = metadata.get('intersection_type')
        record.damage_severity = metadata.get('damage_severity')
        record.weather_conditions = metadata.get('weather')
        record.time_of_day = metadata.get('time_patterns')
        record.casualties = metadata.get('casualties', 0)
        record.av_mode = metadata.get('av_mode')
        record.speed_limit = metadata.get('speed_limit')
        record.damage_location = metadata.get('damage_location')
        
        # Extract and geocode location
        address, lat, lng, city, county = self.parse_location(text)
        record.location_address = address
        record.location_lat = lat
        record.location_lng = lng
        record.city = city
        record.county = county
        
        # Classify city type
        if city:
            record.city_type = self.classify_city_type(city)
        
        # Extract timestamp from text
        record.timestamp = self.extract_timestamp(text, year)
        
        return record

    def extract_company_from_text(self, text: str) -> Optional[str]:
        """Enhanced company extraction with better pattern matching"""
        companies = [
            'Waymo', 'Cruise', 'Tesla', 'Zoox', 'Apple', 'Mercedes', 'BMW', 
            'Audi', 'Toyota', 'Honda', 'Ford', 'GM', 'Nissan', 'Hyundai',
            'Aurora', 'Argo AI', 'Nuro', 'WeRide', 'Pony.ai', 'AutoX'
        ]
        
        text_lower = text.lower()
        for company in companies:
            if company.lower() in text_lower:
                return company
        
        return None

    def extract_timestamp(self, text: str, year: str) -> Optional[datetime]:
        """Extract timestamp from accident report text"""
        # Look for date patterns
        date_patterns = [
            r'(\w+)\s+(\d{1,2}),?\s+' + year,
            r'(\d{1,2})/(\d{1,2})/' + year,
            r'(\d{4})-(\d{1,2})-(\d{1,2})'
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Parse different date formats
                    if len(matches[0]) == 2 and matches[0][0].isalpha():
                        month_name, day = matches[0]
                        return datetime.strptime(f"{month_name} {day} {year}", "%B %d %Y")
                    elif len(matches[0]) == 2 and matches[0][0].isdigit():
                        month, day = matches[0]
                        return datetime(int(year), int(month), int(day))
                except (ValueError, IndexError):
                    continue
        
        return None

    def save_records(self, records: List[AccidentRecord]):
        """Save processed records to enhanced database"""
        conn = sqlite3.connect('enhanced_accidents.db')
        cursor = conn.cursor()
        
        for record in records:
            cursor.execute('''
                INSERT INTO accidents (
                    timestamp, company, vehicle_make, vehicle_model,
                    location_address, location_lat, location_lng, city, county, city_type,
                    intersection_type, damage_severity, weather_conditions, time_of_day,
                    casualties, av_mode, speed_limit, traffic_signals, road_type,
                    damage_location, raw_text, report_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                record.timestamp, record.company, record.vehicle_make, record.vehicle_model,
                record.location_address, record.location_lat, record.location_lng, 
                record.city, record.county, record.city_type,
                record.intersection_type, record.damage_severity, record.weather_conditions,
                record.time_of_day, record.casualties, record.av_mode, record.speed_limit,
                record.traffic_signals, record.road_type, record.damage_location,
                record.raw_text, record.report_url
            ))
        
        conn.commit()
        conn.close()
        logger.info(f"Saved {len(records)} enhanced accident records")

    def generate_analytics_summary(self):
        """Generate analytics summary of processed data"""
        conn = sqlite3.connect('enhanced_accidents.db')
        
        # Load data into pandas for analysis
        df = pd.read_sql_query("SELECT * FROM accidents", conn)
        conn.close()
        
        if df.empty:
            logger.warning("No data found for analytics")
            return
        
        print("\n🚗 AV ACCIDENT ANALYTICS SUMMARY")
        print("=" * 50)
        
        # Company analysis
        print(f"\n📊 ACCIDENTS BY COMPANY:")
        company_counts = df['company'].value_counts()
        for company, count in company_counts.head(10).items():
            print(f"  {company}: {count} accidents")
        
        # Vehicle make analysis
        print(f"\n🚙 ACCIDENTS BY VEHICLE MAKE:")
        make_counts = df['vehicle_make'].value_counts()
        for make, count in make_counts.head(10).items():
            if make:
                print(f"  {make}: {count} accidents")
        
        # City type analysis
        print(f"\n🏙️ ACCIDENTS BY CITY TYPE:")
        city_type_counts = df['city_type'].value_counts()
        for city_type, count in city_type_counts.items():
            if city_type:
                print(f"  {city_type.title()}: {count} accidents")
        
        # Intersection analysis
        print(f"\n🚦 ACCIDENTS BY INTERSECTION TYPE:")
        intersection_counts = df['intersection_type'].value_counts()
        for intersection, count in intersection_counts.head(5).items():
            if intersection:
                print(f"  {intersection.title()}: {count} accidents")
        
        # Damage location analysis
        print(f"\n💥 MOST COMMON DAMAGE LOCATIONS:")
        damage_counts = df['damage_location'].value_counts()
        for location, count in damage_counts.head(5).items():
            if location:
                print(f"  {location.title()}: {count} accidents")
        
        # Geographic hotspots
        print(f"\n📍 TOP ACCIDENT CITIES:")
        city_counts = df['city'].value_counts()
        for city, count in city_counts.head(10).items():
            if city:
                print(f"  {city}: {count} accidents")

def main():
    """Main execution function"""
    extractor = EnhancedDataExtractor()
    
    print("🚀 Starting enhanced AV accident data extraction...")
    
    # Clear existing data
    conn = sqlite3.connect('enhanced_accidents.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM accidents')
    conn.commit()
    conn.close()
    
    # Process all reports
    records = extractor.scrape_and_process_reports()
    
    if records:
        extractor.save_records(records)
        extractor.generate_analytics_summary()
    else:
        logger.error("No records were processed successfully")

if __name__ == "__main__":
    main()
