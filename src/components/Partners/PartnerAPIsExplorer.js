/**
 * Partner APIs Explorer Component
 * Handles USGS Earthquake, USGS Elevation, OpenWeatherMap, and other mapping APIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const ExplorerContainer = styled.div`
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #1e88e5 100%);
  border-radius: 15px;
  padding: 25px;
  margin: 20px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="earth" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:rgba(33,150,243,0.1);stop-opacity:1" /><stop offset="100%" style="stop-color:rgba(33,150,243,0);stop-opacity:0" /></radialGradient></defs><circle cx="15" cy="25" r="6" fill="url(%23earth)"/><circle cx="85" cy="35" r="8" fill="url(%23earth)"/><circle cx="25" cy="75" r="7" fill="url(%23earth)"/><circle cx="75" cy="80" r="5" fill="url(%23earth)"/></svg>') repeat;
    opacity: 0.3;
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
  position: relative;
  z-index: 1;
`;

const Title = styled.h2`
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #2196f3, #64b5f6, #90caf9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #2196f3, #64b5f6)' : 
    'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.active ? '#2196f3' : 'rgba(33, 150, 243, 0.3)'};
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;

  &:hover {
    border-color: #2196f3;
    transform: translateY(-1px);
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(33, 150, 243, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(33, 150, 243, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
  }

  option {
    background: #1565c0;
    color: white;
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #2196f3, #64b5f6);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
`;

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
    border-color: #2196f3;
  }
`;

const CardTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #2196f3;
  margin: 0 0 15px 0;
`;

const CardContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: #90caf9;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DetailValue = styled.span`
  font-size: 0.9rem;
  color: white;
  font-weight: 500;
  word-break: break-word;
`;

const MagnitudeIndicator = styled.div`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    const mag = parseFloat(props.magnitude);
    if (mag >= 7) return 'linear-gradient(45deg, #d32f2f, #f44336)';
    if (mag >= 6) return 'linear-gradient(45deg, #f57c00, #ff9800)';
    if (mag >= 5) return 'linear-gradient(45deg, #fbc02d, #ffeb3b)';
    if (mag >= 4) return 'linear-gradient(45deg, #689f38, #8bc34a)';
    return 'linear-gradient(45deg, #1976d2, #2196f3)';
  }};
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const WeatherIcon = styled.div`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 10px;
`;

const TemperatureDisplay = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #2196f3;
  margin: 10px 0;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #2196f3;
`;

const ErrorMessage = styled.div`
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  padding: 15px;
  color: #ffcdd2;
  text-align: center;
  margin: 20px 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(33, 150, 243, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2196f3;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #90caf9;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MapContainer = styled.div`
  width: 100%;
  height: 300px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  border: 1px solid rgba(33, 150, 243, 0.3);
`;

const Attribution = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  color: #90caf9;
  text-align: center;
  position: relative;
  z-index: 1;

  a {
    color: #2196f3;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PartnerAPIsExplorer = () => {
  const [activeTab, setActiveTab] = useState('earthquakes');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search parameters
  const [location, setLocation] = useState('San Francisco');
  const [magnitude, setMagnitude] = useState('4.5');
  const [timeRange, setTimeRange] = useState('week');
  const [latitude, setLatitude] = useState('37.7749');
  const [longitude, setLongitude] = useState('-122.4194');

  const tabs = [
    { id: 'earthquakes', label: '🌍 Earthquakes', icon: '🌍' },
    { id: 'elevation', label: '⛰️ Elevation', icon: '⛰️' },
    { id: 'weather', label: '🌤️ Weather', icon: '🌤️' },
    { id: 'mapping', label: '🗺️ Mapping', icon: '🗺️' }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result = [];
      
      switch (activeTab) {
        case 'earthquakes':
          result = await comprehensiveAPIService.getUSGSEarthquakes(
            parseFloat(magnitude), 
            timeRange
          );
          break;
        case 'elevation':
          result = await comprehensiveAPIService.getUSGSElevation(
            parseFloat(latitude), 
            parseFloat(longitude)
          );
          break;
        case 'weather':
          result = await comprehensiveAPIService.getWeatherData(location);
          break;
        case 'mapping':
          // For mapping, we'll show available mapping services info
          result = [
            {
              name: 'OpenStreetMap',
              type: 'Base Map',
              url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              description: 'Free, editable map of the world'
            },
            {
              name: 'MapTiler Satellite',
              type: 'Satellite Imagery',
              url: 'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg',
              description: 'High-resolution satellite imagery'
            },
            {
              name: 'USGS Topo Maps',
              type: 'Topographic',
              url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer',
              description: 'Detailed topographic maps'
            },
            {
              name: 'NASA GIBS',
              type: 'Earth Imagery',
              url: 'https://map1.vis.earthdata.nasa.gov/wmts-geo/1.0.0/MODIS_Terra_CorrectedReflectance_TrueColor',
              description: 'Real-time Earth satellite imagery'
            }
          ];
          break;
        default:
          result = [];
      }
      
      setData(Array.isArray(result) ? result : result.features || [result]);
    } catch (err) {
      setError(`Failed to load ${activeTab} data: ${err.message}`);
      console.error(`${activeTab} fetch error:`, err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, location, magnitude, timeRange, latitude, longitude]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getWeatherIcon = (condition) => {
    const icons = {
      'clear': '☀️',
      'clouds': '☁️',
      'rain': '🌧️',
      'snow': '❄️',
      'thunderstorm': '⛈️',
      'drizzle': '🌦️',
      'mist': '🌫️',
      'fog': '🌫️'
    };
    
    const key = condition?.toLowerCase() || 'clear';
    return icons[key] || '🌤️';
  };

  const renderEarthquakeCard = (earthquake) => {
    const props = earthquake.properties || {};
    const geometry = earthquake.geometry || {};
    const coords = geometry.coordinates || [];
    
    return (
      <ContentCard key={earthquake.id || Math.random()}>
        <CardTitle>{props.place || 'Unknown Location'}</CardTitle>
        <CardContent>
          <DetailItem>
            <DetailLabel>Magnitude</DetailLabel>
            <DetailValue>
              <MagnitudeIndicator magnitude={props.mag || 0}>
                {props.mag ? parseFloat(props.mag).toFixed(1) : 'N/A'}
              </MagnitudeIndicator>
            </DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Time</DetailLabel>
            <DetailValue>
              {props.time ? new Date(props.time).toLocaleString() : 'N/A'}
            </DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Depth</DetailLabel>
            <DetailValue>{coords[2] ? `${coords[2].toFixed(1)} km` : 'N/A'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Coordinates</DetailLabel>
            <DetailValue>
              {coords[1] && coords[0] ? 
                `${coords[1].toFixed(3)}°, ${coords[0].toFixed(3)}°` : 
                'N/A'
              }
            </DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Type</DetailLabel>
            <DetailValue>{props.type || 'earthquake'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel>Status</DetailLabel>
            <DetailValue>{props.status || 'N/A'}</DetailValue>
          </DetailItem>
        </CardContent>
      </ContentCard>
    );
  };

  const renderElevationCard = (elevation) => (
    <ContentCard key={Math.random()}>
      <CardTitle>🏔️ Elevation Data</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>Elevation</DetailLabel>
          <DetailValue>
            {elevation.elevation ? `${elevation.elevation.toFixed(2)} meters` : 'N/A'}
          </DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Latitude</DetailLabel>
          <DetailValue>{latitude}°</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Longitude</DetailLabel>
          <DetailValue>{longitude}°</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Data Source</DetailLabel>
          <DetailValue>{elevation.dataSource || 'USGS National Elevation Dataset'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Resolution</DetailLabel>
          <DetailValue>{elevation.resolution || '1/3 arc-second'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Units</DetailLabel>
          <DetailValue>Meters above sea level</DetailValue>
        </DetailItem>
      </CardContent>
    </ContentCard>
  );

  const renderWeatherCard = (weather) => (
    <ContentCard key={Math.random()}>
      <WeatherIcon>{getWeatherIcon(weather.weather?.[0]?.main)}</WeatherIcon>
      <CardTitle>{weather.name || location}</CardTitle>
      <TemperatureDisplay>
        {weather.main?.temp ? `${Math.round(weather.main.temp)}°C` : 'N/A'}
      </TemperatureDisplay>
      <CardContent>
        <DetailItem>
          <DetailLabel>Condition</DetailLabel>
          <DetailValue>{weather.weather?.[0]?.description || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Feels Like</DetailLabel>
          <DetailValue>
            {weather.main?.feels_like ? `${Math.round(weather.main.feels_like)}°C` : 'N/A'}
          </DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Humidity</DetailLabel>
          <DetailValue>{weather.main?.humidity ? `${weather.main.humidity}%` : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Pressure</DetailLabel>
          <DetailValue>{weather.main?.pressure ? `${weather.main.pressure} hPa` : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Wind Speed</DetailLabel>
          <DetailValue>{weather.wind?.speed ? `${weather.wind.speed} m/s` : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Visibility</DetailLabel>
          <DetailValue>{weather.visibility ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}</DetailValue>
        </DetailItem>
      </CardContent>
    </ContentCard>
  );

  const renderMappingCard = (service) => (
    <ContentCard key={service.name}>
      <CardTitle>{service.name}</CardTitle>
      <MapContainer>
        <div style={{ textAlign: 'center', color: '#90caf9' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🗺️</div>
          <div>Map Service Available</div>
        </div>
      </MapContainer>
      <CardContent>
        <DetailItem>
          <DetailLabel>Type</DetailLabel>
          <DetailValue>{service.type}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>URL Pattern</DetailLabel>
          <DetailValue style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
            {service.url}
          </DetailValue>
        </DetailItem>
        <DetailItem style={{ gridColumn: '1 / -1' }}>
          <DetailLabel>Description</DetailLabel>
          <DetailValue>{service.description}</DetailValue>
        </DetailItem>
      </CardContent>
    </ContentCard>
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner>Loading {activeTab} data...</LoadingSpinner>;
    }

    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }

    if (!data || data.length === 0) {
      return (
        <ContentCard>
          <CardTitle>No data found</CardTitle>
          <p style={{ color: '#90caf9', margin: '10px 0' }}>
            Try adjusting your search parameters or check back later.
          </p>
        </ContentCard>
      );
    }

    return (
      <ContentGrid>
        {data.map((item) => {
          switch (activeTab) {
            case 'earthquakes':
              return renderEarthquakeCard(item);
            case 'elevation':
              return renderElevationCard(item);
            case 'weather':
              return renderWeatherCard(item);
            case 'mapping':
              return renderMappingCard(item);
            default:
              return null;
          }
        })}
      </ContentGrid>
    );
  };

  const getStats = () => {
    if (!data || data.length === 0) return null;

    switch (activeTab) {
      case 'earthquakes':
        const avgMag = data.reduce((sum, eq) => sum + (eq.properties?.mag || 0), 0) / data.length;
        const maxMag = Math.max(...data.map(eq => eq.properties?.mag || 0));
        return [
          { label: 'Total Events', value: data.length },
          { label: 'Avg Magnitude', value: avgMag.toFixed(1) },
          { label: 'Max Magnitude', value: maxMag.toFixed(1) },
          { label: 'Time Range', value: timeRange }
        ];
      case 'weather':
        const weather = data[0];
        return [
          { label: 'Temperature', value: weather.main?.temp ? `${Math.round(weather.main.temp)}°C` : 'N/A' },
          { label: 'Humidity', value: weather.main?.humidity ? `${weather.main.humidity}%` : 'N/A' },
          { label: 'Pressure', value: weather.main?.pressure ? `${weather.main.pressure} hPa` : 'N/A' },
          { label: 'Wind Speed', value: weather.wind?.speed ? `${weather.wind.speed} m/s` : 'N/A' }
        ];
      default:
        return [
          { label: 'Results', value: data.length },
          { label: 'Data Type', value: activeTab },
          { label: 'Status', value: 'Active' }
        ];
    }
  };

  const stats = getStats();

  return (
    <ExplorerContainer>
      <Header>
        <Title>🌍 Partner APIs Explorer</Title>
      </Header>

      <TabContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </Tab>
        ))}
      </TabContainer>

      <Controls>
        {activeTab === 'earthquakes' && (
          <>
            <Select value={magnitude} onChange={(e) => setMagnitude(e.target.value)}>
              <option value="2.5">Magnitude 2.5+</option>
              <option value="4.5">Magnitude 4.5+</option>
              <option value="6.0">Magnitude 6.0+</option>
              <option value="7.0">Magnitude 7.0+</option>
            </Select>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="hour">Past Hour</option>
              <option value="day">Past Day</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </Select>
          </>
        )}

        {activeTab === 'elevation' && (
          <>
            <Input
              type="number"
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              step="0.0001"
            />
            <Input
              type="number"
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              step="0.0001"
            />
          </>
        )}

        {activeTab === 'weather' && (
          <Input
            type="text"
            placeholder="City name"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        )}

        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </Controls>

      {stats && (
        <StatsGrid>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>
      )}

      {renderContent()}

      <Attribution>
        Data courtesy of{' '}
        <a href="https://earthquake.usgs.gov/" target="_blank" rel="noopener noreferrer">USGS Earthquake Hazards Program</a>
        {' • '}
        <a href="https://www.usgs.gov/core-science-systems/ngp/3dep" target="_blank" rel="noopener noreferrer">USGS 3D Elevation Program</a>
        {' • '}
        <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeatherMap</a>
        {' • '}
        <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
        {' • '}
        <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">MapTiler</a>
      </Attribution>
    </ExplorerContainer>
  );
};

export default PartnerAPIsExplorer;