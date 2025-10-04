/**
 * DONKI Space Weather Dashboard Component
 * Displays solar flares, geomagnetic storms, and space weather impacts
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const WeatherContainer = styled.div`
  background: linear-gradient(135deg, #1a0033 0%, #330066 50%, #4d0080 100%);
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
    background: radial-gradient(circle at 20% 20%, rgba(255, 255, 0, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 60%, rgba(0, 255, 255, 0.1) 0%, transparent 50%);
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
  background: linear-gradient(45deg, #ff6ec7, #9c27b0, #673ab7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 110, 199, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ff6ec7;
    box-shadow: 0 0 10px rgba(255, 110, 199, 0.3);
  }

  option {
    background: #330066;
    color: white;
  }
`;

const DateInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 110, 199, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ff6ec7;
    box-shadow: 0 0 10px rgba(255, 110, 199, 0.3);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #ff6ec7, #9c27b0);
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
    box-shadow: 0 5px 15px rgba(255, 110, 199, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
`;

const Tab = styled.button`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #ff6ec7, #9c27b0)' : 
    'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.active ? '#ff6ec7' : 'rgba(255, 110, 199, 0.3)'};
  border-radius: 8px;
  padding: 10px 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    border-color: #ff6ec7;
    transform: translateY(-1px);
  }
`;

const ContentArea = styled.div`
  position: relative;
  z-index: 1;
`;

const EventList = styled.div`
  max-height: 600px;
  overflow-y: auto;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  padding: 15px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 110, 199, 0.5);
    border-radius: 4px;
  }
`;

const EventCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 110, 199, 0.2);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateX(5px);
    border-color: #ff6ec7;
    box-shadow: 0 5px 15px rgba(255, 110, 199, 0.2);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
`;

const EventType = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #ff6ec7;
  margin: 0;
  flex: 1;
`;

const SeverityBadge = styled.span`
  background: ${props => {
    switch(props.severity?.toLowerCase()) {
      case 'high': return 'linear-gradient(45deg, #f44336, #d32f2f)';
      case 'medium': return 'linear-gradient(45deg, #ff9800, #f57c00)';
      case 'low': return 'linear-gradient(45deg, #4caf50, #388e3c)';
      default: return 'linear-gradient(45deg, #9e9e9e, #616161)';
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const EventDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: #e1bee7;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  color: white;
  font-weight: 500;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 110, 199, 0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 110, 199, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #ff6ec7;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #e1bee7;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #ff6ec7;
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

const Attribution = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  color: #e1bee7;
  text-align: center;

  a {
    color: #ff6ec7;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const SpaceWeatherDashboard = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventType, setEventType] = useState('all');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      switch (activeTab) {
        case 'notifications':
          data = await comprehensiveAPIService.getSpaceWeatherNotifications(eventType, startDate, endDate);
          break;
        case 'flares':
          data = await comprehensiveAPIService.getSolarFlares(startDate, endDate);
          break;
        case 'cme':
          data = await comprehensiveAPIService.getCoronalMassEjections(startDate, endDate);
          break;
        case 'storms':
          data = await comprehensiveAPIService.getGeomagneticStorms(startDate, endDate);
          break;
        default:
          data = await comprehensiveAPIService.getSpaceWeatherNotifications('all', startDate, endDate);
      }
      
      setWeatherData(data);
    } catch (err) {
      setError(`Failed to load space weather data: ${err.message}`);
      console.error('Space weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, eventType, startDate, endDate]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventSeverity = (event) => {
    // Determine severity based on event type and properties
    if (event.classType && event.classType.includes('X')) return 'high';
    if (event.classType && event.classType.includes('M')) return 'medium';
    if (event.kpIndex && event.kpIndex >= 7) return 'high';
    if (event.kpIndex && event.kpIndex >= 5) return 'medium';
    return 'low';
  };

  const getEventTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'flr': return '☀️';
      case 'cme': return '🌪️';
      case 'gst': return '⚡';
      case 'sep': return '🔥';
      case 'mpc': return '🌊';
      case 'rbe': return '📡';
      default: return '🌌';
    }
  };

  const getStats = () => {
    if (!weatherData || !Array.isArray(weatherData)) return {};
    
    const total = weatherData.length;
    const highSeverity = weatherData.filter(event => getEventSeverity(event) === 'high').length;
    const mediumSeverity = weatherData.filter(event => getEventSeverity(event) === 'medium').length;
    const recent = weatherData.filter(event => {
      const eventDate = new Date(event.eventTime || event.beginTime || event.time);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventDate > dayAgo;
    }).length;

    return { total, highSeverity, mediumSeverity, recent };
  };

  if (loading) {
    return (
      <WeatherContainer>
        <Header>
          <Title>🌌 Space Weather Dashboard</Title>
        </Header>
        <LoadingSpinner>Monitoring space weather conditions...</LoadingSpinner>
      </WeatherContainer>
    );
  }

  if (error) {
    return (
      <WeatherContainer>
        <Header>
          <Title>🌌 Space Weather Dashboard</Title>
        </Header>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={fetchWeatherData}>Try Again</Button>
      </WeatherContainer>
    );
  }

  const stats = getStats();

  return (
    <WeatherContainer>
      <Header>
        <Title>🌌 Space Weather Dashboard</Title>
        <Controls>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="all">All Events</option>
            <option value="FLR">Solar Flares</option>
            <option value="CME">Coronal Mass Ejections</option>
            <option value="GST">Geomagnetic Storms</option>
            <option value="SEP">Solar Energetic Particles</option>
            <option value="MPC">Magnetopause Crossing</option>
            <option value="RBE">Radiation Belt Enhancement</option>
          </Select>
          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: '#e1bee7' }}>to</span>
          <DateInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={fetchWeatherData}>Update</Button>
        </Controls>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'notifications'} 
          onClick={() => handleTabChange('notifications')}
        >
          All Notifications
        </Tab>
        <Tab 
          active={activeTab === 'flares'} 
          onClick={() => handleTabChange('flares')}
        >
          Solar Flares
        </Tab>
        <Tab 
          active={activeTab === 'cme'} 
          onClick={() => handleTabChange('cme')}
        >
          CME Events
        </Tab>
        <Tab 
          active={activeTab === 'storms'} 
          onClick={() => handleTabChange('storms')}
        >
          Geomagnetic Storms
        </Tab>
      </TabContainer>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.total || 0}</StatValue>
          <StatLabel>Total Events</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.highSeverity || 0}</StatValue>
          <StatLabel>High Severity</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.mediumSeverity || 0}</StatValue>
          <StatLabel>Medium Severity</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.recent || 0}</StatValue>
          <StatLabel>Last 24 Hours</StatLabel>
        </StatCard>
      </StatsGrid>

      <ContentArea>
        <EventList>
          {weatherData && Array.isArray(weatherData) && weatherData.map((event, index) => (
            <EventCard key={event.messageID || index}>
              <EventHeader>
                <EventType>
                  {getEventTypeIcon(event.messageType)} {event.messageType || 'Space Weather Event'}
                </EventType>
                <SeverityBadge severity={getEventSeverity(event)}>
                  {getEventSeverity(event)}
                </SeverityBadge>
              </EventHeader>

              <EventDetails>
                <DetailItem>
                  <DetailLabel>Event Time</DetailLabel>
                  <DetailValue>
                    {formatDate(event.eventTime || event.beginTime || event.time || 'Unknown')}
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Message ID</DetailLabel>
                  <DetailValue>{event.messageID || 'N/A'}</DetailValue>
                </DetailItem>

                {event.classType && (
                  <DetailItem>
                    <DetailLabel>Class Type</DetailLabel>
                    <DetailValue>{event.classType}</DetailValue>
                  </DetailItem>
                )}

                {event.kpIndex && (
                  <DetailItem>
                    <DetailLabel>Kp Index</DetailLabel>
                    <DetailValue>{event.kpIndex}</DetailValue>
                  </DetailItem>
                )}

                {event.speed && (
                  <DetailItem>
                    <DetailLabel>Speed</DetailLabel>
                    <DetailValue>{event.speed} km/s</DetailValue>
                  </DetailItem>
                )}

                {event.sourceLocation && (
                  <DetailItem>
                    <DetailLabel>Source Location</DetailLabel>
                    <DetailValue>{event.sourceLocation}</DetailValue>
                  </DetailItem>
                )}

                {event.note && (
                  <DetailItem>
                    <DetailLabel>Note</DetailLabel>
                    <DetailValue>{event.note}</DetailValue>
                  </DetailItem>
                )}
              </EventDetails>
            </EventCard>
          ))}

          {(!weatherData || !Array.isArray(weatherData) || weatherData.length === 0) && (
            <EventCard>
              <EventType>No space weather events found for the selected period.</EventType>
            </EventCard>
          )}
        </EventList>
      </ContentArea>

      <Attribution>
        Data provided by <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noopener noreferrer">NASA DONKI</a>
        {' • '}
        <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Open Data Portal</a>
      </Attribution>
    </WeatherContainer>
  );
};

export default SpaceWeatherDashboard;