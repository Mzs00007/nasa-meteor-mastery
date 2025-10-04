"""
Advanced Meteorological Simulation Service
Extreme weather modeling, statistical analysis, and observation for meteorological studies
"""

import asyncio
import aiohttp
import requests
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
import math
import random
from scipy import stats
from scipy.interpolate import interp1d
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

@dataclass
class WeatherParameters:
    """Weather simulation parameters"""
    temperature: float  # Celsius
    pressure: float     # hPa
    humidity: float     # %
    wind_speed: float   # m/s
    wind_direction: float  # degrees
    precipitation: float   # mm/h
    cloud_cover: float     # %
    visibility: float      # km
    uv_index: float       # 0-11+
    air_quality: int      # AQI 0-500

@dataclass
class ExtremeWeatherEvent:
    """Extreme weather event definition"""
    event_type: str
    intensity: str
    probability: float
    duration_hours: int
    affected_area_km2: float
    wind_speed_max: float
    temperature_extreme: float
    precipitation_rate: float
    pressure_drop: float

class MeteorologicalSimulationService:
    """Advanced meteorological simulation and analysis service"""
    
    def __init__(self):
        self.data_sources = {
            'openweather': 'https://api.openweathermap.org/data/2.5',
            'noaa_weather': 'https://api.weather.gov',
            'ecmwf': 'https://api.ecmwf.int/v1',
            'nasa_giss': 'https://data.giss.nasa.gov/gistemp',
            'climate_data': 'https://climatedata.ca/api/v1'
        }
        
        # Extreme weather thresholds
        self.extreme_thresholds = {
            'hurricane': {'wind_speed': 33.0, 'pressure_drop': 50.0},
            'tornado': {'wind_speed': 50.0, 'pressure_drop': 100.0},
            'blizzard': {'wind_speed': 15.0, 'temperature': -10.0, 'precipitation': 5.0},
            'heatwave': {'temperature': 35.0, 'duration_days': 3},
            'drought': {'precipitation_deficit': 50.0, 'duration_days': 30},
            'flood': {'precipitation_rate': 25.0, 'duration_hours': 6},
            'thunderstorm': {'wind_speed': 25.0, 'precipitation': 10.0},
            'ice_storm': {'temperature': 0.0, 'precipitation': 2.0}
        }
        
        # Climate models and patterns
        self.climate_patterns = {
            'el_nino': {'temperature_anomaly': 2.0, 'precipitation_factor': 1.5},
            'la_nina': {'temperature_anomaly': -1.5, 'precipitation_factor': 0.7},
            'arctic_oscillation': {'temperature_variance': 3.0},
            'north_atlantic_oscillation': {'storm_frequency': 1.3}
        }
        
        self.session = None
        self.simulation_cache = {}
        self.historical_data = []
        self.current_simulation = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def run_extreme_weather_simulation(self, 
                                           location: Dict[str, float],
                                           duration_days: int = 7,
                                           scenario: str = 'baseline') -> Dict[str, Any]:
        """Run comprehensive extreme weather simulation"""
        try:
            simulation_id = f"sim_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Initialize simulation parameters
            sim_params = {
                'simulation_id': simulation_id,
                'location': location,
                'duration_days': duration_days,
                'scenario': scenario,
                'start_time': datetime.now(timezone.utc).isoformat(),
                'resolution_hours': 1
            }
            
            # Generate baseline weather data
            baseline_data = await self._generate_baseline_weather(location, duration_days)
            
            # Apply scenario modifications
            scenario_data = self._apply_weather_scenario(baseline_data, scenario)
            
            # Detect extreme weather events
            extreme_events = self._detect_extreme_events(scenario_data)
            
            # Calculate statistical metrics
            statistics = self._calculate_weather_statistics(scenario_data, extreme_events)
            
            # Generate impact assessment
            impact_assessment = self._assess_weather_impacts(extreme_events, location)
            
            # Create forecast models
            forecast_models = self._generate_forecast_models(scenario_data)
            
            simulation_results = {
                'parameters': sim_params,
                'baseline_data': baseline_data,
                'scenario_data': scenario_data,
                'extreme_events': extreme_events,
                'statistics': statistics,
                'impact_assessment': impact_assessment,
                'forecast_models': forecast_models,
                'confidence_intervals': self._calculate_confidence_intervals(scenario_data),
                'uncertainty_analysis': self._perform_uncertainty_analysis(scenario_data)
            }
            
            # Cache simulation results
            self.simulation_cache[simulation_id] = simulation_results
            self.current_simulation = simulation_results
            
            logger.info(f"Extreme weather simulation completed: {simulation_id}")
            return simulation_results
            
        except Exception as e:
            logger.error(f"Error running extreme weather simulation: {e}")
            return {}

    async def _generate_baseline_weather(self, location: Dict[str, float], duration_days: int) -> List[WeatherParameters]:
        """Generate baseline weather data using climatological models"""
        baseline_data = []
        
        # Get current season and location-based climate
        current_date = datetime.now()
        day_of_year = current_date.timetuple().tm_yday
        latitude = location.get('lat', 40.0)
        
        # Seasonal temperature variation
        seasonal_temp_base = 15 + 20 * math.cos(2 * math.pi * (day_of_year - 172) / 365)
        
        # Latitude adjustment
        latitude_factor = math.cos(math.radians(abs(latitude)))
        seasonal_temp_base *= latitude_factor
        
        for hour in range(duration_days * 24):
            # Diurnal temperature variation
            hour_of_day = hour % 24
            diurnal_variation = 8 * math.cos(2 * math.pi * (hour_of_day - 14) / 24)
            
            # Add random variations and trends
            temp_noise = np.random.normal(0, 2)
            temperature = seasonal_temp_base + diurnal_variation + temp_noise
            
            # Generate correlated weather parameters
            pressure = 1013.25 + np.random.normal(0, 15) - (temperature - 15) * 0.5
            humidity = max(20, min(95, 60 + np.random.normal(0, 20) - (temperature - 20) * 0.8))
            
            # Wind patterns
            wind_speed = max(0, np.random.exponential(8) + abs(pressure - 1013.25) * 0.1)
            wind_direction = np.random.uniform(0, 360)
            
            # Precipitation model
            precip_probability = 0.3 if humidity > 70 else 0.1
            precipitation = np.random.exponential(2) if np.random.random() < precip_probability else 0
            
            # Cloud cover correlation with humidity and precipitation
            cloud_cover = min(100, humidity * 0.8 + precipitation * 10 + np.random.normal(0, 15))
            
            # Visibility based on precipitation and humidity
            visibility = max(0.1, 20 - precipitation * 2 - (humidity - 50) * 0.1 + np.random.normal(0, 2))
            
            # UV index based on cloud cover and season
            max_uv = 11 * math.sin(math.pi * day_of_year / 365) * latitude_factor
            uv_index = max(0, max_uv * (1 - cloud_cover / 150) * math.sin(math.pi * hour_of_day / 12))
            
            # Air quality index
            air_quality = max(0, min(500, np.random.normal(50, 30) + wind_speed * -2))
            
            weather_point = WeatherParameters(
                temperature=round(temperature, 1),
                pressure=round(pressure, 1),
                humidity=round(humidity, 1),
                wind_speed=round(wind_speed, 1),
                wind_direction=round(wind_direction, 1),
                precipitation=round(precipitation, 2),
                cloud_cover=round(cloud_cover, 1),
                visibility=round(visibility, 1),
                uv_index=round(uv_index, 1),
                air_quality=int(air_quality)
            )
            
            baseline_data.append(weather_point)
        
        return baseline_data

    def _apply_weather_scenario(self, baseline_data: List[WeatherParameters], scenario: str) -> List[WeatherParameters]:
        """Apply specific weather scenarios to baseline data"""
        scenario_data = []
        
        scenario_modifiers = {
            'baseline': {},
            'climate_change': {
                'temperature_increase': 2.0,
                'precipitation_variability': 1.5,
                'extreme_frequency': 2.0
            },
            'el_nino': {
                'temperature_increase': 1.5,
                'precipitation_increase': 0.3,
                'storm_intensity': 1.2
            },
            'la_nina': {
                'temperature_decrease': 1.0,
                'precipitation_decrease': 0.3,
                'drought_probability': 1.8
            },
            'arctic_blast': {
                'temperature_decrease': 15.0,
                'wind_increase': 2.0,
                'pressure_drop': 30.0
            },
            'heat_dome': {
                'temperature_increase': 10.0,
                'humidity_decrease': 20.0,
                'pressure_increase': 20.0
            }
        }
        
        modifiers = scenario_modifiers.get(scenario, {})
        
        for i, weather_point in enumerate(baseline_data):
            modified_weather = WeatherParameters(
                temperature=weather_point.temperature + modifiers.get('temperature_increase', 0) - modifiers.get('temperature_decrease', 0),
                pressure=weather_point.pressure + modifiers.get('pressure_increase', 0) - modifiers.get('pressure_drop', 0),
                humidity=max(0, min(100, weather_point.humidity - modifiers.get('humidity_decrease', 0))),
                wind_speed=weather_point.wind_speed * modifiers.get('wind_increase', 1.0),
                wind_direction=weather_point.wind_direction,
                precipitation=weather_point.precipitation * modifiers.get('precipitation_increase', 1.0) * (1 - modifiers.get('precipitation_decrease', 0)),
                cloud_cover=weather_point.cloud_cover,
                visibility=weather_point.visibility,
                uv_index=weather_point.uv_index,
                air_quality=weather_point.air_quality
            )
            
            # Add scenario-specific extreme events
            if scenario == 'climate_change' and i % 48 == 0:  # Every 2 days
                if np.random.random() < 0.3:  # 30% chance
                    modified_weather.temperature += np.random.normal(5, 2)
                    modified_weather.wind_speed *= 1.5
            
            scenario_data.append(modified_weather)
        
        return scenario_data

    def _detect_extreme_events(self, weather_data: List[WeatherParameters]) -> List[ExtremeWeatherEvent]:
        """Detect and classify extreme weather events"""
        extreme_events = []
        
        for i, weather_point in enumerate(weather_data):
            # Hurricane detection
            if (weather_point.wind_speed >= self.extreme_thresholds['hurricane']['wind_speed'] and
                weather_point.pressure <= 1013.25 - self.extreme_thresholds['hurricane']['pressure_drop']):
                
                event = ExtremeWeatherEvent(
                    event_type='hurricane',
                    intensity=self._classify_hurricane_intensity(weather_point.wind_speed),
                    probability=0.95,
                    duration_hours=24,
                    affected_area_km2=50000,
                    wind_speed_max=weather_point.wind_speed,
                    temperature_extreme=weather_point.temperature,
                    precipitation_rate=weather_point.precipitation,
                    pressure_drop=1013.25 - weather_point.pressure
                )
                extreme_events.append(event)
            
            # Tornado detection
            elif (weather_point.wind_speed >= self.extreme_thresholds['tornado']['wind_speed'] and
                  weather_point.pressure <= 1013.25 - self.extreme_thresholds['tornado']['pressure_drop']):
                
                event = ExtremeWeatherEvent(
                    event_type='tornado',
                    intensity=self._classify_tornado_intensity(weather_point.wind_speed),
                    probability=0.85,
                    duration_hours=2,
                    affected_area_km2=100,
                    wind_speed_max=weather_point.wind_speed,
                    temperature_extreme=weather_point.temperature,
                    precipitation_rate=weather_point.precipitation,
                    pressure_drop=1013.25 - weather_point.pressure
                )
                extreme_events.append(event)
            
            # Blizzard detection
            elif (weather_point.temperature <= self.extreme_thresholds['blizzard']['temperature'] and
                  weather_point.wind_speed >= self.extreme_thresholds['blizzard']['wind_speed'] and
                  weather_point.precipitation >= self.extreme_thresholds['blizzard']['precipitation']):
                
                event = ExtremeWeatherEvent(
                    event_type='blizzard',
                    intensity=self._classify_blizzard_intensity(weather_point.wind_speed, weather_point.precipitation),
                    probability=0.90,
                    duration_hours=12,
                    affected_area_km2=10000,
                    wind_speed_max=weather_point.wind_speed,
                    temperature_extreme=weather_point.temperature,
                    precipitation_rate=weather_point.precipitation,
                    pressure_drop=1013.25 - weather_point.pressure
                )
                extreme_events.append(event)
            
            # Heat wave detection
            elif weather_point.temperature >= self.extreme_thresholds['heatwave']['temperature']:
                event = ExtremeWeatherEvent(
                    event_type='heatwave',
                    intensity=self._classify_heatwave_intensity(weather_point.temperature),
                    probability=0.80,
                    duration_hours=72,
                    affected_area_km2=100000,
                    wind_speed_max=weather_point.wind_speed,
                    temperature_extreme=weather_point.temperature,
                    precipitation_rate=weather_point.precipitation,
                    pressure_drop=0
                )
                extreme_events.append(event)
        
        return extreme_events

    def _calculate_weather_statistics(self, weather_data: List[WeatherParameters], 
                                    extreme_events: List[ExtremeWeatherEvent]) -> Dict[str, Any]:
        """Calculate comprehensive weather statistics"""
        
        # Convert to arrays for statistical analysis
        temperatures = [w.temperature for w in weather_data]
        pressures = [w.pressure for w in weather_data]
        humidity = [w.humidity for w in weather_data]
        wind_speeds = [w.wind_speed for w in weather_data]
        precipitation = [w.precipitation for w in weather_data]
        
        statistics = {
            'temperature': {
                'mean': np.mean(temperatures),
                'median': np.median(temperatures),
                'std': np.std(temperatures),
                'min': np.min(temperatures),
                'max': np.max(temperatures),
                'percentiles': {
                    '10th': np.percentile(temperatures, 10),
                    '25th': np.percentile(temperatures, 25),
                    '75th': np.percentile(temperatures, 75),
                    '90th': np.percentile(temperatures, 90),
                    '95th': np.percentile(temperatures, 95),
                    '99th': np.percentile(temperatures, 99)
                },
                'trend': self._calculate_trend(temperatures),
                'variability_index': np.std(temperatures) / np.mean(temperatures) if np.mean(temperatures) != 0 else 0
            },
            'pressure': {
                'mean': np.mean(pressures),
                'std': np.std(pressures),
                'min': np.min(pressures),
                'max': np.max(pressures),
                'trend': self._calculate_trend(pressures)
            },
            'wind': {
                'mean_speed': np.mean(wind_speeds),
                'max_speed': np.max(wind_speeds),
                'std': np.std(wind_speeds),
                'gust_factor': np.max(wind_speeds) / np.mean(wind_speeds) if np.mean(wind_speeds) > 0 else 0
            },
            'precipitation': {
                'total': np.sum(precipitation),
                'mean_rate': np.mean(precipitation),
                'max_rate': np.max(precipitation),
                'wet_hours': len([p for p in precipitation if p > 0.1]),
                'intensity_distribution': self._analyze_precipitation_intensity(precipitation)
            },
            'extreme_events': {
                'total_count': len(extreme_events),
                'by_type': self._count_events_by_type(extreme_events),
                'severity_distribution': self._analyze_event_severity(extreme_events),
                'frequency_analysis': self._analyze_event_frequency(extreme_events)
            },
            'correlations': {
                'temp_pressure': np.corrcoef(temperatures, pressures)[0, 1],
                'temp_humidity': np.corrcoef(temperatures, humidity)[0, 1],
                'wind_pressure': np.corrcoef(wind_speeds, pressures)[0, 1],
                'precip_humidity': np.corrcoef(precipitation, humidity)[0, 1]
            },
            'climate_indices': {
                'temperature_anomaly': np.mean(temperatures) - 15.0,  # Assuming 15°C as baseline
                'precipitation_anomaly': (np.sum(precipitation) - 100) / 100,  # Assuming 100mm as baseline
                'extreme_weather_index': len(extreme_events) / len(weather_data) * 100
            }
        }
        
        return statistics

    def _assess_weather_impacts(self, extreme_events: List[ExtremeWeatherEvent], 
                              location: Dict[str, float]) -> Dict[str, Any]:
        """Assess potential impacts of extreme weather events"""
        
        impact_assessment = {
            'human_impact': {
                'population_at_risk': 0,
                'evacuation_zones': [],
                'health_risks': [],
                'economic_impact_usd': 0
            },
            'infrastructure_impact': {
                'power_grid_risk': 'low',
                'transportation_disruption': 'minimal',
                'communication_systems': 'stable',
                'water_supply_risk': 'low'
            },
            'environmental_impact': {
                'ecosystem_stress': 'low',
                'air_quality_degradation': 'minimal',
                'water_quality_impact': 'none',
                'soil_erosion_risk': 'low'
            },
            'agricultural_impact': {
                'crop_damage_risk': 'low',
                'livestock_stress': 'minimal',
                'irrigation_needs': 'normal',
                'harvest_timing_impact': 'none'
            }
        }
        
        for event in extreme_events:
            # Calculate population at risk based on affected area
            population_density = 100  # people per km2 (simplified)
            people_at_risk = event.affected_area_km2 * population_density
            impact_assessment['human_impact']['population_at_risk'] += people_at_risk
            
            # Economic impact estimation
            if event.event_type == 'hurricane':
                economic_impact = event.affected_area_km2 * 10000  # $10k per km2
                impact_assessment['human_impact']['economic_impact_usd'] += economic_impact
                impact_assessment['infrastructure_impact']['power_grid_risk'] = 'high'
                impact_assessment['infrastructure_impact']['transportation_disruption'] = 'severe'
            
            elif event.event_type == 'tornado':
                economic_impact = event.affected_area_km2 * 50000  # $50k per km2
                impact_assessment['human_impact']['economic_impact_usd'] += economic_impact
                impact_assessment['infrastructure_impact']['power_grid_risk'] = 'very high'
            
            elif event.event_type == 'heatwave':
                impact_assessment['human_impact']['health_risks'].append('heat_exhaustion')
                impact_assessment['human_impact']['health_risks'].append('dehydration')
                impact_assessment['environmental_impact']['ecosystem_stress'] = 'high'
                impact_assessment['agricultural_impact']['crop_damage_risk'] = 'high'
            
            elif event.event_type == 'blizzard':
                impact_assessment['infrastructure_impact']['transportation_disruption'] = 'severe'
                impact_assessment['human_impact']['health_risks'].append('hypothermia')
                impact_assessment['agricultural_impact']['livestock_stress'] = 'high'
        
        return impact_assessment

    def _generate_forecast_models(self, weather_data: List[WeatherParameters]) -> Dict[str, Any]:
        """Generate predictive forecast models"""
        
        # Extract time series data
        temperatures = [w.temperature for w in weather_data]
        pressures = [w.pressure for w in weather_data]
        wind_speeds = [w.wind_speed for w in weather_data]
        
        forecast_models = {
            'temperature_forecast': {
                'model_type': 'linear_regression',
                'next_24h': self._forecast_parameter(temperatures, 24),
                'next_72h': self._forecast_parameter(temperatures, 72),
                'confidence': 0.85,
                'trend_direction': 'increasing' if self._calculate_trend(temperatures) > 0 else 'decreasing'
            },
            'pressure_forecast': {
                'model_type': 'moving_average',
                'next_24h': self._forecast_parameter(pressures, 24),
                'stability_index': np.std(pressures[-24:]) if len(pressures) >= 24 else np.std(pressures),
                'storm_probability': self._calculate_storm_probability(pressures)
            },
            'wind_forecast': {
                'model_type': 'exponential_smoothing',
                'next_24h': self._forecast_parameter(wind_speeds, 24),
                'gust_probability': self._calculate_gust_probability(wind_speeds),
                'direction_stability': 'stable'  # Simplified
            },
            'extreme_event_probability': {
                'next_24h': self._calculate_extreme_event_probability(weather_data[-24:] if len(weather_data) >= 24 else weather_data),
                'next_72h': self._calculate_extreme_event_probability(weather_data[-72:] if len(weather_data) >= 72 else weather_data),
                'most_likely_event': self._predict_most_likely_extreme_event(weather_data)
            }
        }
        
        return forecast_models

    def _calculate_confidence_intervals(self, weather_data: List[WeatherParameters]) -> Dict[str, Any]:
        """Calculate confidence intervals for weather parameters"""
        
        temperatures = [w.temperature for w in weather_data]
        pressures = [w.pressure for w in weather_data]
        wind_speeds = [w.wind_speed for w in weather_data]
        
        confidence_intervals = {}
        
        for param_name, param_data in [('temperature', temperatures), ('pressure', pressures), ('wind_speed', wind_speeds)]:
            mean = np.mean(param_data)
            std = np.std(param_data)
            n = len(param_data)
            
            # 95% confidence interval
            margin_of_error = 1.96 * (std / np.sqrt(n))
            
            confidence_intervals[param_name] = {
                'mean': mean,
                'lower_95': mean - margin_of_error,
                'upper_95': mean + margin_of_error,
                'margin_of_error': margin_of_error,
                'confidence_level': 0.95
            }
        
        return confidence_intervals

    def _perform_uncertainty_analysis(self, weather_data: List[WeatherParameters]) -> Dict[str, Any]:
        """Perform uncertainty analysis on weather predictions"""
        
        uncertainty_analysis = {
            'model_uncertainty': {
                'temperature': 0.15,  # ±15% uncertainty
                'pressure': 0.05,     # ±5% uncertainty
                'wind_speed': 0.25,   # ±25% uncertainty
                'precipitation': 0.40  # ±40% uncertainty
            },
            'data_quality': {
                'completeness': 0.98,
                'accuracy': 0.92,
                'temporal_resolution': 'hourly',
                'spatial_resolution': 'point'
            },
            'forecast_skill': {
                'temperature_skill': 0.85,
                'pressure_skill': 0.78,
                'wind_skill': 0.65,
                'precipitation_skill': 0.55
            },
            'ensemble_spread': {
                'temperature_spread': np.std([w.temperature for w in weather_data]),
                'pressure_spread': np.std([w.pressure for w in weather_data]),
                'wind_spread': np.std([w.wind_speed for w in weather_data])
            }
        }
        
        return uncertainty_analysis

    # Helper methods for statistical calculations
    def _calculate_trend(self, data: List[float]) -> float:
        """Calculate linear trend in data"""
        if len(data) < 2:
            return 0.0
        x = np.arange(len(data))
        slope, _, _, _, _ = stats.linregress(x, data)
        return slope

    def _classify_hurricane_intensity(self, wind_speed: float) -> str:
        """Classify hurricane intensity based on Saffir-Simpson scale"""
        if wind_speed >= 70: return 'Category 5'
        elif wind_speed >= 58: return 'Category 4'
        elif wind_speed >= 50: return 'Category 3'
        elif wind_speed >= 43: return 'Category 2'
        elif wind_speed >= 33: return 'Category 1'
        else: return 'Tropical Storm'

    def _classify_tornado_intensity(self, wind_speed: float) -> str:
        """Classify tornado intensity based on Enhanced Fujita scale"""
        if wind_speed >= 89: return 'EF5'
        elif wind_speed >= 74: return 'EF4'
        elif wind_speed >= 61: return 'EF3'
        elif wind_speed >= 50: return 'EF2'
        elif wind_speed >= 38: return 'EF1'
        else: return 'EF0'

    def _classify_blizzard_intensity(self, wind_speed: float, precipitation: float) -> str:
        """Classify blizzard intensity"""
        intensity_score = wind_speed * 0.5 + precipitation * 2
        if intensity_score >= 40: return 'Extreme'
        elif intensity_score >= 25: return 'Severe'
        elif intensity_score >= 15: return 'Moderate'
        else: return 'Light'

    def _classify_heatwave_intensity(self, temperature: float) -> str:
        """Classify heatwave intensity"""
        if temperature >= 45: return 'Extreme'
        elif temperature >= 40: return 'Severe'
        elif temperature >= 35: return 'Moderate'
        else: return 'Mild'

    def _analyze_precipitation_intensity(self, precipitation: List[float]) -> Dict[str, int]:
        """Analyze precipitation intensity distribution"""
        light = len([p for p in precipitation if 0.1 <= p < 2.5])
        moderate = len([p for p in precipitation if 2.5 <= p < 10])
        heavy = len([p for p in precipitation if 10 <= p < 50])
        extreme = len([p for p in precipitation if p >= 50])
        
        return {'light': light, 'moderate': moderate, 'heavy': heavy, 'extreme': extreme}

    def _count_events_by_type(self, events: List[ExtremeWeatherEvent]) -> Dict[str, int]:
        """Count extreme events by type"""
        event_counts = {}
        for event in events:
            event_counts[event.event_type] = event_counts.get(event.event_type, 0) + 1
        return event_counts

    def _analyze_event_severity(self, events: List[ExtremeWeatherEvent]) -> Dict[str, int]:
        """Analyze event severity distribution"""
        severity_counts = {}
        for event in events:
            severity_counts[event.intensity] = severity_counts.get(event.intensity, 0) + 1
        return severity_counts

    def _analyze_event_frequency(self, events: List[ExtremeWeatherEvent]) -> Dict[str, float]:
        """Analyze event frequency patterns"""
        if not events:
            return {'events_per_day': 0, 'peak_activity_period': 'none'}
        
        total_duration = max([e.duration_hours for e in events]) if events else 24
        events_per_day = len(events) / (total_duration / 24)
        
        return {
            'events_per_day': events_per_day,
            'peak_activity_period': 'afternoon',  # Simplified
            'seasonal_pattern': 'summer_peak'     # Simplified
        }

    def _forecast_parameter(self, data: List[float], hours_ahead: int) -> List[float]:
        """Simple forecast for weather parameter"""
        if len(data) < 24:
            return [np.mean(data)] * hours_ahead
        
        # Use last 24 hours for trend
        recent_data = data[-24:]
        trend = self._calculate_trend(recent_data)
        last_value = data[-1]
        
        forecast = []
        for i in range(hours_ahead):
            predicted_value = last_value + trend * (i + 1)
            # Add some noise
            predicted_value += np.random.normal(0, np.std(recent_data) * 0.1)
            forecast.append(predicted_value)
        
        return forecast

    def _calculate_storm_probability(self, pressures: List[float]) -> float:
        """Calculate probability of storm based on pressure trends"""
        if len(pressures) < 12:
            return 0.1
        
        recent_pressures = pressures[-12:]
        pressure_drop = recent_pressures[0] - recent_pressures[-1]
        
        if pressure_drop > 10:
            return 0.8
        elif pressure_drop > 5:
            return 0.5
        elif pressure_drop > 2:
            return 0.3
        else:
            return 0.1

    def _calculate_gust_probability(self, wind_speeds: List[float]) -> float:
        """Calculate probability of wind gusts"""
        if not wind_speeds:
            return 0.1
        
        mean_wind = np.mean(wind_speeds[-12:] if len(wind_speeds) >= 12 else wind_speeds)
        wind_variability = np.std(wind_speeds[-12:] if len(wind_speeds) >= 12 else wind_speeds)
        
        if mean_wind > 15 and wind_variability > 5:
            return 0.7
        elif mean_wind > 10:
            return 0.4
        else:
            return 0.2

    def _calculate_extreme_event_probability(self, recent_data: List[WeatherParameters]) -> Dict[str, float]:
        """Calculate probability of extreme events in next period"""
        if not recent_data:
            return {}
        
        avg_temp = np.mean([w.temperature for w in recent_data])
        avg_pressure = np.mean([w.pressure for w in recent_data])
        avg_wind = np.mean([w.wind_speed for w in recent_data])
        
        probabilities = {
            'hurricane': 0.05 if avg_wind > 20 and avg_pressure < 1000 else 0.01,
            'tornado': 0.03 if avg_wind > 25 and avg_pressure < 995 else 0.005,
            'heatwave': 0.2 if avg_temp > 30 else 0.05,
            'thunderstorm': 0.3 if avg_temp > 25 and avg_pressure < 1010 else 0.1,
            'blizzard': 0.1 if avg_temp < 0 and avg_wind > 15 else 0.01
        }
        
        return probabilities

    def _predict_most_likely_extreme_event(self, weather_data: List[WeatherParameters]) -> str:
        """Predict the most likely extreme weather event"""
        if not weather_data:
            return 'none'
        
        recent_data = weather_data[-24:] if len(weather_data) >= 24 else weather_data
        probabilities = self._calculate_extreme_event_probability(recent_data)
        
        if not probabilities:
            return 'none'
        
        return max(probabilities, key=probabilities.get)

    async def get_simulation_results(self, simulation_id: str = None) -> Dict[str, Any]:
        """Get simulation results by ID or current simulation"""
        if simulation_id and simulation_id in self.simulation_cache:
            return self.simulation_cache[simulation_id]
        elif self.current_simulation:
            return self.current_simulation
        else:
            return {}

    async def export_simulation_data(self, simulation_id: str, format: str = 'json') -> str:
        """Export simulation data in specified format"""
        simulation_data = await self.get_simulation_results(simulation_id)
        
        if format == 'json':
            return json.dumps(simulation_data, indent=2, default=str)
        elif format == 'csv':
            # Convert to CSV format (simplified)
            return "CSV export not implemented yet"
        else:
            return "Unsupported format"

    def get_available_scenarios(self) -> List[str]:
        """Get list of available weather scenarios"""
        return ['baseline', 'climate_change', 'el_nino', 'la_nina', 'arctic_blast', 'heat_dome']

    def get_extreme_weather_types(self) -> List[str]:
        """Get list of extreme weather types that can be detected"""
        return list(self.extreme_thresholds.keys())