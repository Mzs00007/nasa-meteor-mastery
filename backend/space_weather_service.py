"""
Space Weather Monitoring Service
Real-time monitoring of solar activity, magnetic storms, and space weather conditions
"""
import asyncio
import aiohttp
import requests
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class SpaceWeatherService:
    """Comprehensive space weather monitoring and prediction service"""
    
    def __init__(self):
        self.data_sources = {
            'noaa_swpc': 'https://services.swpc.noaa.gov/json',
            'noaa_alerts': 'https://services.swpc.noaa.gov/products/alerts.json',
            'solar_cycle': 'https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json',
            'kp_index': 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
            'solar_wind': 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json',
            'magnetometer': 'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json',
            'xray_flux': 'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json',
            'proton_flux': 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-7-day.json',
            'electron_flux': 'https://services.swpc.noaa.gov/json/goes/primary/electrons-7-day.json',
            'dst_index': 'https://services.swpc.noaa.gov/products/kyoto-dst.json',
            'aurora_forecast': 'https://services.swpc.noaa.gov/json/ovation_aurora_latest.json'
        }
        self.session = None
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def get_current_conditions(self) -> Dict[str, Any]:
        """Get current space weather conditions summary"""
        try:
            conditions = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'overall_status': 'normal',
                'alerts': [],
                'solar_activity': {},
                'geomagnetic_activity': {},
                'radiation_environment': {},
                'aurora_activity': {},
                'space_weather_scale': {
                    'geomagnetic': {'level': 'G0', 'description': 'No storm'},
                    'solar_radiation': {'level': 'S0', 'description': 'No storm'},
                    'radio_blackout': {'level': 'R0', 'description': 'No blackout'}
                }
            }
            
            # Get current alerts
            alerts = await self._get_space_weather_alerts()
            conditions['alerts'] = alerts
            
            # Determine overall status from alerts
            if any(alert['level'] in ['extreme', 'severe'] for alert in alerts):
                conditions['overall_status'] = 'severe'
            elif any(alert['level'] in ['strong', 'moderate'] for alert in alerts):
                conditions['overall_status'] = 'active'
            elif any(alert['level'] == 'minor' for alert in alerts):
                conditions['overall_status'] = 'minor'
            
            # Get solar activity
            conditions['solar_activity'] = await self._get_solar_activity()
            
            # Get geomagnetic activity
            conditions['geomagnetic_activity'] = await self._get_geomagnetic_activity()
            
            # Get radiation environment
            conditions['radiation_environment'] = await self._get_radiation_environment()
            
            # Get aurora activity
            conditions['aurora_activity'] = await self._get_aurora_activity()
            
            # Update space weather scales
            conditions['space_weather_scale'] = self._calculate_space_weather_scales(conditions)
            
            return conditions
            
        except Exception as e:
            logger.error(f"Error getting current conditions: {e}")
            return {}
    
    async def get_solar_wind_data(self, hours: int = 24) -> Dict[str, Any]:
        """Get solar wind plasma and magnetic field data"""
        try:
            cache_key = f"solar_wind_{hours}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]
            
            # Get plasma data
            plasma_data = await self._fetch_json_data('solar_wind')
            mag_data = await self._fetch_json_data('magnetometer')
            
            if not plasma_data or not mag_data:
                return {}
            
            # Process and combine data
            solar_wind = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'data_points': [],
                'statistics': {
                    'avg_speed': 0,
                    'max_speed': 0,
                    'avg_density': 0,
                    'avg_temperature': 0,
                    'avg_bz': 0,
                    'min_bz': 0
                }
            }
            
            # Limit to requested hours
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            speeds = []
            densities = []
            temperatures = []
            bz_values = []
            
            for i, plasma_point in enumerate(plasma_data[-hours*60:]):  # Assuming 1-minute data
                try:
                    time_tag = plasma_point[0]
                    point_time = datetime.fromisoformat(time_tag.replace('Z', '+00:00'))
                    
                    if point_time < cutoff_time:
                        continue
                    
                    # Get corresponding magnetic field data
                    mag_point = mag_data[i] if i < len(mag_data) else None
                    
                    data_point = {
                        'time': time_tag,
                        'speed': plasma_point[1] if len(plasma_point) > 1 else None,
                        'density': plasma_point[2] if len(plasma_point) > 2 else None,
                        'temperature': plasma_point[3] if len(plasma_point) > 3 else None,
                        'bx': mag_point[1] if mag_point and len(mag_point) > 1 else None,
                        'by': mag_point[2] if mag_point and len(mag_point) > 2 else None,
                        'bz': mag_point[3] if mag_point and len(mag_point) > 3 else None,
                        'bt': mag_point[4] if mag_point and len(mag_point) > 4 else None
                    }
                    
                    solar_wind['data_points'].append(data_point)
                    
                    # Collect statistics
                    if data_point['speed'] is not None:
                        speeds.append(data_point['speed'])
                    if data_point['density'] is not None:
                        densities.append(data_point['density'])
                    if data_point['temperature'] is not None:
                        temperatures.append(data_point['temperature'])
                    if data_point['bz'] is not None:
                        bz_values.append(data_point['bz'])
                        
                except Exception as e:
                    logger.warning(f"Error processing solar wind data point: {e}")
                    continue
            
            # Calculate statistics
            if speeds:
                solar_wind['statistics']['avg_speed'] = np.mean(speeds)
                solar_wind['statistics']['max_speed'] = np.max(speeds)
            if densities:
                solar_wind['statistics']['avg_density'] = np.mean(densities)
            if temperatures:
                solar_wind['statistics']['avg_temperature'] = np.mean(temperatures)
            if bz_values:
                solar_wind['statistics']['avg_bz'] = np.mean(bz_values)
                solar_wind['statistics']['min_bz'] = np.min(bz_values)
            
            self._cache_data(cache_key, solar_wind)
            return solar_wind
            
        except Exception as e:
            logger.error(f"Error getting solar wind data: {e}")
            return {}
    
    async def get_xray_flux_data(self, hours: int = 24) -> Dict[str, Any]:
        """Get X-ray flux data from GOES satellites"""
        try:
            cache_key = f"xray_flux_{hours}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]
            
            xray_data = await self._fetch_json_data('xray_flux')
            
            if not xray_data:
                return {}
            
            # Process X-ray data
            xray_flux = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'data_points': [],
                'flare_events': [],
                'current_class': 'A',
                'peak_flux': {
                    'short': 0,
                    'long': 0,
                    'time': None
                }
            }
            
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            short_fluxes = []
            long_fluxes = []
            
            for point in xray_data[-hours*60:]:  # Assuming 1-minute data
                try:
                    time_tag = point[0]
                    point_time = datetime.fromisoformat(time_tag.replace('Z', '+00:00'))
                    
                    if point_time < cutoff_time:
                        continue
                    
                    short_flux = point[1] if len(point) > 1 else None
                    long_flux = point[2] if len(point) > 2 else None
                    
                    data_point = {
                        'time': time_tag,
                        'short_channel': short_flux,  # 0.5-4.0 Angstrom
                        'long_channel': long_flux     # 1.0-8.0 Angstrom
                    }
                    
                    xray_flux['data_points'].append(data_point)
                    
                    if short_flux is not None:
                        short_fluxes.append(short_flux)
                    if long_flux is not None:
                        long_fluxes.append(long_flux)
                    
                    # Check for flare events
                    if short_flux and short_flux > 1e-6:  # C-class or higher
                        flare_class = self._classify_xray_flare(short_flux)
                        if flare_class != 'A':
                            xray_flux['flare_events'].append({
                                'time': time_tag,
                                'class': flare_class,
                                'peak_flux': short_flux
                            })
                    
                except Exception as e:
                    logger.warning(f"Error processing X-ray data point: {e}")
                    continue
            
            # Calculate peak flux
            if short_fluxes:
                max_short = max(short_fluxes)
                max_short_idx = short_fluxes.index(max_short)
                xray_flux['peak_flux']['short'] = max_short
                xray_flux['peak_flux']['time'] = xray_flux['data_points'][max_short_idx]['time']
                xray_flux['current_class'] = self._classify_xray_flare(max_short)
            
            if long_fluxes:
                xray_flux['peak_flux']['long'] = max(long_fluxes)
            
            self._cache_data(cache_key, xray_flux)
            return xray_flux
            
        except Exception as e:
            logger.error(f"Error getting X-ray flux data: {e}")
            return {}
    
    async def get_kp_index_data(self, days: int = 7) -> Dict[str, Any]:
        """Get planetary K-index data"""
        try:
            cache_key = f"kp_index_{days}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]
            
            kp_data = await self._fetch_json_data('kp_index')
            
            if not kp_data:
                return {}
            
            kp_index = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'data_points': [],
                'current_kp': 0,
                'max_kp_24h': 0,
                'geomagnetic_storm_level': 'G0',
                'statistics': {
                    'avg_kp': 0,
                    'storm_days': 0,
                    'quiet_days': 0
                }
            }
            
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=days)
            kp_values = []
            storm_count = 0
            quiet_count = 0
            
            for point in kp_data[-days*8:]:  # 8 measurements per day (3-hour intervals)
                try:
                    time_tag = point[0]
                    point_time = datetime.fromisoformat(time_tag.replace('Z', '+00:00'))
                    
                    if point_time < cutoff_time:
                        continue
                    
                    kp_value = point[1] if len(point) > 1 else None
                    
                    if kp_value is not None:
                        data_point = {
                            'time': time_tag,
                            'kp': kp_value,
                            'storm_level': self._classify_geomagnetic_storm(kp_value)
                        }
                        
                        kp_index['data_points'].append(data_point)
                        kp_values.append(kp_value)
                        
                        if kp_value >= 5:
                            storm_count += 1
                        elif kp_value <= 2:
                            quiet_count += 1
                    
                except Exception as e:
                    logger.warning(f"Error processing Kp data point: {e}")
                    continue
            
            # Calculate statistics
            if kp_values:
                kp_index['current_kp'] = kp_values[-1]
                kp_index['max_kp_24h'] = max(kp_values[-8:]) if len(kp_values) >= 8 else max(kp_values)
                kp_index['geomagnetic_storm_level'] = self._classify_geomagnetic_storm(kp_index['max_kp_24h'])
                kp_index['statistics']['avg_kp'] = np.mean(kp_values)
                kp_index['statistics']['storm_days'] = storm_count
                kp_index['statistics']['quiet_days'] = quiet_count
            
            self._cache_data(cache_key, kp_index)
            return kp_index
            
        except Exception as e:
            logger.error(f"Error getting Kp index data: {e}")
            return {}
    
    async def get_aurora_forecast(self) -> Dict[str, Any]:
        """Get aurora forecast and visibility predictions"""
        try:
            cache_key = "aurora_forecast"
            if self._is_cached(cache_key):
                return self.cache[cache_key]
            
            aurora_data = await self._fetch_json_data('aurora_forecast')
            
            if not aurora_data:
                return {}
            
            aurora_forecast = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'forecast_time': aurora_data.get('Forecast_Time', ''),
                'aurora_activity': 'low',
                'visibility_locations': [],
                'kp_threshold': 3,
                'recommendations': []
            }
            
            # Process aurora data (simplified)
            # In reality, this would involve complex geomagnetic modeling
            coordinates = aurora_data.get('coordinates', [])
            
            if coordinates:
                # Analyze aurora oval position and intensity
                max_intensity = 0
                visible_latitudes = []
                
                for coord in coordinates:
                    if len(coord) >= 3:
                        lat, lon, intensity = coord[0], coord[1], coord[2]
                        if intensity > max_intensity:
                            max_intensity = intensity
                        
                        if intensity > 0.3:  # Threshold for visibility
                            visible_latitudes.append(lat)
                
                # Determine activity level
                if max_intensity > 0.8:
                    aurora_forecast['aurora_activity'] = 'high'
                elif max_intensity > 0.5:
                    aurora_forecast['aurora_activity'] = 'moderate'
                elif max_intensity > 0.2:
                    aurora_forecast['aurora_activity'] = 'low'
                else:
                    aurora_forecast['aurora_activity'] = 'minimal'
                
                # Determine visibility locations
                if visible_latitudes:
                    min_lat = min(visible_latitudes)
                    aurora_forecast['visibility_locations'] = self._get_aurora_visibility_locations(min_lat)
                
                # Generate recommendations
                aurora_forecast['recommendations'] = self._generate_aurora_recommendations(
                    aurora_forecast['aurora_activity'], min_lat if visible_latitudes else 70
                )
            
            self._cache_data(cache_key, aurora_forecast)
            return aurora_forecast
            
        except Exception as e:
            logger.error(f"Error getting aurora forecast: {e}")
            return {}
    
    async def get_space_weather_forecast(self, days: int = 3) -> Dict[str, Any]:
        """Get space weather forecast for the next few days"""
        try:
            forecast = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'forecast_period_days': days,
                'daily_forecasts': [],
                'summary': {
                    'overall_outlook': 'quiet',
                    'major_events': [],
                    'recommendations': []
                }
            }
            
            # Generate forecast for each day
            for day in range(days):
                forecast_date = datetime.now(timezone.utc) + timedelta(days=day)
                
                daily_forecast = {
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'solar_activity': {
                        'flare_probability': self._predict_flare_probability(),
                        'expected_class': 'C',
                        'confidence': 'medium'
                    },
                    'geomagnetic_activity': {
                        'kp_range': [2, 4],
                        'storm_probability': 0.1,
                        'confidence': 'medium'
                    },
                    'radio_conditions': {
                        'hf_conditions': 'normal',
                        'blackout_probability': 0.05
                    },
                    'satellite_environment': {
                        'charging_risk': 'low',
                        'drag_enhancement': 'minimal'
                    }
                }
                
                forecast['daily_forecasts'].append(daily_forecast)
            
            # Generate summary
            forecast['summary'] = self._generate_forecast_summary(forecast['daily_forecasts'])
            
            return forecast
            
        except Exception as e:
            logger.error(f"Error getting space weather forecast: {e}")
            return {}
    
    async def _get_space_weather_alerts(self) -> List[Dict[str, Any]]:
        """Get current space weather alerts"""
        try:
            alerts_data = await self._fetch_json_data('noaa_alerts')
            
            if not alerts_data:
                return []
            
            alerts = []
            for alert in alerts_data:
                processed_alert = {
                    'id': alert.get('message_id', ''),
                    'title': alert.get('message', ''),
                    'level': self._classify_alert_level(alert.get('message', '')),
                    'type': self._classify_alert_type(alert.get('message', '')),
                    'issued_time': alert.get('issue_datetime', ''),
                    'description': alert.get('message', ''),
                    'impacts': self._get_alert_impacts(alert.get('message', ''))
                }
                alerts.append(processed_alert)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error getting space weather alerts: {e}")
            return []
    
    async def _get_solar_activity(self) -> Dict[str, Any]:
        """Get current solar activity information"""
        try:
            # Get X-ray data for solar flare activity
            xray_data = await self.get_xray_flux_data(hours=6)
            
            solar_activity = {
                'current_xray_class': xray_data.get('current_class', 'A'),
                'flare_count_24h': len(xray_data.get('flare_events', [])),
                'sunspot_number': await self._get_sunspot_number(),
                'solar_flux_10cm': await self._get_solar_flux(),
                'activity_level': 'low'
            }
            
            # Determine activity level
            if solar_activity['current_xray_class'] in ['X', 'M']:
                solar_activity['activity_level'] = 'high'
            elif solar_activity['current_xray_class'] == 'C':
                solar_activity['activity_level'] = 'moderate'
            elif solar_activity['flare_count_24h'] > 5:
                solar_activity['activity_level'] = 'moderate'
            
            return solar_activity
            
        except Exception as e:
            logger.error(f"Error getting solar activity: {e}")
            return {}
    
    async def _get_geomagnetic_activity(self) -> Dict[str, Any]:
        """Get current geomagnetic activity information"""
        try:
            kp_data = await self.get_kp_index_data(days=1)
            
            geomagnetic_activity = {
                'current_kp': kp_data.get('current_kp', 0),
                'max_kp_24h': kp_data.get('max_kp_24h', 0),
                'storm_level': kp_data.get('geomagnetic_storm_level', 'G0'),
                'activity_level': 'quiet'
            }
            
            # Determine activity level
            if geomagnetic_activity['current_kp'] >= 5:
                geomagnetic_activity['activity_level'] = 'storm'
            elif geomagnetic_activity['current_kp'] >= 4:
                geomagnetic_activity['activity_level'] = 'active'
            elif geomagnetic_activity['current_kp'] >= 3:
                geomagnetic_activity['activity_level'] = 'unsettled'
            
            return geomagnetic_activity
            
        except Exception as e:
            logger.error(f"Error getting geomagnetic activity: {e}")
            return {}
    
    async def _get_radiation_environment(self) -> Dict[str, Any]:
        """Get current radiation environment information"""
        try:
            # This would typically involve proton and electron flux data
            radiation_env = {
                'proton_flux_level': 'normal',
                'electron_flux_level': 'normal',
                'radiation_storm_level': 'S0',
                'astronaut_radiation_exposure': 'low',
                'satellite_charging_risk': 'low'
            }
            
            return radiation_env
            
        except Exception as e:
            logger.error(f"Error getting radiation environment: {e}")
            return {}
    
    async def _get_aurora_activity(self) -> Dict[str, Any]:
        """Get current aurora activity information"""
        try:
            aurora_data = await self.get_aurora_forecast()
            
            aurora_activity = {
                'activity_level': aurora_data.get('aurora_activity', 'low'),
                'visibility_extent': 'polar regions',
                'intensity': 'moderate',
                'colors_expected': ['green', 'red']
            }
            
            return aurora_activity
            
        except Exception as e:
            logger.error(f"Error getting aurora activity: {e}")
            return {}
    
    async def _fetch_json_data(self, source: str) -> List[Any]:
        """Fetch JSON data from a source"""
        try:
            if source not in self.data_sources:
                return []
            
            url = self.data_sources[source]
            
            if self.session:
                async with self.session.get(url, timeout=30) as response:
                    if response.status == 200:
                        return await response.json()
            else:
                response = requests.get(url, timeout=30)
                if response.status_code == 200:
                    return response.json()
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching data from {source}: {e}")
            return []
    
    def _classify_xray_flare(self, flux: float) -> str:
        """Classify X-ray flare based on flux level"""
        if flux >= 1e-3:
            return 'X'
        elif flux >= 1e-4:
            return 'M'
        elif flux >= 1e-5:
            return 'C'
        elif flux >= 1e-6:
            return 'B'
        else:
            return 'A'
    
    def _classify_geomagnetic_storm(self, kp: float) -> str:
        """Classify geomagnetic storm level based on Kp index"""
        if kp >= 9:
            return 'G5'
        elif kp >= 8:
            return 'G4'
        elif kp >= 7:
            return 'G3'
        elif kp >= 6:
            return 'G2'
        elif kp >= 5:
            return 'G1'
        else:
            return 'G0'
    
    def _classify_alert_level(self, message: str) -> str:
        """Classify alert severity level"""
        message_lower = message.lower()
        if any(word in message_lower for word in ['extreme', 'severe']):
            return 'severe'
        elif any(word in message_lower for word in ['strong', 'major']):
            return 'strong'
        elif any(word in message_lower for word in ['moderate']):
            return 'moderate'
        elif any(word in message_lower for word in ['minor', 'weak']):
            return 'minor'
        else:
            return 'info'
    
    def _classify_alert_type(self, message: str) -> str:
        """Classify alert type"""
        message_lower = message.lower()
        if 'geomagnetic' in message_lower:
            return 'geomagnetic'
        elif 'solar' in message_lower or 'flare' in message_lower:
            return 'solar'
        elif 'radio' in message_lower:
            return 'radio'
        elif 'radiation' in message_lower:
            return 'radiation'
        else:
            return 'general'
    
    def _get_alert_impacts(self, message: str) -> List[str]:
        """Extract potential impacts from alert message"""
        impacts = []
        message_lower = message.lower()
        
        if 'satellite' in message_lower:
            impacts.append('Satellite operations may be affected')
        if 'gps' in message_lower or 'navigation' in message_lower:
            impacts.append('GPS and navigation systems may experience disruptions')
        if 'radio' in message_lower or 'communication' in message_lower:
            impacts.append('Radio communications may be degraded')
        if 'power' in message_lower or 'grid' in message_lower:
            impacts.append('Power grid fluctuations possible')
        if 'aurora' in message_lower:
            impacts.append('Aurora may be visible at lower latitudes')
        
        return impacts
    
    def _calculate_space_weather_scales(self, conditions: Dict) -> Dict[str, Dict]:
        """Calculate NOAA Space Weather Scales"""
        scales = {
            'geomagnetic': {'level': 'G0', 'description': 'No storm'},
            'solar_radiation': {'level': 'S0', 'description': 'No storm'},
            'radio_blackout': {'level': 'R0', 'description': 'No blackout'}
        }
        
        # Geomagnetic scale based on Kp
        kp = conditions.get('geomagnetic_activity', {}).get('current_kp', 0)
        scales['geomagnetic']['level'] = self._classify_geomagnetic_storm(kp)
        
        # Solar radiation scale (simplified)
        # Would need proton flux data for accurate classification
        
        # Radio blackout scale based on X-ray flux
        xray_class = conditions.get('solar_activity', {}).get('current_xray_class', 'A')
        if xray_class == 'X':
            scales['radio_blackout'] = {'level': 'R3', 'description': 'Strong'}
        elif xray_class == 'M':
            scales['radio_blackout'] = {'level': 'R2', 'description': 'Moderate'}
        elif xray_class == 'C':
            scales['radio_blackout'] = {'level': 'R1', 'description': 'Minor'}
        
        return scales
    
    def _get_aurora_visibility_locations(self, min_latitude: float) -> List[str]:
        """Get locations where aurora might be visible"""
        locations = []
        
        if min_latitude <= 45:
            locations.extend(['Northern United States', 'Southern Canada', 'Northern Europe'])
        if min_latitude <= 50:
            locations.extend(['Alaska', 'Northern Canada', 'Scandinavia', 'Northern Russia'])
        if min_latitude <= 60:
            locations.extend(['Iceland', 'Greenland', 'Northern Alaska'])
        if min_latitude <= 70:
            locations.extend(['Arctic Circle', 'Svalbard', 'Northern Greenland'])
        
        return locations
    
    def _generate_aurora_recommendations(self, activity_level: str, min_latitude: float) -> List[str]:
        """Generate aurora viewing recommendations"""
        recommendations = []
        
        if activity_level in ['high', 'moderate']:
            recommendations.append('Excellent aurora viewing conditions expected')
            recommendations.append('Look north after astronomical twilight')
            recommendations.append('Best viewing between 10 PM and 2 AM local time')
            
            if min_latitude < 55:
                recommendations.append('Aurora may be visible from mid-latitude locations')
        elif activity_level == 'low':
            recommendations.append('Aurora may be visible from high-latitude locations')
            recommendations.append('Look for faint green glow on northern horizon')
        else:
            recommendations.append('Aurora activity is minimal')
            recommendations.append('Only visible from polar regions')
        
        return recommendations
    
    async def _get_sunspot_number(self) -> int:
        """Get current sunspot number (simplified)"""
        try:
            # This would typically come from solar cycle data
            return 50  # Placeholder
        except Exception as e:
            logger.error(f"Error getting sunspot number: {e}")
            return 0
    
    async def _get_solar_flux(self) -> float:
        """Get 10.7 cm solar flux (simplified)"""
        try:
            # This would typically come from radio telescope data
            return 120.0  # Placeholder
        except Exception as e:
            logger.error(f"Error getting solar flux: {e}")
            return 0.0
    
    def _predict_flare_probability(self) -> float:
        """Predict solar flare probability (simplified)"""
        # This would involve complex solar physics modeling
        return 0.15  # 15% chance
    
    def _generate_forecast_summary(self, daily_forecasts: List[Dict]) -> Dict[str, Any]:
        """Generate forecast summary"""
        summary = {
            'overall_outlook': 'quiet',
            'major_events': [],
            'recommendations': []
        }
        
        # Analyze forecasts for trends
        max_kp = max([max(day['geomagnetic_activity']['kp_range']) for day in daily_forecasts])
        
        if max_kp >= 6:
            summary['overall_outlook'] = 'active'
            summary['major_events'].append('Geomagnetic storm conditions possible')
        elif max_kp >= 4:
            summary['overall_outlook'] = 'unsettled'
        
        # Generate recommendations
        if summary['overall_outlook'] == 'active':
            summary['recommendations'].extend([
                'Monitor satellite operations closely',
                'Prepare for possible GPS disruptions',
                'Aurora may be visible at lower latitudes'
            ])
        
        return summary
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid"""
        if key not in self.cache:
            return False
        
        cache_time = self.cache[key].get('_cache_time', 0)
        return (datetime.now().timestamp() - cache_time) < self.cache_duration
    
    def _cache_data(self, key: str, data: Dict) -> None:
        """Cache data with timestamp"""
        data['_cache_time'] = datetime.now().timestamp()
        self.cache[key] = data