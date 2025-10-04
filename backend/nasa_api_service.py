"""
NASA API Integration Service
Comprehensive integration with NASA's various APIs for real-time space data
"""
import asyncio
import aiohttp
import requests
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from astropy.time import Time
from astropy.coordinates import EarthLocation, AltAz, get_sun, SkyCoord
from astropy import units as u

logger = logging.getLogger(__name__)

class NASAAPIService:
    """Comprehensive NASA API integration service"""
    
    def __init__(self, api_key: str = 'DEMO_KEY'):
        self.api_key = api_key
        self.base_urls = {
            'neo': 'https://api.nasa.gov/neo/rest/v1',
            'apod': 'https://api.nasa.gov/planetary/apod',
            'mars_weather': 'https://api.nasa.gov/insight_weather',
            'earth_imagery': 'https://api.nasa.gov/planetary/earth/imagery',
            'earth_assets': 'https://api.nasa.gov/planetary/earth/assets',
            'epic': 'https://api.nasa.gov/EPIC/api/natural',
            'exoplanet': 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync',
            'horizons': 'https://ssd-api.jpl.nasa.gov/horizons_api.py',
            'sbdb': 'https://ssd-api.jpl.nasa.gov/sbdb_api.py',
            'cad': 'https://ssd-api.jpl.nasa.gov/cad_api.py'
        }
        self.session = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def get_neo_feed(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Get Near Earth Objects feed data"""
        try:
            if not start_date:
                start_date = datetime.now().strftime('%Y-%m-%d')
            if not end_date:
                end_date = start_date
                
            url = f"{self.base_urls['neo']}/feed"
            params = {
                'start_date': start_date,
                'end_date': end_date,
                'api_key': self.api_key
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._process_neo_data(data)
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    return self._process_neo_data(data)
                    
        except Exception as e:
            logger.error(f"Error fetching NEO feed: {e}")
            return {}
    
    async def get_neo_lookup(self, asteroid_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific asteroid"""
        try:
            url = f"{self.base_urls['neo']}/neo/{asteroid_id}"
            params = {'api_key': self.api_key}
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching NEO lookup for {asteroid_id}: {e}")
            return {}
    
    async def get_neo_browse(self, page: int = 0, size: int = 20) -> Dict[str, Any]:
        """Browse the overall asteroid dataset"""
        try:
            url = f"{self.base_urls['neo']}/neo/browse"
            params = {
                'page': page,
                'size': size,
                'api_key': self.api_key
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error browsing NEO data: {e}")
            return {}
    
    async def get_jpl_horizons_data(self, target_body: str, observer: str = '500@399') -> Dict[str, Any]:
        """Get JPL Horizons ephemeris data"""
        try:
            url = self.base_urls['horizons']
            
            # Calculate time range (next 7 days)
            start_time = datetime.now(timezone.utc)
            end_time = start_time + timedelta(days=7)
            
            params = {
                'format': 'json',
                'COMMAND': target_body,
                'OBJ_DATA': 'YES',
                'MAKE_EPHEM': 'YES',
                'EPHEM_TYPE': 'OBSERVER',
                'CENTER': observer,
                'START_TIME': start_time.strftime('%Y-%m-%d'),
                'STOP_TIME': end_time.strftime('%Y-%m-%d'),
                'STEP_SIZE': '1h',
                'QUANTITIES': '1,9,20,23,24'  # RA/DEC, range, visual magnitude, etc.
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=60)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching JPL Horizons data for {target_body}: {e}")
            return {}
    
    async def get_small_body_database(self, designation: str) -> Dict[str, Any]:
        """Get small body database information"""
        try:
            url = self.base_urls['sbdb']
            params = {
                'sstr': designation,
                'full-prec': 'true'
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching SBDB data for {designation}: {e}")
            return {}
    
    async def get_close_approach_data(self, date_min: str = None, date_max: str = None, 
                                    dist_max: str = '0.2') -> Dict[str, Any]:
        """Get close approach data for asteroids and comets"""
        try:
            if not date_min:
                date_min = datetime.now().strftime('%Y-%m-%d')
            if not date_max:
                date_max = (datetime.now() + timedelta(days=60)).strftime('%Y-%m-%d')
                
            url = self.base_urls['cad']
            params = {
                'date-min': date_min,
                'date-max': date_max,
                'dist-max': dist_max,  # AU
                'sort': 'date'
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching close approach data: {e}")
            return {}
    
    async def get_mars_weather(self) -> Dict[str, Any]:
        """Get Mars weather data from InSight lander"""
        try:
            url = self.base_urls['mars_weather']
            params = {
                'api_key': self.api_key,
                'feedtype': 'json',
                'ver': '1.0'
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching Mars weather data: {e}")
            return {}
    
    async def get_earth_imagery(self, lat: float, lon: float, date: str = None, 
                              dim: float = 0.15) -> Dict[str, Any]:
        """Get Earth imagery from Landsat"""
        try:
            if not date:
                date = datetime.now().strftime('%Y-%m-%d')
                
            url = self.base_urls['earth_imagery']
            params = {
                'lat': lat,
                'lon': lon,
                'date': date,
                'dim': dim,
                'api_key': self.api_key
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return {'image_url': str(response.url), 'status': 'success'}
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return {'image_url': response.url, 'status': 'success'}
                    
        except Exception as e:
            logger.error(f"Error fetching Earth imagery: {e}")
            return {}
    
    async def get_epic_images(self, date: str = None) -> Dict[str, Any]:
        """Get EPIC (Earth Polychromatic Imaging Camera) images"""
        try:
            if not date:
                date = datetime.now().strftime('%Y-%m-%d')
                
            url = f"{self.base_urls['epic']}/date/{date}"
            params = {'api_key': self.api_key}
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching EPIC images: {e}")
            return {}
    
    async def get_exoplanet_data(self, limit: int = 100) -> Dict[str, Any]:
        """Get exoplanet data from NASA Exoplanet Archive"""
        try:
            url = self.base_urls['exoplanet']
            query = f"""
            SELECT TOP {limit} 
            pl_name, hostname, discoverymethod, disc_year, 
            pl_orbper, pl_rade, pl_masse, pl_eqt, 
            st_dist, st_teff, st_rad, st_mass
            FROM ps 
            WHERE default_flag = 1 
            ORDER BY disc_year DESC
            """
            
            params = {
                'query': query,
                'format': 'json'
            }
            
            if self.session:
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    return response.json()
                    
        except Exception as e:
            logger.error(f"Error fetching exoplanet data: {e}")
            return {}
    
    def _process_neo_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Process and enhance NEO data"""
        try:
            processed_data = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'total_count': raw_data.get('element_count', 0),
                'objects': [],
                'statistics': {
                    'potentially_hazardous_count': 0,
                    'largest_diameter': 0,
                    'closest_approach': float('inf'),
                    'fastest_velocity': 0
                }
            }
            
            for date_key, objects in raw_data.get('near_earth_objects', {}).items():
                for obj in objects:
                    # Extract basic information
                    neo_obj = {
                        'id': obj['id'],
                        'name': obj['name'],
                        'nasa_jpl_url': obj['nasa_jpl_url'],
                        'absolute_magnitude': obj['absolute_magnitude_h'],
                        'potentially_hazardous': obj['is_potentially_hazardous_asteroid'],
                        'sentry_object': obj.get('is_sentry_object', False)
                    }
                    
                    # Diameter information
                    diameter = obj['estimated_diameter']['kilometers']
                    neo_obj['diameter'] = {
                        'min_km': diameter['estimated_diameter_min'],
                        'max_km': diameter['estimated_diameter_max'],
                        'average_km': (diameter['estimated_diameter_min'] + diameter['estimated_diameter_max']) / 2
                    }
                    
                    # Close approach data
                    if obj['close_approach_data']:
                        approach = obj['close_approach_data'][0]
                        neo_obj['close_approach'] = {
                            'date': approach['close_approach_date'],
                            'date_full': approach['close_approach_date_full'],
                            'epoch': approach['epoch_date_close_approach'],
                            'relative_velocity_kmh': float(approach['relative_velocity']['kilometers_per_hour']),
                            'relative_velocity_kms': float(approach['relative_velocity']['kilometers_per_second']),
                            'miss_distance_km': float(approach['miss_distance']['kilometers']),
                            'miss_distance_au': float(approach['miss_distance']['astronomical']),
                            'miss_distance_lunar': float(approach['miss_distance']['lunar']),
                            'orbiting_body': approach['orbiting_body']
                        }
                        
                        # Calculate additional parameters
                        neo_obj['risk_assessment'] = self._assess_impact_risk(neo_obj)
                        neo_obj['orbital_characteristics'] = self._calculate_orbital_characteristics(neo_obj)
                    
                    processed_data['objects'].append(neo_obj)
                    
                    # Update statistics
                    stats = processed_data['statistics']
                    if neo_obj['potentially_hazardous']:
                        stats['potentially_hazardous_count'] += 1
                    
                    max_diameter = neo_obj['diameter']['max_km']
                    if max_diameter > stats['largest_diameter']:
                        stats['largest_diameter'] = max_diameter
                    
                    if 'close_approach' in neo_obj:
                        miss_distance = neo_obj['close_approach']['miss_distance_km']
                        if miss_distance < stats['closest_approach']:
                            stats['closest_approach'] = miss_distance
                        
                        velocity = neo_obj['close_approach']['relative_velocity_kmh']
                        if velocity > stats['fastest_velocity']:
                            stats['fastest_velocity'] = velocity
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing NEO data: {e}")
            return {}
    
    def _assess_impact_risk(self, neo_obj: Dict) -> Dict[str, Any]:
        """Assess impact risk for a NEO"""
        try:
            risk_factors = {
                'size_risk': 'low',
                'proximity_risk': 'low',
                'velocity_risk': 'low',
                'overall_risk': 'low',
                'impact_probability': 0.0,
                'potential_damage': 'minimal'
            }
            
            # Size risk assessment
            avg_diameter = neo_obj['diameter']['average_km']
            if avg_diameter > 1.0:
                risk_factors['size_risk'] = 'extreme'
            elif avg_diameter > 0.5:
                risk_factors['size_risk'] = 'high'
            elif avg_diameter > 0.1:
                risk_factors['size_risk'] = 'medium'
            
            # Proximity risk assessment
            if 'close_approach' in neo_obj:
                miss_distance_lunar = neo_obj['close_approach']['miss_distance_lunar']
                if miss_distance_lunar < 1:
                    risk_factors['proximity_risk'] = 'extreme'
                elif miss_distance_lunar < 5:
                    risk_factors['proximity_risk'] = 'high'
                elif miss_distance_lunar < 20:
                    risk_factors['proximity_risk'] = 'medium'
                
                # Velocity risk assessment
                velocity_kms = neo_obj['close_approach']['relative_velocity_kms']
                if velocity_kms > 30:
                    risk_factors['velocity_risk'] = 'high'
                elif velocity_kms > 20:
                    risk_factors['velocity_risk'] = 'medium'
            
            # Overall risk calculation
            risk_scores = {
                'low': 1, 'medium': 2, 'high': 3, 'extreme': 4
            }
            
            total_score = (
                risk_scores[risk_factors['size_risk']] +
                risk_scores[risk_factors['proximity_risk']] +
                risk_scores[risk_factors['velocity_risk']]
            )
            
            if total_score >= 10:
                risk_factors['overall_risk'] = 'extreme'
                risk_factors['potential_damage'] = 'global catastrophe'
            elif total_score >= 8:
                risk_factors['overall_risk'] = 'high'
                risk_factors['potential_damage'] = 'regional destruction'
            elif total_score >= 6:
                risk_factors['overall_risk'] = 'medium'
                risk_factors['potential_damage'] = 'local damage'
            
            return risk_factors
            
        except Exception as e:
            logger.error(f"Error assessing impact risk: {e}")
            return {}
    
    def _calculate_orbital_characteristics(self, neo_obj: Dict) -> Dict[str, Any]:
        """Calculate orbital characteristics"""
        try:
            orbital_data = {
                'orbital_class': 'unknown',
                'perihelion_distance': 0,
                'aphelion_distance': 0,
                'orbital_period': 0,
                'eccentricity': 0,
                'inclination': 0
            }
            
            # This would require additional orbital element data
            # For now, return basic structure
            return orbital_data
            
        except Exception as e:
            logger.error(f"Error calculating orbital characteristics: {e}")
            return {}

# Utility functions for space calculations
class SpaceCalculations:
    """Utility class for space-related calculations"""
    
    @staticmethod
    def calculate_impact_energy(diameter_km: float, velocity_kms: float, density: float = 2.6) -> float:
        """Calculate impact energy in joules"""
        try:
            # Convert diameter to radius in meters
            radius_m = (diameter_km * 1000) / 2
            
            # Calculate volume (sphere)
            volume_m3 = (4/3) * np.pi * (radius_m ** 3)
            
            # Calculate mass (density in g/cm³ converted to kg/m³)
            mass_kg = volume_m3 * (density * 1000)
            
            # Calculate kinetic energy (0.5 * m * v²)
            velocity_ms = velocity_kms * 1000
            energy_joules = 0.5 * mass_kg * (velocity_ms ** 2)
            
            return energy_joules
            
        except Exception as e:
            logger.error(f"Error calculating impact energy: {e}")
            return 0
    
    @staticmethod
    def calculate_crater_diameter(energy_joules: float) -> float:
        """Calculate estimated crater diameter in km"""
        try:
            # Empirical formula for crater diameter
            # D = 1.8 * (E/10^12)^0.25 where E is in joules, D in km
            crater_diameter_km = 1.8 * ((energy_joules / 1e12) ** 0.25)
            return crater_diameter_km
            
        except Exception as e:
            logger.error(f"Error calculating crater diameter: {e}")
            return 0
    
    @staticmethod
    def calculate_orbital_velocity(semi_major_axis_au: float) -> float:
        """Calculate orbital velocity in km/s"""
        try:
            # Using Kepler's third law and gravitational parameter of Sun
            GM_sun = 1.327e11  # km³/s²
            a_km = semi_major_axis_au * 1.496e8  # Convert AU to km
            
            velocity_kms = np.sqrt(GM_sun / a_km)
            return velocity_kms
            
        except Exception as e:
            logger.error(f"Error calculating orbital velocity: {e}")
            return 0