"""
Database utilities and connection management
"""

import sqlite3
import os
from contextlib import contextmanager
from typing import Generator

DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'enhanced_accidents.db')

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Get database connection with context manager"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable column access by name
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize database with required tables"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create accidents table if it doesn't exist
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
        
        # Insert sample data if table is empty
        cursor.execute('SELECT COUNT(*) FROM accidents')
        if cursor.fetchone()[0] == 0:
            sample_data = [
                ('2023-12-15 14:30:00', 'Waymo', 'Chrysler', 'Pacifica', '1600 Amphitheatre Pkwy, Mountain View, CA', 37.4220, -122.0841, 'Mountain View', 'Santa Clara', 'suburban', 'traffic light', 'minor', 'clear', '14:30', 0, 'autonomous', 35, 'functioning', 'arterial', 'front', 'Waymo vehicle collision at traffic light intersection', 'https://dmv.ca.gov/report/1'),
                ('2023-12-14 09:15:00', 'Cruise', 'Chevrolet', 'Bolt', '101 California St, San Francisco, CA', 37.7929, -122.3963, 'San Francisco', 'San Francisco', 'urban', 'stop sign', 'moderate', 'fog', '09:15', 1, 'autonomous', 25, 'none', 'residential', 'side', 'Cruise vehicle accident at stop sign intersection', 'https://dmv.ca.gov/report/2'),
                ('2023-12-13 16:45:00', 'Tesla', 'Tesla', 'Model 3', '1 Hacker Way, Menlo Park, CA', 37.4847, -122.1477, 'Menlo Park', 'San Mateo', 'suburban', 'roundabout', 'severe', 'rain', '16:45', 2, 'disengaged', 30, 'none', 'arterial', 'multiple', 'Tesla autopilot disengagement before collision', 'https://dmv.ca.gov/report/3'),
                ('2023-12-12 11:20:00', 'Waymo', 'Chrysler', 'Pacifica', '2000 University Ave, Palo Alto, CA', 37.4419, -122.1430, 'Palo Alto', 'Santa Clara', 'suburban', 'traffic light', 'minor', 'clear', '11:20', 0, 'autonomous', 35, 'functioning', 'arterial', 'rear', 'Minor rear-end collision during traffic light stop', 'https://dmv.ca.gov/report/4'),
                ('2023-12-11 18:30:00', 'Cruise', 'Chevrolet', 'Bolt', '555 Mission St, San Francisco, CA', 37.7886, -122.3972, 'San Francisco', 'San Francisco', 'urban', 'intersection', 'moderate', 'clear', '18:30', 0, 'autonomous', 30, 'functioning', 'arterial', 'front', 'Intersection collision during rush hour', 'https://dmv.ca.gov/report/5')
            ]
            
            cursor.executemany('''
                INSERT INTO accidents (timestamp, company, vehicle_make, vehicle_model, location_address, location_lat, location_lng, city, county, city_type, intersection_type, damage_severity, weather_conditions, time_of_day, casualties, av_mode, speed_limit, traffic_signals, road_type, damage_location, raw_text, report_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', sample_data)
            
        conn.commit()
        print(f"Database initialized with {cursor.rowcount} sample records")
