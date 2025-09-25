"""
Analytics API endpoints
Handles advanced analytics and reporting
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from models.schemas import AnalyticsData, APIResponse
from services.data_service import DataService
from services.cache_service import CacheService
from utils.logger import get_logger
from utils.database import get_db_connection

router = APIRouter()
logger = get_logger(__name__)

# Services
data_service = DataService()
cache_service = CacheService()

@router.get("/overview")
async def get_analytics_overview():
    """Get comprehensive analytics overview from real data"""
    try:
        cache_key = "analytics:overview"
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            return APIResponse(data=cached_data, timestamp=datetime.utcnow())

        overview: Dict[str, Any] = {
            "company_stats": [],
            "vehicle_stats": [],
            "city_stats": [],
            "summary": {}
        }

        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Summary: totals and trends
            cursor.execute("SELECT COUNT(*) FROM accidents")
            total_accidents = cursor.fetchone()[0]

            # last 30 days vs previous 30 for trend percentage
            cursor.execute("SELECT MAX(timestamp) FROM accidents")
            max_ts = cursor.fetchone()[0]
            if max_ts:
                cursor.execute("SELECT DATETIME(?, '-30 days')", (max_ts,))
                thirty_days_ago = cursor.fetchone()[0]
                cursor.execute("SELECT DATETIME(?, '-60 days')", (max_ts,))
                sixty_days_ago = cursor.fetchone()[0]

                cursor.execute("SELECT COUNT(*) FROM accidents WHERE timestamp > ?", (thirty_days_ago,))
                last_30 = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM accidents WHERE timestamp > ? AND timestamp <= ?", (sixty_days_ago, thirty_days_ago))
                prev_30 = cursor.fetchone()[0]
            else:
                last_30 = 0
                prev_30 = 0

            if prev_30 == 0:
                trend_percentage = 0.0
            else:
                trend_percentage = ((last_30 - prev_30) / prev_30) * 100.0
            trend_direction = "increasing" if trend_percentage > 0 else ("decreasing" if trend_percentage < 0 else "flat")

            # Most dangerous hour (by count)
            cursor.execute("""
                SELECT STRFTIME('%H:00', time_of_day) AS hour_bucket, COUNT(*)
                FROM accidents
                WHERE time_of_day IS NOT NULL AND TRIM(time_of_day) <> ''
                GROUP BY hour_bucket
                ORDER BY COUNT(*) DESC
                LIMIT 1
            """)
            row = cursor.fetchone()
            most_dangerous_hour = row[0] if row else None

            # Most common severity
            cursor.execute("SELECT damage_severity, COUNT(*) AS c FROM accidents WHERE damage_severity IS NOT NULL GROUP BY damage_severity ORDER BY c DESC LIMIT 1")
            row = cursor.fetchone()
            most_common_severity = row[0] if row else None

            overview["summary"] = {
                "total_accidents": total_accidents,
                "trend_direction": trend_direction,
                "trend_percentage": round(trend_percentage, 2),
                "most_dangerous_hour": most_dangerous_hour,
                "most_common_severity": most_common_severity,
            }

            # Company stats
            cursor.execute("""
                SELECT company, COUNT(*) AS cnt, AVG(COALESCE(casualties,0)) AS avg_casualties
                FROM accidents
                WHERE company IS NOT NULL
                GROUP BY company
                ORDER BY cnt DESC
                LIMIT 20
            """)
            companies = cursor.fetchall()
            total_with_company = sum([r[1] for r in companies]) or 1
            company_stats = []
            for company, cnt, avg_casualties in companies:
                # Severity breakdown per company
                cursor.execute(
                    "SELECT damage_severity, COUNT(*) FROM accidents WHERE company = ? AND damage_severity IS NOT NULL GROUP BY damage_severity",
                    (company,)
                )
                sev = {row[0]: row[1] for row in cursor.fetchall()}
                company_stats.append({
                    "company": company,
                    "accident_count": cnt,
                    "severity_breakdown": sev,
                    "avg_casualties": round(avg_casualties or 0, 2),
                    "market_share": round((cnt / total_with_company) * 100.0, 2)
                })
            overview["company_stats"] = company_stats

            # Vehicle stats (make/model)
            cursor.execute("""
                SELECT vehicle_make, vehicle_model, COUNT(*) AS cnt
                FROM accidents
                WHERE vehicle_make IS NOT NULL
                GROUP BY vehicle_make, vehicle_model
                ORDER BY cnt DESC
                LIMIT 20
            """)
            vehicle_stats = []
            for make, model, cnt in cursor.fetchall():
                # Most common damage for this make/model
                cursor.execute(
                    "SELECT damage_location, COUNT(*) AS c FROM accidents WHERE vehicle_make = ? AND vehicle_model = ? AND damage_location IS NOT NULL GROUP BY damage_location ORDER BY c DESC LIMIT 1",
                    (make, model)
                )
                row = cursor.fetchone()
                most_common_damage = row[0] if row else None
                vehicle_stats.append({
                    "make": make,
                    "model": model,
                    "accident_count": cnt,
                    "most_common_damage": most_common_damage
                })
            overview["vehicle_stats"] = vehicle_stats

            # City stats
            cursor.execute("""
                SELECT city, COALESCE(city_type, 'unknown') AS city_type, COUNT(*) AS cnt
                FROM accidents
                WHERE city IS NOT NULL
                GROUP BY city, city_type
                ORDER BY cnt DESC
                LIMIT 20
            """)
            city_stats = []
            for city, city_type, cnt in cursor.fetchall():
                # Average severity proxy: map severity strings to numeric 1..4
                cursor.execute(
                    """
                    SELECT AVG(
                        CASE LOWER(COALESCE(damage_severity,''))
                            WHEN 'minor' THEN 1
                            WHEN 'moderate' THEN 2
                            WHEN 'severe' THEN 3
                            WHEN 'total loss' THEN 4
                            ELSE 0
                        END
                    ) FROM accidents WHERE city = ?
                    """,
                    (city,)
                )
                avg_severity = cursor.fetchone()[0]
                # Common intersection type
                cursor.execute(
                    "SELECT intersection_type, COUNT(*) AS c FROM accidents WHERE city = ? AND intersection_type IS NOT NULL GROUP BY intersection_type ORDER BY c DESC LIMIT 1",
                    (city,)
                )
                row = cursor.fetchone()
                common_intersection = row[0] if row else None
                city_stats.append({
                    "city": city,
                    "city_type": city_type,
                    "accident_count": cnt,
                    "most_common_intersection_type": common_intersection,
                    "avg_severity": round(avg_severity or 0, 2)
                })
            overview["city_stats"] = city_stats

        # Cache for 30 minutes
        await cache_service.set(cache_key, overview, expire=1800)
        return APIResponse(data=overview, timestamp=datetime.utcnow())

    except Exception as e:
        logger.error(f"Error fetching analytics overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/temporal")
async def get_temporal_trends(
    period: str = Query("hourly", regex="^(hourly|daily|weekly|monthly)$"),
    days_back: int = Query(30, ge=1, le=365)
):
    """Get temporal accident trends"""
    try:
        cache_key = f"analytics:trends:{period}:{days_back}"
        cached_data = await cache_service.get(cache_key)
        
        if cached_data:
            return APIResponse(
                data=cached_data,
                timestamp=datetime.utcnow()
            )

        # Mock temporal data
        if period == "hourly":
            data = [
                {"hour": i, "accident_count": max(0, 20 + (i - 12) ** 2 // 10), "avg_severity": 2.0 + (i % 4) * 0.2}
                for i in range(24)
            ]
        else:
            data = [
                {"period": i, "accident_count": 15 + (i % 7) * 3, "avg_severity": 2.0}
                for i in range(min(days_back, 30))
            ]

        # Cache for 1 hour
        await cache_service.set(cache_key, data, expire=3600)
        
        return APIResponse(
            data=data,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching temporal trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/patterns/intersection")
async def get_intersection_patterns():
    """Get intersection-specific accident patterns"""
    try:
        cache_key = "analytics:patterns:intersection"
        cached_data = await cache_service.get(cache_key)
        
        if cached_data:
            return APIResponse(
                data=cached_data,
                timestamp=datetime.utcnow()
            )

        # Mock intersection data
        data = [
            {
                "intersection_type": "traffic light",
                "accident_count": 156,
                "severity_distribution": {"minor": 89, "moderate": 45, "severe": 22},
                "peak_hours": ["08:00", "17:00", "18:00"],
                "avg_casualties": 0.3
            },
            {
                "intersection_type": "stop sign",
                "accident_count": 89,
                "severity_distribution": {"minor": 67, "moderate": 18, "severe": 4},
                "peak_hours": ["07:30", "16:30"],
                "avg_casualties": 0.1
            },
            {
                "intersection_type": "roundabout",
                "accident_count": 23,
                "severity_distribution": {"minor": 8, "moderate": 10, "severe": 5},
                "peak_hours": ["12:00", "13:00"],
                "avg_casualties": 0.8
            }
        ]

        # Cache for 2 hours
        await cache_service.set(cache_key, data, expire=7200)
        
        return APIResponse(
            data=data,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching intersection patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk-assessment")
async def get_risk_assessment():
    """Get comprehensive risk assessment data"""
    try:
        cache_key = "analytics:risk_assessment"
        cached_data = await cache_service.get(cache_key)
        
        if cached_data:
            return APIResponse(
                data=cached_data,
                timestamp=datetime.utcnow()
            )

        # Mock risk assessment data
        data = {
            "risk_factors": [
                {
                    "factor": "Weather",
                    "risk_scores": {
                        "clear": 85,
                        "rain": 65,
                        "fog": 45,
                        "snow": 25
                    }
                },
                {
                    "factor": "Time of Day",
                    "risk_scores": {
                        "morning": 70,
                        "afternoon": 85,
                        "evening": 75,
                        "night": 35
                    }
                },
                {
                    "factor": "Traffic Density",
                    "risk_scores": {
                        "light": 90,
                        "moderate": 70,
                        "heavy": 45,
                        "congested": 25
                    }
                }
            ],
            "high_risk_scenarios": [
                {
                    "scenario": "Rush hour + Rain + Urban intersection",
                    "risk_score": 15,
                    "frequency": 23,
                    "avg_severity": 3.2
                },
                {
                    "scenario": "Highway merge + Heavy traffic",
                    "risk_score": 18,
                    "frequency": 15,
                    "avg_severity": 3.8
                }
            ],
            "recommendations": [
                "Increase safety protocols during fog conditions",
                "Enhanced monitoring at highway merge points",
                "Reduced speed limits during rush hour rain"
            ]
        }

        # Cache for 4 hours
        await cache_service.set(cache_key, data, expire=14400)
        
        return APIResponse(
            data=data,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching risk assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance/companies")
async def get_company_performance():
    """Get detailed company performance metrics"""
    try:
        cache_key = "analytics:performance:companies"
        cached_data = await cache_service.get(cache_key)
        
        if cached_data:
            return APIResponse(
                data=cached_data,
                timestamp=datetime.utcnow()
            )

        # Mock company performance data
        data = [
            {
                "company": "Waymo",
                "metrics": {
                    "safety_score": 92,
                    "accidents_per_million_miles": 0.41,
                    "improvement_rate": 8.2,
                    "deployment_cities": 12,
                    "testing_miles": 2500000
                },
                "trends": {
                    "monthly_accidents": [45, 42, 38, 35, 31, 29],
                    "severity_trend": "improving"
                }
            },
            {
                "company": "Cruise",
                "metrics": {
                    "safety_score": 87,
                    "accidents_per_million_miles": 0.43,
                    "improvement_rate": 15.1,
                    "deployment_cities": 8,
                    "testing_miles": 1800000
                },
                "trends": {
                    "monthly_accidents": [52, 48, 44, 41, 38, 35],
                    "severity_trend": "stable"
                }
            }
        ]

        # Cache for 1 hour
        await cache_service.set(cache_key, data, expire=3600)
        
        return APIResponse(
            data=data,
            timestamp=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching company performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
