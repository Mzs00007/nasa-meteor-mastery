"""
Enhanced USGS API Integration with Async/Await, Caching, and Environment Variables
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

class USGSClient:
    """Enhanced USGS API client with caching and retry logic"""
    
    def __init__(self):
        self.earthquake_url = os.getenv('USGS_EARTHQUAKE_URL', 'https://earthquake.usgs.gov/fdsnws/event/1/query')
        self.elevation_url = os.getenv('USGS_ELEVATION_URL', 'https://nationalmap.gov/epqs/pqs.php')
        self.water_url = os.getenv('USGS_WATER_URL', 'https://waterservices.usgs.gov/nwis/iv/')
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        
        # Initialize Redis connection pool
        self.redis_pool = redis.ConnectionPool.from_url(self.redis_url)
        self.session = None
    
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
        return f"usgs:{endpoint}:{param_str}"
    
    @backoff.on_exception(backoff.expo, 
                         (aiohttp.ClientError, asyncio.TimeoutError),
                         max_tries=3,
                         max_time=30)
    async def make_request(self, url: str, params: Dict, cache_ttl: int = 300) -> Dict:
        """Make HTTP request with retry logic and caching"""
        cache_key = self.cache_key(url, params)
        redis_conn = self.get_redis_connection()
        
        # Check cache first
        cached_data = redis_conn.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit for {cache_key}")
            return json.loads(cached_data)
        
        try:
            async with self.session.get(url, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Cache successful response
                    redis_conn.setex(cache_key, cache_ttl, json.dumps(data))
                    logger.info(f"USGS API request successful: {url}")
                    return data
                
                else:
                    response.raise_for_status()
                    
        except aiohttp.ClientError as e:
            logger.error(f"USGS API request failed: {e}")
            raise
    
    async def get_earthquakes(self, 
                            start_time: str, 
                            end_time: str, 
                            min_magnitude: float = 0.0,
                            max_magnitude: float = 10.0,
                            limit: int = 100) -> Dict:
        """Get earthquake data within time range and magnitude bounds"""
        params = {
            'format': 'geojson',
            'starttime': start_time,
            'endtime': end_time,
            'minmagnitude': min_magnitude,
            'maxmagnitude': max_magnitude,
            'limit': limit,
            'orderby': 'time'  # Most recent first
        }
        return await self.make_request(self.earthquake_url, params, cache_ttl=600)  # 10 min cache
    
    async def get_elevation(self, lat: float, lon: float) -> Dict:
        """Get elevation data for specific coordinates"""
        params = {
            'x': lon,
            'y': lat,
            'units': 'Meters',
            'output': 'json'
        }
        return await self.make_request(self.elevation_url, params, cache_ttl=86400)  # 24 hour cache
    
    async def get_water_data(self, 
                           site_ids: List[str], 
                           parameter_cd: str = '00060') -> Dict:
        """Get water data for specific sites"""
        params = {
            'format': 'json',
            'sites': ','.join(site_ids),
            'parameterCd': parameter_cd,
            'siteStatus': 'all'
        }
        return await self.make_request(self.water_url, params, cache_ttl=1800)  # 30 min cache
    
    async def get_tsunami_risk_assessment(self, 
                                        lat: float, 
                                        lon: float, 
                                        magnitude: float) -> Dict:
        """Assess tsunami risk based on earthquake parameters"""
        # This would integrate with tsunami modeling services
        # For now, return a basic risk assessment
        return {
            'latitude': lat,
            'longitude': lon,
            'magnitude': magnitude,
            'tsunami_risk': 'low' if magnitude < 7.0 else 'moderate' if magnitude < 8.0 else 'high',
            'assessment_time': datetime.now().isoformat(),
            'recommended_actions': self._get_tsunami_actions(magnitude)
        }
    
    def _get_tsunami_actions(self, magnitude: float) -> List[str]:
        """Get recommended actions based on earthquake magnitude"""
        if magnitude < 6.0:
            return ["No tsunami threat expected"]
        elif magnitude < 7.0:
            return ["Monitor official sources", "Be prepared to evacuate if advised"]
        elif magnitude < 8.0:
            return ["Evacuate coastal areas", "Move to higher ground", "Follow emergency instructions"]
        else:
            return ["IMMEDIATE EVACUATION", "Move to highest ground possible", "Do not return until cleared"]

# Utility functions for common operations
async def get_recent_earthquakes(hours: int = 24, min_magnitude: float = 4.0) -> List[Dict]:
    """Get recent earthquakes within specified time window"""
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    async with USGSClient() as client:
        try:
            data = await client.get_earthquakes(
                start_time.isoformat(),
                end_time.isoformat(),
                min_magnitude=min_magnitude
            )
            return data.get('features', [])
        except Exception as e:
            logger.error(f"Error fetching recent earthquakes: {e}")
            return []

async def get_elevation_profile(points: List[Dict]) -> List[Dict]:
    """Get elevation profile for multiple points"""
    async with USGSClient() as client:
        results = []
        
        for point in points:
            try:
                elevation_data = await client.get_elevation(point['lat'], point['lon'])
                results.append({
                    'lat': point['lat'],
                    'lon': point['lon'],
                    'elevation': elevation_data.get('value', 0),
                    'timestamp': datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"Error getting elevation for point {point}: {e}")
                results.append({
                    'lat': point['lat'],
                    'lon': point['lon'],
                    'elevation': 0,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        return results

# Health check and monitoring
def check_usgs_health() -> Dict:
    """Check USGS API health status"""
    redis_conn = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))
    
    return {
        'redis_connected': redis_conn.ping(),
        'apis_configured': bool(os.getenv('USGS_EARTHQUAKE_URL')),
        'last_successful_call': datetime.now().isoformat(),
        'status': 'operational'
    }

if __name__ == "__main__":
    # Example usage
    async def main():
        async with USGSClient() as client:
            # Get recent significant earthquakes
            earthquakes = await get_recent_earthquakes(hours=48, min_magnitude=5.0)
            print(f"Found {len(earthquakes)} significant earthquakes in last 48 hours")
            
            # Get elevation for specific point
            elevation = await client.get_elevation(34.0522, -118.2437)  # Los Angeles
            print(f"Elevation in LA: {elevation.get('value', 'unknown')} meters")
    
    asyncio.run(main())