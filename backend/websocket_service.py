"""
Real-time WebSocket Service for NASA Meteor Mastery
Handles live data streaming for mission control operations
"""
import asyncio
import json
import logging
import time
from datetime import datetime, timezone, timedelta
import threading
from typing import Dict, List, Any, Optional
from threading import Thread

from flask_socketio import SocketIO, emit, join_room, leave_room
import requests
import aiohttp
from astropy.time import Time
from astropy.coordinates import EarthLocation, AltAz, get_sun
import numpy as np

from nasa_api_service import NASAAPIService
from satellite_tracking_service import SatelliteTrackingService
from space_weather_service import SpaceWeatherService
from earth_observation_service import EarthObservationService

logger = logging.getLogger(__name__)

class RealTimeDataStreamer:
    """Manages real-time data streaming for various space-related APIs"""
    
    def __init__(self, socketio: SocketIO, nasa_api_key: str = "DEMO_KEY"):
        self.socketio = socketio
        self.nasa_api_key = nasa_api_key
        
        # Initialize comprehensive services
        self.nasa_service = NASAAPIService(nasa_api_key)
        self.satellite_service = SatelliteTrackingService()
        self.space_weather_service = SpaceWeatherService()
        self.earth_observation_service = EarthObservationService(nasa_api_key)
        
        self.active_streams = {}
        self.data_cache = {}
        self.update_intervals = {
            'iss_position': 5,  # seconds
            'neo_data': 300,    # 5 minutes
            'space_weather': 600,  # 10 minutes
            'satellite_tracking': 30,  # 30 seconds
            'seismic_data': 60,  # 1 minute
            'solar_activity': 300,  # 5 minutes
            'atmospheric_data': 180,  # 3 minutes
        }
        self.running = False
        
    def start_streaming(self):
        """Start all real-time data streams"""
        if not self.running:
            self.running = True
            
            # Start comprehensive streaming threads
            streams = [
                ('iss_position', self._stream_iss_position),
                ('neo_data', self._stream_neo_data),
                ('space_weather', self._stream_space_weather),
                ('satellite_tracking', self._stream_satellite_tracking),
                ('seismic_data', self._stream_seismic_data),
                ('solar_activity', self._stream_solar_activity),
                ('atmospheric_data', self._stream_atmospheric_data),
                ('comprehensive_nasa_data', self._stream_comprehensive_nasa_data),
                ('advanced_satellite_tracking', self._stream_advanced_satellite_tracking),
                ('detailed_space_weather', self._stream_detailed_space_weather),
                ('earth_observation', self._stream_earth_observation),
                ('mission_control_telemetry', self._stream_mission_control_telemetry),
                ('orbital_mechanics', self._stream_orbital_mechanics),
                ('real_time_events', self._stream_real_time_events)
            ]
            
            for stream_name, stream_func in streams:
                thread = Thread(target=stream_func, daemon=True)
                thread.start()
                logger.info(f"Started {stream_name} streaming thread")
            
            logger.info("All comprehensive data streaming threads started")
    
    def stop_streaming(self):
        """Stop all real-time data streams"""
        self.running = False
        logger.info("Real-time data streaming stopped")
    
    def _stream_iss_position(self):
        """Stream ISS position data"""
        while self.running:
            try:
                # Fetch ISS position from NASA API
                response = requests.get('http://api.open-notify.org/iss-now.json', timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    iss_data = {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'latitude': float(data['iss_position']['latitude']),
                        'longitude': float(data['iss_position']['longitude']),
                        'altitude': 408,  # Average ISS altitude in km
                        'velocity': 27600,  # Average ISS velocity in km/h
                        'orbital_period': 92.68,  # minutes
                        'crew_count': 7,  # Current crew size (approximate)
                        'status': 'operational'
                    }
                    
                    # Calculate additional orbital parameters
                    iss_data.update(self._calculate_iss_orbital_params(iss_data))
                    
                    self.socketio.emit('iss_position_update', iss_data, room='mission_control')
                    self.data_cache['iss_position'] = iss_data
                    
            except Exception as e:
                logger.error(f"Error fetching ISS position: {e}")
            
            time.sleep(self.update_intervals['iss_position'])
    
    def _stream_neo_data(self):
        """Stream Near Earth Objects data"""
        while self.running:
            try:
                # NASA NEO API
                api_key = 'DEMO_KEY'  # Replace with actual API key
                today = datetime.now().strftime('%Y-%m-%d')
                url = f'https://api.nasa.gov/neo/rest/v1/feed?start_date={today}&end_date={today}&api_key={api_key}'
                
                response = requests.get(url, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    neo_data = {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'total_count': data.get('element_count', 0),
                        'objects': []
                    }
                    
                    # Process NEO objects
                    for date_key, objects in data.get('near_earth_objects', {}).items():
                        for obj in objects[:10]:  # Limit to 10 objects for performance
                            neo_obj = {
                                'id': obj['id'],
                                'name': obj['name'],
                                'diameter_min': obj['estimated_diameter']['kilometers']['estimated_diameter_min'],
                                'diameter_max': obj['estimated_diameter']['kilometers']['estimated_diameter_max'],
                                'potentially_hazardous': obj['is_potentially_hazardous_asteroid'],
                                'close_approach_date': obj['close_approach_data'][0]['close_approach_date'],
                                'miss_distance_km': float(obj['close_approach_data'][0]['miss_distance']['kilometers']),
                                'relative_velocity_kmh': float(obj['close_approach_data'][0]['relative_velocity']['kilometers_per_hour']),
                                'absolute_magnitude': obj['absolute_magnitude_h']
                            }
                            neo_data['objects'].append(neo_obj)
                    
                    self.socketio.emit('neo_data_update', neo_data, room='mission_control')
                    self.data_cache['neo_data'] = neo_data
                    
            except Exception as e:
                logger.error(f"Error fetching NEO data: {e}")
            
            time.sleep(self.update_intervals['neo_data'])
    
    def _stream_space_weather(self):
        """Stream space weather data"""
        while self.running:
            try:
                # NOAA Space Weather API
                response = requests.get('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    latest_data = data[-1] if data else {}
                    
                    space_weather = {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'kp_index': latest_data.get('kp', 0),
                        'geomagnetic_activity': self._classify_geomagnetic_activity(latest_data.get('kp', 0)),
                        'solar_wind_speed': np.random.normal(400, 50),  # Simulated data
                        'solar_wind_density': np.random.normal(5, 2),
                        'interplanetary_magnetic_field': np.random.normal(5, 2),
                        'aurora_activity': 'moderate',
                        'radiation_level': 'normal',
                        'satellite_environment': 'stable'
                    }
                    
                    self.socketio.emit('space_weather_update', space_weather, room='mission_control')
                    self.data_cache['space_weather'] = space_weather
                    
            except Exception as e:
                logger.error(f"Error fetching space weather data: {e}")
            
            time.sleep(self.update_intervals['space_weather'])
    
    def _stream_satellite_tracking(self):
        """Stream satellite constellation tracking data"""
        while self.running:
            try:
                # Simulate satellite tracking data (in production, use TLE data)
                satellites = []
                
                # GPS constellation
                for i in range(24):
                    satellite = {
                        'id': f'GPS-{i+1:02d}',
                        'name': f'GPS Block IIF-{i+1}',
                        'type': 'navigation',
                        'latitude': np.random.uniform(-90, 90),
                        'longitude': np.random.uniform(-180, 180),
                        'altitude': np.random.normal(20200, 100),
                        'velocity': np.random.normal(3874, 50),
                        'status': 'operational',
                        'signal_strength': np.random.uniform(0.8, 1.0)
                    }
                    satellites.append(satellite)
                
                # Starlink constellation (sample)
                for i in range(50):
                    satellite = {
                        'id': f'STARLINK-{i+1:04d}',
                        'name': f'Starlink-{i+1}',
                        'type': 'communication',
                        'latitude': np.random.uniform(-90, 90),
                        'longitude': np.random.uniform(-180, 180),
                        'altitude': np.random.normal(550, 20),
                        'velocity': np.random.normal(7660, 100),
                        'status': 'operational',
                        'signal_strength': np.random.uniform(0.7, 1.0)
                    }
                    satellites.append(satellite)
                
                satellite_data = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'total_tracked': len(satellites),
                    'satellites': satellites
                }
                
                self.socketio.emit('satellite_tracking_update', satellite_data, room='mission_control')
                self.data_cache['satellite_tracking'] = satellite_data
                
            except Exception as e:
                logger.error(f"Error generating satellite tracking data: {e}")
            
            time.sleep(self.update_intervals['satellite_tracking'])
    
    def _stream_seismic_data(self):
        """Stream USGS seismic data"""
        while self.running:
            try:
                # USGS Earthquake API
                url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson'
                response = requests.get(url, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    earthquakes = []
                    
                    for feature in data.get('features', [])[:20]:  # Limit to 20 recent earthquakes
                        props = feature['properties']
                        coords = feature['geometry']['coordinates']
                        
                        earthquake = {
                            'id': feature['id'],
                            'magnitude': props.get('mag', 0),
                            'location': props.get('place', 'Unknown'),
                            'latitude': coords[1],
                            'longitude': coords[0],
                            'depth': coords[2],
                            'time': props.get('time'),
                            'tsunami_risk': props.get('tsunami', 0),
                            'significance': props.get('sig', 0),
                            'alert_level': props.get('alert', 'green')
                        }
                        earthquakes.append(earthquake)
                    
                    seismic_data = {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'total_events': len(earthquakes),
                        'earthquakes': earthquakes,
                        'global_activity_level': self._assess_seismic_activity(earthquakes)
                    }
                    
                    self.socketio.emit('seismic_data_update', seismic_data, room='mission_control')
                    self.data_cache['seismic_data'] = seismic_data
                    
            except Exception as e:
                logger.error(f"Error fetching seismic data: {e}")
            
            time.sleep(self.update_intervals['seismic_data'])
    
    def _stream_solar_activity(self):
        """Stream solar activity data"""
        while self.running:
            try:
                # Simulate solar activity data (in production, use SOHO/SDO APIs)
                solar_data = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'solar_flux': np.random.normal(150, 20),
                    'sunspot_number': np.random.randint(0, 200),
                    'solar_wind_speed': np.random.normal(400, 50),
                    'coronal_mass_ejections': np.random.randint(0, 3),
                    'solar_flare_activity': np.random.choice(['quiet', 'minor', 'moderate', 'strong']),
                    'x_ray_flux': np.random.exponential(1e-6),
                    'proton_flux': np.random.exponential(1),
                    'electron_flux': np.random.exponential(100),
                    'aurora_forecast': np.random.choice(['low', 'moderate', 'high']),
                    'radio_blackout_risk': np.random.choice(['none', 'minor', 'moderate', 'strong'])
                }
                
                self.socketio.emit('solar_activity_update', solar_data, room='mission_control')
                self.data_cache['solar_activity'] = solar_data
                
            except Exception as e:
                logger.error(f"Error generating solar activity data: {e}")
            
            time.sleep(self.update_intervals['solar_activity'])
    
    def _stream_atmospheric_data(self):
        """Stream atmospheric data"""
        while self.running:
            try:
                # Simulate atmospheric data (in production, use weather APIs)
                atmospheric_data = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'global_temperature': np.random.normal(15, 5),
                    'atmospheric_pressure': np.random.normal(1013.25, 10),
                    'humidity': np.random.uniform(30, 90),
                    'wind_speed': np.random.exponential(10),
                    'cloud_cover': np.random.uniform(0, 100),
                    'precipitation': np.random.exponential(2),
                    'visibility': np.random.normal(10, 3),
                    'uv_index': np.random.uniform(0, 11),
                    'air_quality_index': np.random.randint(0, 300),
                    'ozone_level': np.random.normal(300, 50)
                }
                
                self.socketio.emit('atmospheric_data_update', atmospheric_data, room='mission_control')
                self.data_cache['atmospheric_data'] = atmospheric_data
                
            except Exception as e:
                logger.error(f"Error generating atmospheric data: {e}")
            
            time.sleep(self.update_intervals['atmospheric_data'])
    
    def _stream_comprehensive_nasa_data(self):
        """Stream comprehensive NASA data using the NASA API service"""
        while self.running:
            try:
                # Get NEO feed data
                neo_data = self.nasa_service.get_neo_feed()
                if neo_data:
                    self.socketio.emit('comprehensive_neo_data', neo_data, room='mission_control')
                
                # Get Mars weather data
                mars_weather = self.nasa_service.get_mars_weather()
                if mars_weather:
                    self.socketio.emit('mars_weather', mars_weather, room='mission_control')
                
                # Get Earth imagery
                earth_imagery = self.nasa_service.get_earth_imagery(lat=40.7128, lon=-74.0060)
                if earth_imagery:
                    self.socketio.emit('earth_imagery', earth_imagery, room='mission_control')
                
                # Get EPIC images
                epic_images = self.nasa_service.get_epic_images()
                if epic_images:
                    self.socketio.emit('epic_images', epic_images, room='mission_control')
                
                logger.debug("Comprehensive NASA data streamed")
                
            except Exception as e:
                logger.error(f"Error streaming comprehensive NASA data: {e}")
            
            time.sleep(60)  # Update every minute
    
    def _stream_advanced_satellite_tracking(self):
        """Stream advanced satellite tracking data"""
        while self.running:
            try:
                # Get ISS position and telemetry
                iss_data = self.satellite_service.get_iss_position()
                if iss_data:
                    self.socketio.emit('advanced_iss_data', iss_data, room='mission_control')
                
                # Get Starlink constellation data
                starlink_data = self.satellite_service.get_starlink_constellation()
                if starlink_data:
                    self.socketio.emit('starlink_constellation', starlink_data, room='mission_control')
                
                # Get space debris tracking
                debris_data = self.satellite_service.get_space_debris()
                if debris_data:
                    self.socketio.emit('space_debris', debris_data, room='mission_control')
                
                # Get visible satellite passes
                passes_data = self.satellite_service.get_visible_passes(lat=40.7128, lon=-74.0060)
                if passes_data:
                    self.socketio.emit('satellite_passes', passes_data, room='mission_control')
                
                logger.debug("Advanced satellite tracking data streamed")
                
            except Exception as e:
                logger.error(f"Error streaming advanced satellite data: {e}")
            
            time.sleep(30)  # Update every 30 seconds
    
    def _stream_detailed_space_weather(self):
        """Stream detailed space weather data"""
        while self.running:
            try:
                # Get comprehensive space weather
                space_weather = self.space_weather_service.get_space_weather_summary()
                if space_weather:
                    self.socketio.emit('detailed_space_weather', space_weather, room='mission_control')
                
                # Get solar activity
                solar_activity = self.space_weather_service.get_solar_activity()
                if solar_activity:
                    self.socketio.emit('solar_activity_detailed', solar_activity, room='mission_control')
                
                # Get geomagnetic data
                geomagnetic_data = self.space_weather_service.get_geomagnetic_data()
                if geomagnetic_data:
                    self.socketio.emit('geomagnetic_data', geomagnetic_data, room='mission_control')
                
                # Get aurora forecast
                aurora_forecast = self.space_weather_service.get_aurora_forecast()
                if aurora_forecast:
                    self.socketio.emit('aurora_forecast', aurora_forecast, room='mission_control')
                
                logger.debug("Detailed space weather data streamed")
                
            except Exception as e:
                logger.error(f"Error streaming detailed space weather: {e}")
            
            time.sleep(45)  # Update every 45 seconds
    
    def _stream_earth_observation(self):
        """Stream Earth observation data"""
        while self.running:
            try:
                # Get real-time satellite imagery
                satellite_imagery = self.earth_observation_service.get_real_time_imagery()
                if satellite_imagery:
                    self.socketio.emit('satellite_imagery', satellite_imagery, room='mission_control')
                
                # Get environmental indicators
                env_indicators = self.earth_observation_service.get_environmental_indicators()
                if env_indicators:
                    self.socketio.emit('environmental_indicators', env_indicators, room='mission_control')
                
                # Get natural disaster monitoring
                disaster_data = self.earth_observation_service.get_natural_disasters()
                if disaster_data:
                    self.socketio.emit('natural_disasters', disaster_data, room='mission_control')
                
                logger.debug("Earth observation data streamed")
                
            except Exception as e:
                logger.error(f"Error streaming Earth observation data: {e}")
            
            time.sleep(120)  # Update every 2 minutes
    
    def _stream_mission_control_telemetry(self):
        """Stream mission control telemetry data"""
        while self.running:
            try:
                # Generate realistic mission control telemetry
                telemetry = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'spacecraft': {
                        'power': {
                            'solar_array_voltage': 28.5 + np.random.normal(0, 0.5),
                            'battery_charge': 85 + np.random.normal(0, 2),
                            'power_consumption': 450 + np.random.normal(0, 20)
                        },
                        'thermal': {
                            'cpu_temperature': 45 + np.random.normal(0, 3),
                            'battery_temperature': 20 + np.random.normal(0, 2),
                            'external_temperature': -150 + np.random.normal(0, 10)
                        },
                        'attitude': {
                            'roll': np.random.uniform(-180, 180),
                            'pitch': np.random.uniform(-90, 90),
                            'yaw': np.random.uniform(-180, 180),
                            'angular_velocity': {
                                'x': np.random.normal(0, 0.1),
                                'y': np.random.normal(0, 0.1),
                                'z': np.random.normal(0, 0.1)
                            }
                        },
                        'communication': {
                            'signal_strength': -85 + np.random.normal(0, 5),
                            'data_rate': 2048 + np.random.normal(0, 100),
                            'uplink_status': 'NOMINAL',
                            'downlink_status': 'NOMINAL'
                        }
                    },
                    'ground_station': {
                        'antenna_elevation': 45 + np.random.normal(0, 5),
                        'antenna_azimuth': 180 + np.random.normal(0, 10),
                        'weather_conditions': 'CLEAR',
                        'operator_status': 'ON_DUTY'
                    }
                }
                
                self.socketio.emit('mission_control_telemetry', telemetry, room='mission_control')
                logger.debug("Mission control telemetry streamed")
                
            except Exception as e:
                logger.error(f"Error streaming mission control telemetry: {e}")
            
            time.sleep(5)  # Update every 5 seconds for real-time feel
    
    def _stream_orbital_mechanics(self):
        """Stream orbital mechanics calculations"""
        while self.running:
            try:
                # Generate realistic orbital mechanics data
                orbital_data = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'orbital_elements': {
                        'semi_major_axis': 6800 + np.random.normal(0, 10),  # km
                        'eccentricity': 0.001 + np.random.normal(0, 0.0001),
                        'inclination': 51.6 + np.random.normal(0, 0.1),  # degrees
                        'longitude_ascending_node': np.random.uniform(0, 360),
                        'argument_of_perigee': np.random.uniform(0, 360),
                        'true_anomaly': np.random.uniform(0, 360)
                    },
                    'position': {
                        'x': np.random.normal(0, 6800),  # km
                        'y': np.random.normal(0, 6800),
                        'z': np.random.normal(0, 6800)
                    },
                    'velocity': {
                        'x': np.random.normal(0, 7.8),  # km/s
                        'y': np.random.normal(0, 7.8),
                        'z': np.random.normal(0, 7.8)
                    },
                    'orbital_period': 90 + np.random.normal(0, 2),  # minutes
                    'altitude': 400 + np.random.normal(0, 20),  # km
                    'ground_track': {
                        'latitude': np.random.uniform(-90, 90),
                        'longitude': np.random.uniform(-180, 180)
                    }
                }
                
                self.socketio.emit('orbital_mechanics', orbital_data, room='mission_control')
                logger.debug("Orbital mechanics data streamed")
                
            except Exception as e:
                logger.error(f"Error streaming orbital mechanics: {e}")
            
            time.sleep(10)  # Update every 10 seconds
    
    def _stream_real_time_events(self):
        """Stream real-time space events and alerts"""
        while self.running:
            try:
                # Generate realistic space events
                events = []
                
                # Random event generation
                if np.random.random() < 0.1:  # 10% chance per cycle
                    event_types = [
                        'SATELLITE_MANEUVER',
                        'SPACE_DEBRIS_ALERT',
                        'SOLAR_FLARE_DETECTED',
                        'ASTEROID_APPROACH',
                        'ISS_REBOOST',
                        'COMMUNICATION_ANOMALY',
                        'ORBITAL_DECAY_WARNING'
                    ]
                    
                    event = {
                        'id': f"EVT_{int(time.time())}",
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'type': np.random.choice(event_types),
                        'severity': np.random.choice(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
                        'description': f"Real-time space event detected at {datetime.now(timezone.utc).strftime('%H:%M:%S')} UTC",
                        'coordinates': {
                            'latitude': np.random.uniform(-90, 90),
                            'longitude': np.random.uniform(-180, 180),
                            'altitude': np.random.uniform(200, 2000)
                        },
                        'duration_estimate': np.random.randint(5, 120),  # minutes
                        'affected_systems': np.random.choice([
                            ['GPS', 'COMMUNICATION'],
                            ['ISS', 'SATELLITES'],
                            ['GROUND_STATIONS'],
                            ['NAVIGATION', 'TIMING']
                        ])
                    }
                    events.append(event)
                
                if events:
                    self.socketio.emit('real_time_events', {'events': events}, room='mission_control')
                    logger.info(f"Real-time events streamed: {len(events)} events")
                
            except Exception as e:
                logger.error(f"Error streaming real-time events: {e}")
            
            time.sleep(15)  # Check for events every 15 seconds
    
    def _calculate_iss_orbital_params(self, iss_data: Dict) -> Dict:
        """Calculate additional ISS orbital parameters"""
        try:
            # Calculate orbital velocity and period
            earth_radius = 6371  # km
            altitude = iss_data['altitude']
            orbital_radius = earth_radius + altitude
            
            # Gravitational parameter for Earth
            mu = 398600.4418  # km³/s²
            
            # Orbital velocity
            velocity = np.sqrt(mu / orbital_radius)
            
            # Orbital period
            period = 2 * np.pi * np.sqrt(orbital_radius**3 / mu) / 60  # minutes
            
            return {
                'calculated_velocity': velocity * 3.6,  # km/h
                'calculated_period': period,
                'orbital_radius': orbital_radius,
                'apogee': altitude + 10,  # Approximate
                'perigee': altitude - 10   # Approximate
            }
        except Exception as e:
            logger.error(f"Error calculating ISS orbital parameters: {e}")
            return {}
    
    def _classify_geomagnetic_activity(self, kp_index: float) -> str:
        """Classify geomagnetic activity based on Kp index"""
        if kp_index < 1:
            return 'quiet'
        elif kp_index < 3:
            return 'unsettled'
        elif kp_index < 5:
            return 'active'
        elif kp_index < 7:
            return 'minor storm'
        elif kp_index < 8:
            return 'moderate storm'
        elif kp_index < 9:
            return 'strong storm'
        else:
            return 'severe storm'
    
    def _assess_seismic_activity(self, earthquakes: List[Dict]) -> str:
        """Assess global seismic activity level"""
        if not earthquakes:
            return 'quiet'
        
        max_magnitude = max(eq.get('magnitude', 0) for eq in earthquakes)
        total_events = len(earthquakes)
        
        if max_magnitude >= 7.0 or total_events > 15:
            return 'high'
        elif max_magnitude >= 5.0 or total_events > 10:
            return 'moderate'
        else:
            return 'low'
    
    def get_cached_data(self, data_type: str) -> Optional[Dict]:
        """Get cached data for a specific type"""
        return self.data_cache.get(data_type)
    
    def get_all_cached_data(self) -> Dict:
        """Get all cached data"""
        return self.data_cache.copy()

# WebSocket event handlers
def setup_websocket_handlers(socketio: SocketIO, data_streamer: RealTimeDataStreamer):
    """Setup WebSocket event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        logger.info(f"Client connected: {request.sid}")
        emit('connection_status', {'status': 'connected', 'timestamp': datetime.now(timezone.utc).isoformat()})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        logger.info(f"Client disconnected: {request.sid}")
    
    @socketio.on('join_mission_control')
    def handle_join_mission_control():
        join_room('mission_control')
        logger.info(f"Client {request.sid} joined mission control room")
        
        # Send current cached data to new client
        cached_data = data_streamer.get_all_cached_data()
        for data_type, data in cached_data.items():
            emit(f'{data_type}_update', data)
        
        emit('room_status', {'room': 'mission_control', 'status': 'joined'})
    
    @socketio.on('leave_mission_control')
    def handle_leave_mission_control():
        leave_room('mission_control')
        logger.info(f"Client {request.sid} left mission control room")
        emit('room_status', {'room': 'mission_control', 'status': 'left'})
    
    @socketio.on('request_data_update')
    def handle_data_request(data):
        data_type = data.get('type', 'all')
        if data_type == 'all':
            cached_data = data_streamer.get_all_cached_data()
            emit('bulk_data_update', cached_data)
        else:
            cached_data = data_streamer.get_cached_data(data_type)
            if cached_data:
                emit(f'{data_type}_update', cached_data)
    
    @socketio.on('update_stream_interval')
    def handle_interval_update(data):
        stream_type = data.get('stream_type')
        interval = data.get('interval', 30)
        
        if stream_type in data_streamer.update_intervals:
            data_streamer.update_intervals[stream_type] = max(5, interval)  # Minimum 5 seconds
            logger.info(f"Updated {stream_type} interval to {interval} seconds")
            emit('interval_updated', {'stream_type': stream_type, 'interval': interval})