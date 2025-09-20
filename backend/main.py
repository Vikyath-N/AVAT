"""
FastAPI Backend for AV Accident Analysis Platform
High-performance API with real-time capabilities
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import sqlite3
import pandas as pd
from contextlib import asynccontextmanager

# Local imports
from api.accidents import router as accidents_router
from api.analytics import router as analytics_router
from api.websocket import WebSocketManager
from models.schemas import *
from services.data_service import DataService
from services.cache_service import CacheService
from utils.database import get_db_connection
from utils.logger import get_logger

logger = get_logger(__name__)

# WebSocket manager for real-time updates
websocket_manager = WebSocketManager()

# Services
data_service = DataService()
cache_service = CacheService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting AV Accident Analysis API")
    
    # Initialize services
    await cache_service.initialize()
    await data_service.initialize()
    
    # Start background tasks
    asyncio.create_task(background_data_updater())
    asyncio.create_task(websocket_heartbeat())
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down AV Accident Analysis API")
    await cache_service.cleanup()

# Create FastAPI app
app = FastAPI(
    title="AV Accident Analysis API",
    description="Tesla-inspired autonomous vehicle accident analysis platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(accidents_router, prefix="/api/v1/accidents", tags=["accidents"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])

# Static files (for serving React build in production)
# app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "AV Accident Analysis Platform API",
        "version": "2.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/api/docs",
        "websocket": "/ws"
    }

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM accidents")
            accident_count = cursor.fetchone()[0]
        
        # Test cache connection
        cache_status = await cache_service.health_check()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "status": "connected",
                "accident_count": accident_count
            },
            "cache": {
                "status": cache_status
            },
            "websocket": {
                "active_connections": len(websocket_manager.active_connections)
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/api/v1/stats")
async def get_system_stats():
    """Get system statistics"""
    try:
        stats = await data_service.get_system_stats()
        return {
            "data": stats,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching system stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "subscribe":
                # Subscribe to specific data streams
                filters = message.get("filters", {})
                await websocket_manager.subscribe(websocket, filters)
            elif message.get("type") == "ping":
                # Respond to ping with pong
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)

@app.get("/api/v1/filters/options")
async def get_filter_options():
    """Get available filter options for frontend"""
    try:
        options = await data_service.get_filter_options()
        return {
            "data": options,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching filter options: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/export")
async def export_data(request: ExportRequest):
    """Export data in various formats"""
    try:
        export_data = await data_service.export_data(
            format=request.format,
            filters=request.filters,
            date_range=request.date_range
        )
        
        return {
            "data": export_data,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def background_data_updater():
    """Background task to update data periodically"""
    while True:
        try:
            logger.info("🔄 Running background data update")
            
            # Check for new accidents
            new_accidents = await data_service.check_for_updates()
            
            if new_accidents:
                logger.info(f"📊 Found {len(new_accidents)} new accidents")
                
                # Update cache
                await cache_service.invalidate_pattern("accidents:*")
                await cache_service.invalidate_pattern("analytics:*")
                
                # Notify WebSocket clients
                await websocket_manager.broadcast({
                    "type": "accident_update",
                    "payload": {
                        "new_accidents": [acc.dict() for acc in new_accidents],
                        "count": len(new_accidents)
                    },
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Update analytics cache
            await data_service.update_analytics_cache()
            
        except Exception as e:
            logger.error(f"Background update error: {e}")
        
        # Wait 15 minutes before next update
        await asyncio.sleep(900)

async def websocket_heartbeat():
    """Send periodic heartbeat to WebSocket clients"""
    while True:
        try:
            if websocket_manager.active_connections:
                await websocket_manager.broadcast({
                    "type": "heartbeat",
                    "payload": {
                        "server_time": datetime.utcnow().isoformat(),
                        "active_connections": len(websocket_manager.active_connections)
                    },
                    "timestamp": datetime.utcnow().isoformat()
                })
        except Exception as e:
            logger.error(f"Heartbeat error: {e}")
        
        # Send heartbeat every 30 seconds
        await asyncio.sleep(30)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
