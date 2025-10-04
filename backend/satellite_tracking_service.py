"""
Satellite Tracking Service
Real-time tracking of satellites, ISS, and space debris
"""
import asyncio
import aiohttp
import requests
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
from skyfield.api import load, EarthSatellite, Topos
from skyfield.timelib import Time
import ephem
import math

logger = logging.getLogger(__name__)

class SatelliteTrackingService:
    """Comprehensive satellite tracking and orbital mechanics service"""
    
    def __init__(self):
        self.tle_sources = {
            'iss': 'https://live.ariss.org/iss.txt',
            'active_satellites': 'https://celestrak.com/NORAD/elements/active.txt',
            'starlink': 'https://celestrak.com/NORAD/elements/starlink.txt',
            'weather': 'https://celestrak.com/NORAD/elements/weather.txt',
            'noaa': 'https://celestrak.com/NORAD/elements/noaa.txt',
            'goes': 'https://celestrak.com/NORAD/elements/goes.txt',
            'gps': 'https://celestrak.com/NORAD/elements/gps-ops.txt',
            'glonass': 'https://celestrak.com/NORAD/elements/glo-ops.txt',
            'galileo': 'https://celestrak.com/NORAD/elements/galileo.txt',
            'beidou': 'https://celestrak.com/NORAD/elements/beidou.txt',
            'debris': 'https://celestrak.com/NORAD/elements/debris.txt',
            'cosmos': 'https://celestrak.com/NORAD/elements/cosmos-2251-debris.txt'
        }
        self.session = None
        self.ts = load.timescale()
        self.satellites = {}
        self.last_update = {}
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def update_tle_data(self, source: str = 'all') -> Dict[str, Any]:
        """Update TLE (Two-Line Element) data for satellites"""
        try:
            results = {}
            sources_to_update = [source] if source != 'all' else list(self.tle_sources.keys())
            
            for src in sources_to_update:
                if src not in self.tle_sources:
                    continue
                    
                url = self.tle_sources[src]
                
                try:
                    if self.session:
                        async with self.session.get(url, timeout=30) as response:
                            if response.status == 200:
                                tle_data = await response.text()
                                satellites = self._parse_tle_data(tle_data)
                                self.satellites[src] = satellites
                                self.last_update[src] = datetime.now(timezone.utc)
                                results[src] = {
                                    'status': 'success',
                                    'count': len(satellites),
                                    'updated': self.last_update[src].isoformat()
                                }
                    else:
                        response = requests.get(url, timeout=30)
                        if response.status_code == 200:
                            tle_data = response.text
                            satellites = self._parse_tle_data(tle_data)
                            self.satellites[src] = satellites
                            self.last_update[src] = datetime.now(timezone.utc)
                            results[src] = {
                                'status': 'success',
                                'count': len(satellites),
                                'updated': self.last_update[src].isoformat()
                            }
                            
                except Exception as e:
                    logger.error(f"Error updating TLE data for {src}: {e}")
                    results[src] = {'status': 'error', 'message': str(e)}
            
            return results
            
        except Exception as e:
            logger.error(f"Error in update_tle_data: {e}")
            return {}
    
    async def get_iss_position(self) -> Dict[str, Any]:
        """Get real-time ISS position and tracking data"""
        try:
            # Update ISS TLE data if needed
            if 'iss' not in self.satellites or self._needs_update('iss'):
                await self.update_tle_data('iss')
            
            if 'iss' not in self.satellites or not self.satellites['iss']:
                return {'error': 'ISS TLE data not available'}
            
            # Get ISS satellite object
            iss_data = list(self.satellites['iss'].values())[0]
            satellite = EarthSatellite(iss_data['line1'], iss_data['line2'], iss_data['name'], self.ts)
            
            # Current time
            t = self.ts.now()
            
            # Calculate position
            geocentric = satellite.at(t)
            subpoint = geocentric.subpoint()
            
            # Calculate additional orbital parameters
            position_data = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'name': 'International Space Station',
                'position': {
                    'latitude': subpoint.latitude.degrees,
                    'longitude': subpoint.longitude.degrees,
                    'altitude_km': subpoint.elevation.km,
                    'velocity_kms': self._calculate_velocity(satellite, t)
                },
                'orbital_parameters': {
                    'period_minutes': self._calculate_orbital_period(satellite),
                    'inclination_degrees': iss_data.get('inclination', 0),
                    'eccentricity': iss_data.get('eccentricity', 0),
                    'mean_motion': iss_data.get('mean_motion', 0)
                },
                'visibility': await self._calculate_visibility(satellite, t),
                'next_passes': await self._calculate_next_passes(satellite)
            }
            
            return position_data
            
        except Exception as e:
            logger.error(f"Error getting ISS position: {e}")
            return {}
    
    async def get_satellite_constellation(self, constellation: str) -> Dict[str, Any]:
        """Get positions of satellite constellation (Starlink, GPS, etc.)"""
        try:
            if constellation not in self.satellites or self._needs_update(constellation):
                await self.update_tle_data(constellation)
            
            if constellation not in self.satellites:
                return {'error': f'{constellation} data not available'}
            
            t = self.ts.now()
            constellation_data = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'constellation': constellation,
                'total_satellites': len(self.satellites[constellation]),
                'satellites': []
            }
            
            # Process up to 50 satellites to avoid overwhelming the system
            satellite_items = list(self.satellites[constellation].items())[:50]
            
            for sat_id, sat_data in satellite_items:
                try:
                    satellite = EarthSatellite(sat_data['line1'], sat_data['line2'], sat_data['name'], self.ts)
                    geocentric = satellite.at(t)
                    subpoint = geocentric.subpoint()
                    
                    sat_info = {
                        'id': sat_id,
                        'name': sat_data['name'],
                        'position': {
                            'latitude': subpoint.latitude.degrees,
                            'longitude': subpoint.longitude.degrees,
                            'altitude_km': subpoint.elevation.km
                        },
                        'operational_status': self._determine_operational_status(sat_data)
                    }
                    
                    constellation_data['satellites'].append(sat_info)
                    
                except Exception as e:
                    logger.warning(f"Error processing satellite {sat_id}: {e}")
                    continue
            
            return constellation_data
            
        except Exception as e:
            logger.error(f"Error getting constellation {constellation}: {e}")
            return {}
    
    async def get_space_debris_tracking(self) -> Dict[str, Any]:
        """Get space debris tracking information"""
        try:
            if 'debris' not in self.satellites or self._needs_update('debris'):
                await self.update_tle_data('debris')
            
            if 'debris' not in self.satellites:
                return {'error': 'Debris data not available'}
            
            t = self.ts.now()
            debris_data = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'total_objects': len(self.satellites['debris']),
                'high_risk_objects': [],
                'collision_warnings': [],
                'statistics': {
                    'low_earth_orbit': 0,
                    'medium_earth_orbit': 0,
                    'geostationary_orbit': 0,
                    'highly_elliptical': 0
                }
            }
            
            # Analyze debris objects
            for debris_id, debris_data_item in list(self.satellites['debris'].items())[:100]:
                try:
                    satellite = EarthSatellite(debris_data_item['line1'], debris_data_item['line2'], 
                                             debris_data_item['name'], self.ts)
                    geocentric = satellite.at(t)
                    subpoint = geocentric.subpoint()
                    
                    altitude = subpoint.elevation.km
                    
                    # Classify orbit
                    if altitude < 2000:
                        debris_data['statistics']['low_earth_orbit'] += 1
                    elif altitude < 35786:
                        debris_data['statistics']['medium_earth_orbit'] += 1
                    elif 35786 <= altitude <= 35800:
                        debris_data['statistics']['geostationary_orbit'] += 1
                    else:
                        debris_data['statistics']['highly_elliptical'] += 1
                    
                    # Check for high-risk objects (low altitude, high velocity)
                    if altitude < 800:  # Low altitude objects are higher risk
                        risk_object = {
                            'id': debris_id,
                            'name': debris_data_item['name'],
                            'altitude_km': altitude,
                            'latitude': subpoint.latitude.degrees,
                            'longitude': subpoint.longitude.degrees,
                            'risk_level': 'high' if altitude < 400 else 'medium'
                        }
                        debris_data['high_risk_objects'].append(risk_object)
                    
                except Exception as e:
                    logger.warning(f"Error processing debris {debris_id}: {e}")
                    continue
            
            return debris_data
            
        except Exception as e:
            logger.error(f"Error getting space debris tracking: {e}")
            return {}
    
    async def calculate_collision_probability(self, sat1_id: str, sat2_id: str, 
                                           source1: str = 'active_satellites', 
                                           source2: str = 'debris') -> Dict[str, Any]:
        """Calculate collision probability between two space objects"""
        try:
            # Ensure both satellites are available
            if source1 not in self.satellites or source2 not in self.satellites:
                return {'error': 'Satellite data not available'}
            
            if sat1_id not in self.satellites[source1] or sat2_id not in self.satellites[source2]:
                return {'error': 'Specified satellites not found'}
            
            sat1_data = self.satellites[source1][sat1_id]
            sat2_data = self.satellites[source2][sat2_id]
            
            sat1 = EarthSatellite(sat1_data['line1'], sat1_data['line2'], sat1_data['name'], self.ts)
            sat2 = EarthSatellite(sat2_data['line1'], sat2_data['line2'], sat2_data['name'], self.ts)
            
            # Calculate positions over next 24 hours
            t_start = self.ts.now()
            t_end = self.ts.utc(t_start.utc_datetime() + timedelta(hours=24))
            times = self.ts.linspace(t_start, t_end, 1440)  # Every minute
            
            min_distance = float('inf')
            closest_approach_time = None
            
            for t in times:
                pos1 = sat1.at(t).position.km
                pos2 = sat2.at(t).position.km
                distance = np.linalg.norm(pos1 - pos2)
                
                if distance < min_distance:
                    min_distance = distance
                    closest_approach_time = t.utc_datetime()
            
            # Calculate collision probability (simplified model)
            collision_radius = 1.0  # km (combined radius of objects)
            probability = max(0, 1 - (min_distance / collision_radius)) if min_distance < 10 else 0
            
            result = {
                'satellite1': {'id': sat1_id, 'name': sat1_data['name']},
                'satellite2': {'id': sat2_id, 'name': sat2_data['name']},
                'minimum_distance_km': min_distance,
                'closest_approach_time': closest_approach_time.isoformat() if closest_approach_time else None,
                'collision_probability': probability,
                'risk_level': 'high' if probability > 0.1 else 'medium' if probability > 0.01 else 'low',
                'recommendation': self._get_collision_recommendation(probability, min_distance)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating collision probability: {e}")
            return {}
    
    async def get_satellite_passes(self, observer_lat: float, observer_lon: float, 
                                 observer_elevation: float = 0, satellite_name: str = 'ISS') -> Dict[str, Any]:
        """Calculate visible satellite passes for an observer location"""
        try:
            # Find satellite
            satellite = None
            for source, sats in self.satellites.items():
                for sat_id, sat_data in sats.items():
                    if satellite_name.lower() in sat_data['name'].lower():
                        satellite = EarthSatellite(sat_data['line1'], sat_data['line2'], 
                                                 sat_data['name'], self.ts)
                        break
                if satellite:
                    break
            
            if not satellite:
                return {'error': f'Satellite {satellite_name} not found'}
            
            # Observer location
            observer = Topos(latitude_degrees=observer_lat, 
                           longitude_degrees=observer_lon, 
                           elevation_m=observer_elevation)
            
            # Calculate passes for next 7 days
            t0 = self.ts.now()
            t1 = self.ts.utc(t0.utc_datetime() + timedelta(days=7))
            
            passes = []
            
            # Find passes (simplified calculation)
            times = self.ts.linspace(t0, t1, 10080)  # Every minute for 7 days
            
            current_pass = None
            for t in times:
                difference = satellite - observer
                topocentric = difference.at(t)
                alt, az, distance = topocentric.altaz()
                
                if alt.degrees > 10:  # Satellite is visible (above 10 degrees)
                    if current_pass is None:
                        current_pass = {
                            'start_time': t.utc_datetime(),
                            'max_elevation': alt.degrees,
                            'max_elevation_time': t.utc_datetime(),
                            'max_elevation_azimuth': az.degrees
                        }
                    else:
                        if alt.degrees > current_pass['max_elevation']:
                            current_pass['max_elevation'] = alt.degrees
                            current_pass['max_elevation_time'] = t.utc_datetime()
                            current_pass['max_elevation_azimuth'] = az.degrees
                else:
                    if current_pass is not None:
                        current_pass['end_time'] = t.utc_datetime()
                        current_pass['duration_minutes'] = (
                            current_pass['end_time'] - current_pass['start_time']
                        ).total_seconds() / 60
                        current_pass['visibility'] = self._classify_pass_visibility(
                            current_pass['max_elevation']
                        )
                        passes.append(current_pass)
                        current_pass = None
            
            return {
                'observer_location': {
                    'latitude': observer_lat,
                    'longitude': observer_lon,
                    'elevation_m': observer_elevation
                },
                'satellite': satellite_name,
                'passes': passes[:10],  # Return next 10 passes
                'total_passes': len(passes)
            }
            
        except Exception as e:
            logger.error(f"Error calculating satellite passes: {e}")
            return {}
    
    def _parse_tle_data(self, tle_text: str) -> Dict[str, Dict]:
        """Parse TLE data from text"""
        try:
            lines = tle_text.strip().split('\n')
            satellites = {}
            
            i = 0
            while i < len(lines) - 2:
                if lines[i].strip() and not lines[i].startswith('0 '):
                    name = lines[i].strip()
                    line1 = lines[i + 1].strip()
                    line2 = lines[i + 2].strip()
                    
                    if line1.startswith('1 ') and line2.startswith('2 '):
                        sat_id = line1[2:7].strip()
                        satellites[sat_id] = {
                            'name': name,
                            'line1': line1,
                            'line2': line2,
                            'catalog_number': sat_id,
                            'epoch': self._parse_epoch(line1),
                            'inclination': float(line2[8:16].strip()),
                            'raan': float(line2[17:25].strip()),
                            'eccentricity': float('0.' + line2[26:33].strip()),
                            'arg_perigee': float(line2[34:42].strip()),
                            'mean_anomaly': float(line2[43:51].strip()),
                            'mean_motion': float(line2[52:63].strip())
                        }
                    i += 3
                else:
                    i += 1
            
            return satellites
            
        except Exception as e:
            logger.error(f"Error parsing TLE data: {e}")
            return {}
    
    def _parse_epoch(self, line1: str) -> str:
        """Parse epoch from TLE line 1"""
        try:
            epoch_str = line1[18:32].strip()
            year = int(epoch_str[:2])
            if year < 57:
                year += 2000
            else:
                year += 1900
            
            day_of_year = float(epoch_str[2:])
            epoch_date = datetime(year, 1, 1) + timedelta(days=day_of_year - 1)
            return epoch_date.isoformat()
            
        except Exception as e:
            logger.error(f"Error parsing epoch: {e}")
            return ""
    
    def _needs_update(self, source: str, max_age_hours: int = 6) -> bool:
        """Check if TLE data needs updating"""
        if source not in self.last_update:
            return True
        
        age = datetime.now(timezone.utc) - self.last_update[source]
        return age.total_seconds() > (max_age_hours * 3600)
    
    def _calculate_velocity(self, satellite: EarthSatellite, t: Time) -> float:
        """Calculate satellite velocity in km/s"""
        try:
            # Calculate velocity using position difference
            dt = 1.0 / 86400.0  # 1 second in days
            t1 = self.ts.tt_jd(t.tt - dt/2)
            t2 = self.ts.tt_jd(t.tt + dt/2)
            
            pos1 = satellite.at(t1).position.km
            pos2 = satellite.at(t2).position.km
            
            velocity_vector = (pos2 - pos1) / dt / 86400  # km/s
            velocity_magnitude = np.linalg.norm(velocity_vector)
            
            return velocity_magnitude
            
        except Exception as e:
            logger.error(f"Error calculating velocity: {e}")
            return 0
    
    def _calculate_orbital_period(self, satellite: EarthSatellite) -> float:
        """Calculate orbital period in minutes"""
        try:
            # Extract mean motion from TLE data
            # Mean motion is in revolutions per day
            mean_motion = getattr(satellite, 'model', {}).get('no_kozai', 0)
            if mean_motion > 0:
                period_minutes = 1440 / mean_motion  # 1440 minutes in a day
                return period_minutes
            return 0
            
        except Exception as e:
            logger.error(f"Error calculating orbital period: {e}")
            return 0
    
    async def _calculate_visibility(self, satellite: EarthSatellite, t: Time) -> Dict[str, Any]:
        """Calculate visibility information"""
        try:
            # This is a simplified visibility calculation
            # In reality, you'd need observer location and sun position
            geocentric = satellite.at(t)
            subpoint = geocentric.subpoint()
            
            # Rough visibility estimation based on altitude and time
            altitude = subpoint.elevation.km
            current_time = t.utc_datetime()
            
            # Determine if it's day or night at satellite position
            is_daylight = self._is_daylight(subpoint.latitude.degrees, 
                                          subpoint.longitude.degrees, current_time)
            
            visibility = {
                'visible_to_naked_eye': altitude > 300 and not is_daylight,
                'magnitude': self._estimate_magnitude(altitude),
                'illuminated': not is_daylight,
                'shadow_entry_time': None,
                'shadow_exit_time': None
            }
            
            return visibility
            
        except Exception as e:
            logger.error(f"Error calculating visibility: {e}")
            return {}
    
    async def _calculate_next_passes(self, satellite: EarthSatellite, 
                                   observer_lat: float = 40.7128, 
                                   observer_lon: float = -74.0060) -> List[Dict]:
        """Calculate next visible passes"""
        try:
            # This is a simplified calculation
            # For a full implementation, you'd use the satellite_passes method
            passes = []
            
            # Calculate next 3 passes (simplified)
            for i in range(3):
                pass_time = datetime.now(timezone.utc) + timedelta(hours=8 * (i + 1))
                passes.append({
                    'start_time': pass_time.isoformat(),
                    'max_elevation': 45 + (i * 10),  # Dummy data
                    'duration_minutes': 5 + i,
                    'direction': 'SW to NE'
                })
            
            return passes
            
        except Exception as e:
            logger.error(f"Error calculating next passes: {e}")
            return []
    
    def _determine_operational_status(self, sat_data: Dict) -> str:
        """Determine if satellite is operational"""
        try:
            # This is a simplified determination
            # In reality, you'd need additional data sources
            name = sat_data['name'].lower()
            
            if 'debris' in name or 'rocket' in name:
                return 'debris'
            elif 'starlink' in name:
                return 'operational'
            elif any(keyword in name for keyword in ['noaa', 'goes', 'gps']):
                return 'operational'
            else:
                return 'unknown'
                
        except Exception as e:
            logger.error(f"Error determining operational status: {e}")
            return 'unknown'
    
    def _get_collision_recommendation(self, probability: float, distance: float) -> str:
        """Get collision avoidance recommendation"""
        if probability > 0.1:
            return "IMMEDIATE MANEUVER REQUIRED - High collision risk"
        elif probability > 0.01:
            return "Monitor closely - Consider avoidance maneuver"
        elif distance < 5:
            return "Close approach - Continue monitoring"
        else:
            return "Normal operations - No action required"
    
    def _classify_pass_visibility(self, max_elevation: float) -> str:
        """Classify pass visibility quality"""
        if max_elevation > 70:
            return "excellent"
        elif max_elevation > 40:
            return "good"
        elif max_elevation > 20:
            return "fair"
        else:
            return "poor"
    
    def _is_daylight(self, lat: float, lon: float, time: datetime) -> bool:
        """Determine if location is in daylight"""
        try:
            # Simplified daylight calculation
            observer = ephem.Observer()
            observer.lat = str(lat)
            observer.lon = str(lon)
            observer.date = time
            
            sun = ephem.Sun()
            sun.compute(observer)
            
            return sun.alt > 0
            
        except Exception as e:
            logger.error(f"Error calculating daylight: {e}")
            return False
    
    def _estimate_magnitude(self, altitude: float) -> float:
        """Estimate visual magnitude of satellite"""
        try:
            # Simplified magnitude estimation
            # Lower altitude = brighter (lower magnitude)
            if altitude > 1000:
                return 6.0  # Too faint to see
            elif altitude > 500:
                return 4.0
            elif altitude > 300:
                return 2.0
            else:
                return 0.0  # Very bright
                
        except Exception as e:
            logger.error(f"Error estimating magnitude: {e}")
            return 6.0