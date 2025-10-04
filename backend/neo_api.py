"""
Enhanced NASA NEO API Integration with Async/Await, Caching, and Environment Variables
"""
import os
import asyncio
import aiohttp
import redis
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from functools import wraps
import backoff
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NASANEOClient:
    """Enhanced NASA NEO API client with caching and retry logic"""
    
    def __init__(self):
        self.base_url = os.getenv('NASA_NEO_BASE_URL', 'https://api.nasa.gov/neo/rest/v1')
        self.api_key = os.getenv('NASA_API_KEY', 'DEMO_KEY')
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        
        # Initialize Redis connection pool
        self.redis_pool = redis.ConnectionPool.from_url(self.redis_url)
        self.session = None
        
        # Rate limiting settings
        self.rate_limit = int(os.getenv('NASA_RATE_LIMIT', '1000'))  # requests per hour
        self.requests_made = 0
        self.reset_time = datetime.now()
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def get_redis_connection(self):
        """Get Redis connection from pool"""
        return redis.Redis(connection_pool=self.redis_pool)
    
    def cache_key(self, endpoint: str, params: Dict) -> str:
        """Generate cache key from endpoint and parameters"""
        param_str = json.dumps(params, sort_keys=True)
        return f"nasa:neo:{endpoint}:{param_str}"
    
    async def check_rate_limit(self):
        """Check and enforce rate limits"""
        now = datetime.now()
        if now >= self.reset_time:
            self.requests_made = 0
            self.reset_time = now + timedelta(hours=1)
        
        if self.requests_made >= self.rate_limit:
            wait_time = (self.reset_time - now).total_seconds()
            logger.warning(f"Rate limit exceeded. Waiting {wait_time:.2f} seconds")
            await asyncio.sleep(wait_time)
            self.requests_made = 0
            self.reset_time = datetime.now() + timedelta(hours=1)
    
    @backoff.on_exception(backoff.expo, 
                         (aiohttp.ClientError, asyncio.TimeoutError),
                         max_tries=3,
                         max_time=30)
    async def make_request(self, endpoint: str, params: Dict) -> Dict:
        """Make HTTP request with retry logic and caching"""
        await self.check_rate_limit()
        
        cache_key = self.cache_key(endpoint, params)
        redis_conn = self.get_redis_connection()
        
        # Check cache first
        cached_data = redis_conn.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit for {cache_key}")
            return json.loads(cached_data)
        
        # Build URL
        url = f"{self.base_url}/{endpoint}"
        params['api_key'] = self.api_key
        
        try:
            async with self.session.get(url, params=params, timeout=30) as response:
                self.requests_made += 1
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Cache successful response (5 minutes TTL)
                    redis_conn.setex(cache_key, 300, json.dumps(data))
                    logger.info(f"API request successful: {url}")
                    return data
                
                elif response.status == 429:
                    logger.warning("Rate limit exceeded, backing off")
                    raise aiohttp.ClientResponseError(
                        request_info=response.request_info,
                        history=response.history,
                        status=429,
                        message="Rate limit exceeded"
                    )
                
                else:
                    response.raise_for_status()
                    
        except aiohttp.ClientError as e:
            logger.error(f"API request failed: {e}")
            raise
    
    async def get_neo_feed(self, start_date: str, end_date: str) -> Dict:
        """Get NEO feed for date range"""
        params = {
            'start_date': start_date,
            'end_date': end_date
        }
        return await self.make_request('feed', params)
    
    async def get_neo_lookup(self, asteroid_id: str) -> Dict:
        """Get detailed information about specific NEO"""
        return await self.make_request(f'neo/{asteroid_id}', {})
    
    async def get_neo_browse(self, page: int = 0, size: int = 20) -> Dict:
        """Browse all NEOs with pagination"""
        params = {
            'page': page,
            'size': size
        }
        return await self.make_request('neo/browse', params)
    
    async def get_neo_stats(self) -> Dict:
        """Get NEO statistics"""
        return await self.make_request('stats', {})

# Utility functions for common operations
async def get_potentially_hazardous_asteroids() -> List[Dict]:
    """Get all potentially hazardous asteroids"""
    async with NASANEOClient() as client:
        try:
            data = await client.get_neo_browse(size=1000)
            pha_asteroids = [
                neo for neo in data.get('near_earth_objects', [])
                if neo.get('is_potentially_hazardous_asteroid', False)
            ]
            return pha_asteroids
        except Exception as e:
            logger.error(f"Error fetching PHAs: {e}")
            return []

async def get_asteroids_by_size(min_diameter: float, max_diameter: float) -> List[Dict]:
    """Get asteroids filtered by diameter range"""
    async with NASANEOClient() as client:
        try:
            data = await client.get_neo_browse(size=1000)
            filtered_asteroids = [
                neo for neo in data.get('near_earth_objects', [])
                if min_diameter <= neo.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_max', 0) <= max_diameter
            ]
            return filtered_asteroids
        except Exception as e:
            logger.error(f"Error filtering asteroids by size: {e}")
            return []

# Health check and monitoring
def check_api_health() -> Dict:
    """Check API health status"""
    redis_conn = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
    
    return {
        'redis_connected': redis_conn.ping(),
        'api_key_configured': bool(os.getenv('NASA_API_KEY')),
        'rate_limit_remaining': 1000,  # This would need actual implementation
        'last_successful_call': datetime.now().isoformat()
    }

if __name__ == "__main__":
    # Example usage
    async def main():
        async with NASANEOClient() as client:
            # Get today's NEO feed
            today = datetime.now().strftime('%Y-%m-%d')
            feed = await client.get_neo_feed(today, today)
            print(f"Found {feed.get('element_count', 0)} NEOs today")
            
            # Get potentially hazardous asteroids
            phas = await get_potentially_hazardous_asteroids()
            print(f"Found {len(phas)} potentially hazardous asteroids")
    
    asyncio.run(main())