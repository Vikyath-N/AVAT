"""
Cache service using in-memory storage (Redis alternative for development)
"""

import asyncio
import json
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from utils.logger import get_logger

logger = get_logger(__name__)

class CacheService:
    """In-memory cache service for development"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._initialized = False
    
    async def initialize(self):
        """Initialize cache service"""
        if not self._initialized:
            self._initialized = True
            logger.info("Cache service initialized (in-memory)")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key in self._cache:
            item = self._cache[key]
            if item['expires'] is None or datetime.utcnow() < item['expires']:
                return item['value']
            else:
                # Expired, remove from cache
                del self._cache[key]
        return None
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in cache with optional expiration"""
        expires = None
        if expire:
            expires = datetime.utcnow() + timedelta(seconds=expire)
        
        self._cache[key] = {
            'value': value,
            'expires': expires,
            'created': datetime.utcnow()
        }
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        # Simple pattern matching (replace * with anything)
        import re
        regex_pattern = pattern.replace('*', '.*')
        regex = re.compile(regex_pattern)
        
        keys_to_delete = []
        for key in self._cache.keys():
            if regex.match(key):
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self._cache[key]
        
        return len(keys_to_delete)
    
    async def health_check(self) -> str:
        """Check cache health"""
        return "connected" if self._initialized else "disconnected"
    
    async def cleanup(self):
        """Cleanup cache service"""
        self._cache.clear()
        logger.info("Cache service cleaned up")
