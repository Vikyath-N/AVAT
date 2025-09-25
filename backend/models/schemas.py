"""
Pydantic models for API request/response schemas
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class CityType(str, Enum):
    URBAN = "urban"
    SUBURBAN = "suburban" 
    RURAL = "rural"

class DamageSeverity(str, Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    TOTAL_LOSS = "total loss"

class AVMode(str, Enum):
    AUTONOMOUS = "autonomous"
    MANUAL = "manual"
    DISENGAGED = "disengaged"

class AccidentRecord(BaseModel):
    """Enhanced accident record model"""
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
    city_type: Optional[CityType] = None
    intersection_type: Optional[str] = None
    damage_severity: Optional[DamageSeverity] = None
    weather_conditions: Optional[str] = None
    time_of_day: Optional[str] = None
    casualties: Optional[int] = 0
    av_mode: Optional[AVMode] = None
    speed_limit: Optional[int] = None
    traffic_signals: Optional[str] = None
    road_type: Optional[str] = None
    damage_location: Optional[str] = None
    raw_text: Optional[str] = None
    report_url: Optional[str] = None
    # Extended metadata
    source: Optional[str] = None
    source_report_id: Optional[int] = None
    pdf_url: Optional[str] = None
    pdf_local_path: Optional[str] = None
    damage_diagram_path: Optional[str] = None
    damage_quadrants: Optional[str] = None  # JSON string {front_left, front_right, rear_left, rear_right}
    form_sections: Optional[str] = None     # JSON string for Sections 1-6
    created_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class AccidentFilters(BaseModel):
    """Filters for accident queries"""
    companies: Optional[List[str]] = []
    vehicle_makes: Optional[List[str]] = []
    cities: Optional[List[str]] = []
    city_types: Optional[List[CityType]] = []
    intersection_types: Optional[List[str]] = []
    damage_severities: Optional[List[DamageSeverity]] = []
    av_modes: Optional[List[AVMode]] = []
    date_range: Optional[Dict[str, str]] = None
    casualties_min: Optional[int] = None
    casualties_max: Optional[int] = None
    has_coordinates: Optional[bool] = None

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1)
    limit: int = Field(50, ge=1, le=1000)
    sort_by: Optional[str] = "timestamp"
    sort_order: Literal["asc", "desc"] = "desc"

class AccidentQuery(BaseModel):
    """Complete accident query with filters and pagination"""
    filters: Optional[AccidentFilters] = AccidentFilters()
    pagination: Optional[PaginationParams] = PaginationParams()

class AccidentResponse(BaseModel):
    """Response model for accident queries"""
    data: List[AccidentRecord]
    pagination: Dict[str, Any]
    total_count: int
    status: str = "success"
    timestamp: datetime

class CompanyStats(BaseModel):
    """Statistics for a company"""
    company: str
    accident_count: int
    severity_breakdown: Dict[str, int]
    growth_rate: float
    market_share: float
    avg_casualties: float

class VehicleStats(BaseModel):
    """Statistics for vehicle make/model"""
    make: str
    model: Optional[str] = None
    accident_count: int
    accident_rate_per_mile: Optional[float] = None
    severity_score: float
    most_common_damage: str

class CityStats(BaseModel):
    """Statistics for cities"""
    city: str
    city_type: CityType
    accident_count: int
    accidents_per_capita: Optional[float] = None
    most_common_intersection_type: str
    avg_severity: float

class IntersectionStats(BaseModel):
    """Statistics for intersection types"""
    intersection_type: str
    accident_count: int
    severity_distribution: Dict[str, int]
    peak_hours: List[str]
    avg_casualties: float

class DamageStats(BaseModel):
    """Statistics for damage patterns"""
    damage_location: str
    frequency: int
    associated_severity: str
    common_scenarios: List[str]
    casualty_rate: float

class TemporalStats(BaseModel):
    """Temporal pattern statistics"""
    hour: Optional[int] = None
    day_of_week: Optional[str] = None
    month: Optional[str] = None
    accident_count: int
    avg_severity: float

class AnalyticsData(BaseModel):
    """Complete analytics data response"""
    company_stats: List[CompanyStats]
    vehicle_stats: List[VehicleStats]
    city_stats: List[CityStats]
    intersection_stats: List[IntersectionStats]
    damage_stats: List[DamageStats]
    temporal_stats: List[TemporalStats]
    summary: Dict[str, Any]

class MapCluster(BaseModel):
    """Map cluster data"""
    id: str
    coordinates: List[float]  # [lng, lat]
    accident_count: int
    severity_breakdown: Dict[str, int]
    accidents: List[AccidentRecord]

class HeatmapData(BaseModel):
    """Heatmap data point"""
    lat: float
    lng: float
    intensity: float
    accidents: List[AccidentRecord]

class MapData(BaseModel):
    """Complete map data response"""
    accidents: List[AccidentRecord]
    clusters: List[MapCluster]
    heatmap: List[HeatmapData]
    bounds: Dict[str, float]  # north, south, east, west

class FilterOptions(BaseModel):
    """Available filter options"""
    companies: List[str]
    vehicle_makes: List[str]
    cities: List[str]
    intersection_types: List[str]
    damage_severities: List[str]
    av_modes: List[str]
    date_range: Dict[str, str]

class ExportRequest(BaseModel):
    """Data export request"""
    format: Literal["csv", "json", "xlsx"] = "csv"
    filters: Optional[AccidentFilters] = AccidentFilters()
    date_range: Optional[Dict[str, str]] = None
    include_metadata: bool = True

class SystemStats(BaseModel):
    """System statistics"""
    total_accidents: int
    total_companies: int
    total_cities: int
    data_freshness: datetime
    update_frequency: str
    api_version: str
    database_size: str

class WebSocketMessage(BaseModel):
    """WebSocket message structure"""
    type: str
    payload: Dict[str, Any]
    timestamp: datetime

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    data: Any
    status: Literal["success", "error"] = "success"
    message: Optional[str] = None
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ErrorResponse(BaseModel):
    """Error response model"""
    error: Dict[str, Any]
    timestamp: datetime

# Validation helpers
@validator('location_lat', 'location_lng')
def validate_coordinates(cls, v):
    if v is not None:
        if not (-90 <= v <= 90) if 'lat' in cls.__name__ else not (-180 <= v <= 180):
            raise ValueError('Invalid coordinates')
    return v

@validator('casualties')
def validate_casualties(cls, v):
    if v is not None and v < 0:
        raise ValueError('Casualties cannot be negative')
    return v
