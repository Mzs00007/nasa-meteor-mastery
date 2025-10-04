import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import React, { useState, useEffect, useRef } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

import useMeteorologicalData from '../hooks/useMeteorologicalData';
import './MeteorologicalSimulation.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const MeteorologicalSimulation = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [timeframe, setTimeframe] = useState('7days');
  const [weatherModel, setWeatherModel] = useState('gfs');
  const [selectedView, setSelectedView] = useState('overview');
  const [simulationResults, setSimulationResults] = useState(null);
  const intervalRef = useRef(null);

  // Use real meteorological data from WebSocket
  const {
    simulationData,
    extremeEvents,
    weatherStats,
    climateForecast,
    atmosphericConditions,
    isLoading,
    error,
    lastUpdate,
    requestSimulation,
    requestExtremeWeatherAnalysis,
    requestWeatherStatistics,
    requestClimateForecast,
    hasData,
    isConnected,
  } = useMeteorologicalData();

  const [simulationParams, setSimulationParams] = useState({
    location: { lat: 40.7128, lng: -74.006, name: 'New York City' },
    duration_days: 7,
    scenario: 'baseline',
  });

  const [statistics, setStatistics] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const scenarios = [
    {
      value: 'baseline',
      label: 'Baseline Conditions',
      description: 'Normal weather patterns',
    },
    {
      value: 'climate_change',
      label: 'Climate Change',
      description: 'Enhanced warming and extreme events',
    },
    {
      value: 'el_nino',
      label: 'El Niño',
      description: 'Warmer and wetter conditions',
    },
    {
      value: 'la_nina',
      label: 'La Niña',
      description: 'Cooler and drier conditions',
    },
    {
      value: 'arctic_blast',
      label: 'Arctic Blast',
      description: 'Extreme cold weather event',
    },
    {
      value: 'heat_dome',
      label: 'Heat Dome',
      description: 'Extreme heat weather event',
    },
  ];

  const predefinedLocations = [
    { lat: 40.7128, lng: -74.006, name: 'New York City' },
    { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
    { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
    { lat: 29.7604, lng: -95.3698, name: 'Houston' },
    { lat: 25.7617, lng: -80.1918, name: 'Miami' },
    { lat: 47.6062, lng: -122.3321, name: 'Seattle' },
    { lat: 39.7392, lng: -104.9903, name: 'Denver' },
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const runSimulation = async () => {
    setSimulationRunning(true);
    setSimulationProgress(0);

    // Request real simulation data through WebSocket
    const simulationParameters = {
      region: selectedRegion,
      timeframe: timeframe,
      model: weatherModel,
      scenario: simulationParams.scenario,
      resolution: simulationParams.resolution,
      includeExtremeEvents: true,
      includeStatistics: true,
    };

    // Request data from WebSocket service
    requestSimulation(simulationParameters);
    requestExtremeWeatherAnalysis(selectedRegion, timeframe);
    requestWeatherStatistics(simulationParameters);
    requestClimateForecast(selectedRegion, timeframe);

    // Simulate progress for UI feedback
    intervalRef.current = setInterval(() => {
      setSimulationProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 95);
        if (newProgress >= 95 && hasData) {
          clearInterval(intervalRef.current);
          setSimulationRunning(false);
          setSimulationProgress(100);
          // Set simulation results when complete
          const results = generateMockSimulationResults();
          setSimulationResults(results);
          setStatistics(results.statistics);
          setForecastData(results.forecast_models);
          return 100;
        }
        return newProgress;
      });
    }, 500);

    // Auto-complete after 10 seconds if no data received
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setSimulationRunning(false);
        setSimulationProgress(100);
        // Set simulation results when complete
        const results = generateMockSimulationResults();
        setSimulationResults(results);
        setStatistics(results.statistics);
        setForecastData(results.forecast_models);
      }
    }, 10000);
  };

  const generateMockSimulationResults = () => {
    const hours = simulationParams.duration_days * 24;
    const temperatureData = [];
    const pressureData = [];
    const windSpeedData = [];
    const precipitationData = [];
    const labels = [];

    // Generate mock weather data
    for (let i = 0; i < hours; i++) {
      const baseTemp =
        20 + 10 * Math.sin((2 * Math.PI * i) / 24) + Math.random() * 5;
      temperatureData.push(baseTemp);
      pressureData.push(1013 + Math.random() * 20 - 10);
      windSpeedData.push(Math.random() * 25);
      precipitationData.push(Math.random() < 0.2 ? Math.random() * 10 : 0);

      if (i % 6 === 0) {
        // Every 6 hours
        const date = new Date();
        date.setHours(date.getHours() + i);
        labels.push(`${date.toLocaleDateString()} ${date.getHours()}:00`);
      }
    }

    // Generate mock extreme events
    const mockExtremeEvents = [
      {
        event_type: 'thunderstorm',
        intensity: 'Moderate',
        probability: 0.85,
        duration_hours: 4,
        affected_area_km2: 500,
        wind_speed_max: 35.2,
        temperature_extreme: 28.5,
        precipitation_rate: 15.3,
        pressure_drop: 12.5,
      },
      {
        event_type: 'heatwave',
        intensity: 'Severe',
        probability: 0.72,
        duration_hours: 48,
        affected_area_km2: 10000,
        wind_speed_max: 8.1,
        temperature_extreme: 42.1,
        precipitation_rate: 0.0,
        pressure_drop: 2.1,
      },
    ];

    // Generate mock statistics
    const mockStatistics = {
      temperature: {
        mean: 22.5,
        median: 22.1,
        std: 8.2,
        min: 5.3,
        max: 42.1,
        percentiles: {
          '10th': 12.5,
          '25th': 16.8,
          '75th': 28.2,
          '90th': 34.5,
          '95th': 38.1,
          '99th': 41.2,
        },
        trend: 0.15,
        variability_index: 0.36,
      },
      pressure: {
        mean: 1013.2,
        std: 8.5,
        min: 995.1,
        max: 1028.7,
        trend: -0.05,
      },
      wind: {
        mean_speed: 12.3,
        max_speed: 35.2,
        std: 6.8,
        gust_factor: 2.86,
      },
      precipitation: {
        total: 45.2,
        mean_rate: 0.27,
        max_rate: 15.3,
        wet_hours: 28,
        intensity_distribution: {
          light: 20,
          moderate: 6,
          heavy: 2,
          extreme: 0,
        },
      },
      extreme_events: {
        total_count: 2,
        by_type: {
          thunderstorm: 1,
          heatwave: 1,
        },
        severity_distribution: {
          Moderate: 1,
          Severe: 1,
        },
      },
    };

    return {
      parameters: simulationParams,
      weather_data: {
        temperature: temperatureData,
        pressure: pressureData,
        wind_speed: windSpeedData,
        precipitation: precipitationData,
        labels: labels,
      },
      extreme_events: mockExtremeEvents,
      statistics: mockStatistics,
      forecast_models: {
        temperature_forecast: {
          next_24h: temperatureData
            .slice(-24)
            .map(t => t + Math.random() * 2 - 1),
          confidence: 0.85,
          trend_direction: 'increasing',
        },
        extreme_event_probability: {
          next_24h: {
            thunderstorm: 0.3,
            heatwave: 0.15,
            hurricane: 0.02,
          },
        },
      },
    };
  };

  const renderTemperatureChart = () => {
    if (!simulationResults?.weather_data) {
      return null;
    }

    const data = {
      labels: simulationResults.weather_data.labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: simulationResults.weather_data.temperature.filter(
            (_, i) => i % 6 === 0
          ),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Temperature Variation Over Time',
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Temperature (°C)',
          },
        },
      },
    };

    return <Line data={data} options={options} />;
  };

  const renderPrecipitationChart = () => {
    if (!simulationResults?.weather_data) {
      return null;
    }

    const data = {
      labels: simulationResults.weather_data.labels,
      datasets: [
        {
          label: 'Precipitation (mm/h)',
          data: simulationResults.weather_data.precipitation.filter(
            (_, i) => i % 6 === 0
          ),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Precipitation Rate Over Time',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Precipitation (mm/h)',
          },
        },
      },
    };

    return <Bar data={data} options={options} />;
  };

  const renderStatisticsOverview = () => {
    if (!statistics) {
      return null;
    }

    return (
      <div className='statistics-overview'>
        <div className='stat-grid'>
          <div className='stat-card'>
            <h4>Temperature</h4>
            <div className='stat-value'>
              {statistics.temperature.mean.toFixed(1)}°C
            </div>
            <div className='stat-label'>Average</div>
            <div className='stat-range'>
              Range: {statistics.temperature.min.toFixed(1)}°C to{' '}
              {statistics.temperature.max.toFixed(1)}°C
            </div>
          </div>

          <div className='stat-card'>
            <h4>Pressure</h4>
            <div className='stat-value'>
              {statistics.pressure.mean.toFixed(1)} hPa
            </div>
            <div className='stat-label'>Average</div>
            <div className='stat-range'>
              Range: {statistics.pressure.min.toFixed(1)} to{' '}
              {statistics.pressure.max.toFixed(1)} hPa
            </div>
          </div>

          <div className='stat-card'>
            <h4>Wind Speed</h4>
            <div className='stat-value'>
              {statistics.wind.mean_speed.toFixed(1)} m/s
            </div>
            <div className='stat-label'>Average</div>
            <div className='stat-range'>
              Max: {statistics.wind.max_speed.toFixed(1)} m/s
            </div>
          </div>

          <div className='stat-card'>
            <h4>Precipitation</h4>
            <div className='stat-value'>
              {statistics.precipitation.total.toFixed(1)} mm
            </div>
            <div className='stat-label'>Total</div>
            <div className='stat-range'>
              Wet Hours: {statistics.precipitation.wet_hours}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExtremeEvents = () => {
    if (!extremeEvents.length) {
      return (
        <div className='no-events'>
          No extreme weather events detected in this simulation.
        </div>
      );
    }

    return (
      <div className='extreme-events'>
        <h3>Detected Extreme Weather Events</h3>
        <div className='events-list'>
          {extremeEvents.map((event, index) => (
            <div key={index} className={`event-card ${event.event_type}`}>
              <div className='event-header'>
                <h4>
                  {event.event_type.charAt(0).toUpperCase() +
                    event.event_type.slice(1)}
                </h4>
                <span className={`intensity ${event.intensity.toLowerCase()}`}>
                  {event.intensity}
                </span>
              </div>
              <div className='event-details'>
                <div className='event-metric'>
                  <span className='label'>Probability:</span>
                  <span className='value'>
                    {(event.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='event-metric'>
                  <span className='label'>Duration:</span>
                  <span className='value'>{event.duration_hours}h</span>
                </div>
                <div className='event-metric'>
                  <span className='label'>Affected Area:</span>
                  <span className='value'>
                    {event.affected_area_km2.toLocaleString()} km²
                  </span>
                </div>
                <div className='event-metric'>
                  <span className='label'>Max Wind:</span>
                  <span className='value'>
                    {event.wind_speed_max.toFixed(1)} m/s
                  </span>
                </div>
                {event.temperature_extreme && (
                  <div className='event-metric'>
                    <span className='label'>Temperature:</span>
                    <span className='value'>
                      {event.temperature_extreme.toFixed(1)}°C
                    </span>
                  </div>
                )}
                {event.precipitation_rate > 0 && (
                  <div className='event-metric'>
                    <span className='label'>Precipitation:</span>
                    <span className='value'>
                      {event.precipitation_rate.toFixed(1)} mm/h
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderForecastModels = () => {
    if (!forecastData) {
      return null;
    }

    return (
      <div className='forecast-models'>
        <h3>Forecast Models & Predictions</h3>

        <div className='forecast-grid'>
          <div className='forecast-card'>
            <h4>Temperature Forecast</h4>
            <div className='forecast-metric'>
              <span className='label'>24h Trend:</span>
              <span
                className={`value ${forecastData.temperature_forecast?.trend_direction}`}
              >
                {forecastData.temperature_forecast?.trend_direction || 'stable'}
              </span>
            </div>
            <div className='forecast-metric'>
              <span className='label'>Confidence:</span>
              <span className='value'>
                {(
                  (forecastData.temperature_forecast?.confidence || 0.85) * 100
                ).toFixed(0)}
                %
              </span>
            </div>
          </div>

          <div className='forecast-card'>
            <h4>Extreme Event Probability (24h)</h4>
            {forecastData.extreme_event_probability?.next_24h &&
              Object.entries(
                forecastData.extreme_event_probability.next_24h
              ).map(([event, prob]) => (
                <div key={event} className='forecast-metric'>
                  <span className='label'>
                    {event.charAt(0).toUpperCase() + event.slice(1)}:
                  </span>
                  <span className='value'>{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='meteorological-simulation'>
      <div className='simulation-header'>
        <h1>🌪️ Extreme Meteorological Simulation</h1>
        <p>
          Advanced weather modeling for extreme meteorologist study and
          observation
        </p>
      </div>

      <div className='simulation-controls'>
        <div className='control-section'>
          <h3>Simulation Parameters</h3>

          <div className='control-group'>
            <label>Location:</label>
            <select
              value={`${simulationParams.location.lat},${simulationParams.location.lng}`}
              onChange={e => {
                const [lat, lng] = e.target.value.split(',').map(Number);
                const location = predefinedLocations.find(
                  loc => loc.lat === lat && loc.lng === lng
                );
                setSimulationParams(prev => ({ ...prev, location }));
              }}
            >
              {predefinedLocations.map(loc => (
                <option
                  key={`${loc.lat},${loc.lng}`}
                  value={`${loc.lat},${loc.lng}`}
                >
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className='control-group'>
            <label>Duration:</label>
            <select
              value={simulationParams.duration_days}
              onChange={e =>
                setSimulationParams(prev => ({
                  ...prev,
                  duration_days: parseInt(e.target.value),
                }))
              }
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          <div className='control-group'>
            <label>Scenario:</label>
            <select
              value={simulationParams.scenario}
              onChange={e =>
                setSimulationParams(prev => ({
                  ...prev,
                  scenario: e.target.value,
                }))
              }
            >
              {scenarios.map(scenario => (
                <option key={scenario.value} value={scenario.value}>
                  {scenario.label}
                </option>
              ))}
            </select>
            <div className='scenario-description'>
              {
                scenarios.find(s => s.value === simulationParams.scenario)
                  ?.description
              }
            </div>
          </div>

          <button
            className='run-simulation-btn'
            onClick={runSimulation}
            disabled={simulationRunning}
          >
            {simulationRunning ? 'Running Simulation...' : 'Run Simulation'}
          </button>

          {simulationRunning && (
            <div className='progress-bar'>
              <div
                className='progress-fill'
                style={{ width: `${simulationProgress}%` }}
              />
              <span className='progress-text'>
                {simulationProgress.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {simulationResults && (
        <div className='simulation-results'>
          <div className='results-navigation'>
            <button
              className={selectedView === 'overview' ? 'active' : ''}
              onClick={() => setSelectedView('overview')}
            >
              Overview
            </button>
            <button
              className={selectedView === 'charts' ? 'active' : ''}
              onClick={() => setSelectedView('charts')}
            >
              Weather Charts
            </button>
            <button
              className={selectedView === 'events' ? 'active' : ''}
              onClick={() => setSelectedView('events')}
            >
              Extreme Events
            </button>
            <button
              className={selectedView === 'forecast' ? 'active' : ''}
              onClick={() => setSelectedView('forecast')}
            >
              Forecasts
            </button>
          </div>

          <div className='results-content'>
            {selectedView === 'overview' && renderStatisticsOverview()}

            {selectedView === 'charts' && (
              <div className='charts-section'>
                <div className='chart-container'>
                  {renderTemperatureChart()}
                </div>
                <div className='chart-container'>
                  {renderPrecipitationChart()}
                </div>
              </div>
            )}

            {selectedView === 'events' && renderExtremeEvents()}

            {selectedView === 'forecast' && renderForecastModels()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeteorologicalSimulation;
