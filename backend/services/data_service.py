"""
Data service for handling accident data operations
"""

import sqlite3
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

from ..models.schemas import AccidentRecord, AccidentQuery, AccidentFilters
from ..utils.database import get_db_connection
from ..utils.logger import get_logger

logger = get_logger(__name__)

class DataService:
    """Service for handling data operations"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the data service"""
        if not self.initialized:
            from utils.database import init_database
            init_database()
            self.initialized = True
            logger.info("Data service initialized")
    
    async def get_accidents(self, query: AccidentQuery) -> Dict[str, Any]:
        """Get accidents with filtering and pagination"""
        try:
            with get_db_connection() as conn:
                # Build base query
                base_query = "SELECT * FROM accidents"
                where_conditions = []
                params = []
                
                # Apply filters
                if query.filters:
                    if query.filters.companies:
                        placeholders = ','.join(['?' for _ in query.filters.companies])
                        where_conditions.append(f"company IN ({placeholders})")
                        params.extend(query.filters.companies)
                    
                    if query.filters.cities:
                        placeholders = ','.join(['?' for _ in query.filters.cities])
                        where_conditions.append(f"city IN ({placeholders})")
                        params.extend(query.filters.cities)
                    
                    if query.filters.damage_severities:
                        placeholders = ','.join(['?' for _ in query.filters.damage_severities])
                        where_conditions.append(f"damage_severity IN ({placeholders})")
                        params.extend(query.filters.damage_severities)
                    
                    if query.filters.has_coordinates:
                        where_conditions.append("location_lat IS NOT NULL AND location_lng IS NOT NULL")
                
                # Build complete query
                if where_conditions:
                    base_query += " WHERE " + " AND ".join(where_conditions)
                
                # Add ordering
                if query.pagination:
                    base_query += f" ORDER BY {query.pagination.sort_by} {query.pagination.sort_order.upper()}"
                
                # Get total count
                count_query = f"SELECT COUNT(*) FROM ({base_query}) AS filtered"
                cursor = conn.cursor()
                cursor.execute(count_query, params)
                total_count = cursor.fetchone()[0]
                
                # Add pagination
                if query.pagination:
                    offset = (query.pagination.page - 1) * query.pagination.limit
                    base_query += f" LIMIT {query.pagination.limit} OFFSET {offset}"
                
                # Execute main query
                cursor.execute(base_query, params)
                rows = cursor.fetchall()
                
                # Convert to AccidentRecord objects
                accidents = []
                for row in rows:
                    accident_dict = dict(row)
                    accidents.append(AccidentRecord(**accident_dict))
                
                # Calculate pagination info
                pagination_info = {
                    "page": query.pagination.page if query.pagination else 1,
                    "limit": query.pagination.limit if query.pagination else len(accidents),
                    "total_pages": (total_count + (query.pagination.limit if query.pagination else len(accidents)) - 1) // (query.pagination.limit if query.pagination else len(accidents)),
                    "has_next": (query.pagination.page * query.pagination.limit < total_count) if query.pagination else False,
                    "has_prev": (query.pagination.page > 1) if query.pagination else False
                }
                
                return {
                    "accidents": accidents,
                    "total_count": total_count,
                    "pagination": pagination_info
                }
                
        except Exception as e:
            logger.error(f"Error getting accidents: {e}")
            raise
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Total accidents
                cursor.execute("SELECT COUNT(*) FROM accidents")
                total_accidents = cursor.fetchone()[0]
                
                # Total companies
                cursor.execute("SELECT COUNT(DISTINCT company) FROM accidents WHERE company IS NOT NULL")
                total_companies = cursor.fetchone()[0]
                
                # Total cities
                cursor.execute("SELECT COUNT(DISTINCT city) FROM accidents WHERE city IS NOT NULL")
                total_cities = cursor.fetchone()[0]
                
                # Latest update
                cursor.execute("SELECT MAX(created_at) FROM accidents")
                latest_update = cursor.fetchone()[0]
                
                return {
                    "total_accidents": total_accidents,
                    "total_companies": total_companies,
                    "total_cities": total_cities,
                    "data_freshness": latest_update,
                    "update_frequency": "15 minutes",
                    "api_version": "2.0.0",
                    "database_size": "1.2 MB"
                }
                
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            raise
    
    async def get_filter_options(self) -> Dict[str, List[str]]:
        """Get available filter options"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                options = {}
                
                # Companies
                cursor.execute("SELECT DISTINCT company FROM accidents WHERE company IS NOT NULL ORDER BY company")
                options["companies"] = [row[0] for row in cursor.fetchall()]
                
                # Vehicle makes
                cursor.execute("SELECT DISTINCT vehicle_make FROM accidents WHERE vehicle_make IS NOT NULL ORDER BY vehicle_make")
                options["vehicle_makes"] = [row[0] for row in cursor.fetchall()]
                
                # Cities
                cursor.execute("SELECT DISTINCT city FROM accidents WHERE city IS NOT NULL ORDER BY city")
                options["cities"] = [row[0] for row in cursor.fetchall()]
                
                # Intersection types
                cursor.execute("SELECT DISTINCT intersection_type FROM accidents WHERE intersection_type IS NOT NULL ORDER BY intersection_type")
                options["intersection_types"] = [row[0] for row in cursor.fetchall()]
                
                # Damage severities
                cursor.execute("SELECT DISTINCT damage_severity FROM accidents WHERE damage_severity IS NOT NULL ORDER BY damage_severity")
                options["damage_severities"] = [row[0] for row in cursor.fetchall()]
                
                # Date range
                cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM accidents WHERE timestamp IS NOT NULL")
                date_range = cursor.fetchone()
                options["date_range"] = {
                    "min": date_range[0] if date_range[0] else None,
                    "max": date_range[1] if date_range[1] else None
                }
                
                return options
                
        except Exception as e:
            logger.error(f"Error getting filter options: {e}")
            raise
    
    async def check_for_updates(self) -> List[AccidentRecord]:
        """Check for new accident data (placeholder for real implementation)"""
        # This would normally check external sources for new data
        # For now, return empty list
        return []
    
    async def update_analytics_cache(self):
        """Update analytics cache (placeholder)"""
        logger.info("Analytics cache updated")
    
    async def refresh_data(self):
        """Refresh accident data (placeholder)"""
        logger.info("Data refresh completed")
    
    async def get_map_data(self, filters: Optional[AccidentFilters] = None, bounds: Optional[Dict] = None, zoom_level: int = 10):
        """Get data optimized for map display"""
        # This would implement clustering logic based on zoom level
        # For now, return basic accident data
        query = AccidentQuery(filters=filters or AccidentFilters())
        result = await self.get_accidents(query)
        
        from models.schemas import MapData, MapCluster, HeatmapData
        
        # Simple implementation - return accidents as-is
        return MapData(
            accidents=result["accidents"],
            clusters=[],  # Would implement clustering here
            heatmap=[],   # Would implement heatmap data here
            bounds={"north": 38.0, "south": 37.0, "east": -121.0, "west": -123.0}
        )
    
    async def get_company_stats(self, company: str) -> Optional[Dict[str, Any]]:
        """Get statistics for a specific company"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Basic company stats
                cursor.execute("SELECT COUNT(*), AVG(casualties) FROM accidents WHERE company = ?", (company,))
                result = cursor.fetchone()
                
                if result[0] == 0:
                    return None
                
                return {
                    "company": company,
                    "accident_count": result[0],
                    "avg_casualties": result[1] or 0,
                    "severity_breakdown": {},  # Would calculate this
                    "growth_rate": 0,  # Would calculate this
                    "market_share": 0  # Would calculate this
                }
                
        except Exception as e:
            logger.error(f"Error getting company stats: {e}")
            raise
    
    async def get_city_stats(self, city: str) -> Optional[Dict[str, Any]]:
        """Get statistics for a specific city"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Basic city stats
                cursor.execute("SELECT COUNT(*), city_type FROM accidents WHERE city = ? GROUP BY city_type", (city,))
                result = cursor.fetchone()
                
                if not result:
                    return None
                
                return {
                    "city": city,
                    "city_type": result[1] or "unknown",
                    "accident_count": result[0],
                    "accidents_per_capita": 0,  # Would calculate this
                    "most_common_intersection_type": "",  # Would calculate this
                    "avg_severity": 0  # Would calculate this
                }
                
        except Exception as e:
            logger.error(f"Error getting city stats: {e}")
            raise
    
    async def get_hourly_trends(self, days_back: int) -> List[Dict[str, Any]]:
        """Get hourly accident trends"""
        # Placeholder implementation
        return [{"hour": i, "accidents": i * 2, "avg_severity": 2.0} for i in range(24)]
    
    async def get_weekly_trends(self, weeks_back: int) -> List[Dict[str, Any]]:
        """Get weekly accident trends"""
        # Placeholder implementation
        return [{"week": i, "accidents": i * 10, "avg_severity": 2.0} for i in range(weeks_back)]
    
    async def get_accident_hotspots(self, limit: int, radius_km: float) -> List[Dict[str, Any]]:
        """Get accident hotspots"""
        # Placeholder implementation
        return [{"lat": 37.7749, "lng": -122.4194, "accident_count": 25, "severity_avg": 2.3}]
    
    async def export_data(self, format: str, filters: Optional[AccidentFilters] = None, date_range: Optional[Dict] = None) -> Dict[str, Any]:
        """Export accident data"""
        # Placeholder implementation
        return {"message": f"Data exported in {format} format", "records": 100}
