"""
Cache service with Redis support for production and in-memory fallback for development
"""

import asyncio
import json
import os
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from ..utils.logger import get_logger

logger = get_logger(__name__)

class CacheService:
    """Cache service with Redis support and in-memory fallback"""

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._initialized = False
        self._redis_available = False
        self._redis_client = None

    async def initialize(self):
        """Initialize cache service"""
        if not self._initialized:
            self._initialized = True

            # Try to initialize Redis if available
            redis_url = os.environ.get('REDIS_URL')
            if redis_url:
                try:
                    import aioredis
                    self._redis_client = aioredis.from_url(redis_url, decode_responses=True)
                    await self._redis_client.ping()
                    self._redis_available = True
                    logger.info("Cache service initialized (Redis)")
                except Exception as e:
                    logger.warning(f"Redis initialization failed, falling back to in-memory: {e}")
                    logger.info("Cache service initialized (in-memory fallback)")
            else:
                logger.info("Cache service initialized (in-memory)")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self._redis_available and self._redis_client:
            try:
                value = await self._redis_client.get(key)
                if value:
                    # Try to parse as JSON
                    try:
                        return json.loads(value)
                    except json.JSONDecodeError:
                        return value
                return None
            except Exception as e:
                logger.warning(f"Redis get failed, falling back to in-memory: {e}")
                # Fall back to in-memory
                return await self._get_in_memory(key)
        else:
            return await self._get_in_memory(key)

    async def _get_in_memory(self, key: str) -> Optional[Any]:
        """Get value from in-memory cache"""
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
        if self._redis_available and self._redis_client:
            try:
                # Serialize value to JSON
                serialized_value = json.dumps(value)
                if expire:
                    await self._redis_client.setex(key, expire, serialized_value)
                else:
                    await self._redis_client.set(key, serialized_value)
                return True
            except Exception as e:
                logger.warning(f"Redis set failed, falling back to in-memory: {e}")
                # Fall back to in-memory
                return await self._set_in_memory(key, value, expire)
        else:
            return await self._set_in_memory(key, value, expire)

    async def _set_in_memory(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in in-memory cache with optional expiration"""
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
        if self._redis_available and self._redis_client:
            try:
                result = await self._redis_client.delete(key)
                return result > 0
            except Exception as e:
                logger.warning(f"Redis delete failed, falling back to in-memory: {e}")
                # Fall back to in-memory
                return await self._delete_in_memory(key)
        else:
            return await self._delete_in_memory(key)

    async def _delete_in_memory(self, key: str) -> bool:
        """Delete key from in-memory cache"""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        if self._redis_available and self._redis_client:
            try:
                # Use Redis KEYS command with pattern
                keys = await self._redis_client.keys(pattern)
                if keys:
                    await self._redis_client.delete(*keys)
                    return len(keys)
                return 0
            except Exception as e:
                logger.warning(f"Redis pattern delete failed, falling back to in-memory: {e}")
                # Fall back to in-memory
                return await self._invalidate_pattern_in_memory(pattern)
        else:
            return await self._invalidate_pattern_in_memory(pattern)

    async def _invalidate_pattern_in_memory(self, pattern: str) -> int:
        """Invalidate all keys matching pattern in in-memory cache"""
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
        if not self._initialized:
            return "disconnected"

        if self._redis_available and self._redis_client:
            try:
                await self._redis_client.ping()
                return "connected (Redis)"
            except Exception:
                return "connected (in-memory fallback)"
        else:
            return "connected (in-memory)"
    
    async def cleanup(self):
        """Cleanup cache service"""
        self._cache.clear()

        if self._redis_available and self._redis_client:
            try:
                await self._redis_client.close()
                logger.info("Redis connection closed")
            except Exception as e:
                logger.warning(f"Error closing Redis connection: {e}")

        logger.info("Cache service cleaned up")
