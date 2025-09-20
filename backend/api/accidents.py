"""
Accidents API endpoints
Handles CRUD operations and queries for accident data
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import List, Optional
import sqlite3
import pandas as pd
from datetime import datetime, timedelta

from models.schemas import (
    AccidentRecord, AccidentQuery, AccidentResponse, AccidentFilters,
    PaginationParams, MapData, APIResponse
)
from services.data_service import DataService
from services.cache_service import CacheService
from utils.database import get_db_connection
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Services
data_service = DataService()
cache_service = CacheService()

@router.get("/", response_model=AccidentResponse)
async def get_accidents(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=1000),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc"),
    company: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    has_coordinates: Optional[bool] = Query(None)
):
    """
    Get paginated list of accidents with optional filters
    """
    try:
        # Build filters
        filters = AccidentFilters()
        if company:
            filters.companies = [company]
        if city:
            filters.cities = [city]
        if severity:
            filters.damage_severities = [severity]
        if start_date and end_date:
            filters.date_range = {"start": start_date, "end": end_date}
        if has_coordinates is not None:
            filters.has_coordinates = has_coordinates

        # Build pagination
        pagination = PaginationParams(
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Query data
        query = AccidentQuery(filters=filters, pagination=pagination)
        result = await data_service.get_accidents(query)

        return AccidentResponse(
            data=result["accidents"],
            pagination=result["pagination"],
            total_count=result["total_count"],
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching accidents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=AccidentResponse)
async def search_accidents(query: AccidentQuery):
    """
    Advanced accident search with complex filters
    """
    try:
        # Check cache first
        cache_key = f"accidents:search:{hash(str(query.dict()))}"
        cached_result = await cache_service.get(cache_key)
        
        if cached_result:
            return AccidentResponse(**cached_result)

        # Query database
        result = await data_service.get_accidents(query)
        
        response = AccidentResponse(
            data=result["accidents"],
            pagination=result["pagination"],
            total_count=result["total_count"],
            timestamp=datetime.utcnow()
        )

        # Cache result for 5 minutes
        await cache_service.set(cache_key, response.dict(), expire=300)
        
        return response

    except Exception as e:
        logger.error(f"Error searching accidents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{accident_id}", response_model=AccidentRecord)
async def get_accident(accident_id: int):
    """
    Get specific accident by ID
    """
    try:
        # Check cache first
        cache_key = f"accident:{accident_id}"
        cached_accident = await cache_service.get(cache_key)
        
        if cached_accident:
            return AccidentRecord(**cached_accident)

        # Query database
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM accidents WHERE id = ?", (accident_id,))
            row = cursor.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Accident not found")
            
            # Convert row to dict
            columns = [desc[0] for desc in cursor.description]
            accident_data = dict(zip(columns, row))
            
            accident = AccidentRecord(**accident_data)
            
            # Cache for 1 hour
            await cache_service.set(cache_key, accident.dict(), expire=3600)
            
            return accident

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching accident {accident_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/map/data", response_model=MapData)
async def get_map_data(
    bounds_north: Optional[float] = Query(None),
    bounds_south: Optional[float] = Query(None),
    bounds_east: Optional[float] = Query(None),
    bounds_west: Optional[float] = Query(None),
    zoom_level: int = Query(10, ge=1, le=20),
    company: Optional[str] = Query(None),
    severity: Optional[str] = Query(None)
):
    """
    Get accident data optimized for map display with clustering
    """
    try:
        # Build cache key
        cache_key = f"map_data:{bounds_north}:{bounds_south}:{bounds_east}:{bounds_west}:{zoom_level}:{company}:{severity}"
        
        # Check cache
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            return MapData(**cached_data)

        # Build filters
        filters = AccidentFilters()
        if company:
            filters.companies = [company]
        if severity:
            filters.damage_severities = [severity]
        
        # Add coordinate filter
        filters.has_coordinates = True

        # Get map data from service
        map_data = await data_service.get_map_data(
            filters=filters,
            bounds={
                "north": bounds_north,
                "south": bounds_south,
                "east": bounds_east,
                "west": bounds_west
            } if all([bounds_north, bounds_south, bounds_east, bounds_west]) else None,
            zoom_level=zoom_level
        )

        # Cache for 10 minutes
        await cache_service.set(cache_key, map_data.dict(), expire=600)
        
        return map_data

    except Exception as e:
        logger.error(f"Error fetching map data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/companies/{company}/stats")
async def get_company_stats(company: str):
    """
    Get detailed statistics for a specific company
    """
    try:
        cache_key = f"company_stats:{company}"
        cached_stats = await cache_service.get(cache_key)
        
        if cached_stats:
            return APIResponse(
                data=cached_stats,
                timestamp=datetime.utcnow()
            )

        stats = await data_service.get_company_stats(company)
        
        if not stats:
            raise HTTPException(status_code=404, detail="Company not found")

        # Cache for 30 minutes
        await cache_service.set(cache_key, stats, expire=1800)
        
        return APIResponse(
            data=stats,
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company stats for {company}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cities/{city}/stats")
async def get_city_stats(city: str):
    """
    Get detailed statistics for a specific city
    """
    try:
        cache_key = f"city_stats:{city}"
        cached_stats = await cache_service.get(cache_key)
        
        if cached_stats:
            return APIResponse(
                data=cached_stats,
                timestamp=datetime.utcnow()
            )

        stats = await data_service.get_city_stats(city)
        
        if not stats:
            raise HTTPException(status_code=404, detail="City not found")

        # Cache for 30 minutes
        await cache_service.set(cache_key, stats, expire=1800)
        
        return APIResponse(
            data=stats,
            timestamp=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching city stats for {city}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh", status_code=202)
async def refresh_accident_data(background_tasks: BackgroundTasks):
    """
    Trigger manual refresh of accident data
    """
    try:
        # Add background task to refresh data
        background_tasks.add_task(data_service.refresh_data)
        
        return APIResponse(
            data={"message": "Data refresh initiated"},
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error initiating data refresh: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/hourly")
async def get_hourly_trends(
    days_back: int = Query(30, ge=1, le=365)
):
    """
    Get hourly accident trends for the specified number of days
    """
    try:
        cache_key = f"hourly_trends:{days_back}"
        cached_trends = await cache_service.get(cache_key)
        
        if cached_trends:
            return APIResponse(
                data=cached_trends,
                timestamp=datetime.utcnow()
            )

        trends = await data_service.get_hourly_trends(days_back)
        
        # Cache for 1 hour
        await cache_service.set(cache_key, trends, expire=3600)
        
        return APIResponse(
            data=trends,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching hourly trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/weekly")
async def get_weekly_trends(
    weeks_back: int = Query(12, ge=1, le=52)
):
    """
    Get weekly accident trends for the specified number of weeks
    """
    try:
        cache_key = f"weekly_trends:{weeks_back}"
        cached_trends = await cache_service.get(cache_key)
        
        if cached_trends:
            return APIResponse(
                data=cached_trends,
                timestamp=datetime.utcnow()
            )

        trends = await data_service.get_weekly_trends(weeks_back)
        
        # Cache for 2 hours
        await cache_service.set(cache_key, trends, expire=7200)
        
        return APIResponse(
            data=trends,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching weekly trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hotspots")
async def get_accident_hotspots(
    limit: int = Query(20, ge=1, le=100),
    radius_km: float = Query(1.0, ge=0.1, le=10.0)
):
    """
    Get accident hotspots (geographic clusters with high accident density)
    """
    try:
        cache_key = f"hotspots:{limit}:{radius_km}"
        cached_hotspots = await cache_service.get(cache_key)
        
        if cached_hotspots:
            return APIResponse(
                data=cached_hotspots,
                timestamp=datetime.utcnow()
            )

        hotspots = await data_service.get_accident_hotspots(limit, radius_km)
        
        # Cache for 1 hour
        await cache_service.set(cache_key, hotspots, expire=3600)
        
        return APIResponse(
            data=hotspots,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching accident hotspots: {e}")
        raise HTTPException(status_code=500, detail=str(e))
