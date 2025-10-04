/**
 * EONET Natural Events Tracker Component
 * Displays natural Earth events like wildfires, storms, volcanoes, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const EventsContainer = styled.div`
  background: linear-gradient(135deg, #0d4f3c 0%, #1b5e20 50%, #2e7d32 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="earth" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:rgba(76,175,80,0.1);stop-opacity:1" /><stop offset="100%" style="stop-color:rgba(76,175,80,0);stop-opacity:0" /></radialGradient></defs><circle cx="30" cy="30" r="15" fill="url(%23earth)"/><circle cx="70" cy="70" r="20" fill="url(%23earth)"/></svg>') repeat;
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
  background: linear-gradient(45deg, #4caf50, #8bc34a, #cddc39);
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
  border: 2px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }

  option {
    background: #1b5e20;
    color: white;
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #4caf50, #8bc34a);
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
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #4caf50;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #a5d6a7;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const FilterChip = styled.button`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #4caf50, #8bc34a)' : 
    'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.active ? '#4caf50' : 'rgba(76, 175, 80, 0.3)'};
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;

  &:hover {
    border-color: #4caf50;
    transform: translateY(-1px);
  }
`;

const EventsList = styled.div`
  max-height: 600px;
  overflow-y: auto;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  padding: 15px;
  position: relative;
  z-index: 1;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(76, 175, 80, 0.5);
    border-radius: 4px;
  }
`;

const EventCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateX(5px);
    border-color: #4caf50;
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
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

const EventTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #4caf50;
  margin: 0;
  flex: 1;
`;

const CategoryBadge = styled.span`
  background: ${props => {
    switch(props.category?.toLowerCase()) {
      case 'wildfires': return 'linear-gradient(45deg, #ff5722, #d84315)';
      case 'volcanoes': return 'linear-gradient(45deg, #f44336, #c62828)';
      case 'storms': return 'linear-gradient(45deg, #2196f3, #1565c0)';
      case 'floods': return 'linear-gradient(45deg, #00bcd4, #0097a7)';
      case 'earthquakes': return 'linear-gradient(45deg, #795548, #5d4037)';
      case 'landslides': return 'linear-gradient(45deg, #607d8b, #455a64)';
      case 'drought': return 'linear-gradient(45deg, #ff9800, #f57c00)';
      case 'dust and haze': return 'linear-gradient(45deg, #9e9e9e, #616161)';
      case 'snow': return 'linear-gradient(45deg, #e1f5fe, #b3e5fc)';
      case 'water color': return 'linear-gradient(45deg, #4fc3f7, #29b6f6)';
      case 'manmade': return 'linear-gradient(45deg, #9c27b0, #7b1fa2)';
      case 'sea and lake ice': return 'linear-gradient(45deg, #81d4fa, #4fc3f7)';
      default: return 'linear-gradient(45deg, #4caf50, #388e3c)';
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

const StatusBadge = styled.span`
  background: ${props => props.status === 'open' ? 
    'linear-gradient(45deg, #f44336, #d32f2f)' : 
    'linear-gradient(45deg, #4caf50, #388e3c)'};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-left: 10px;
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
  color: #a5d6a7;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  color: white;
  font-weight: 500;
`;

const GeometryInfo = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(76, 175, 80, 0.2);
`;

const GeometryTitle = styled.h4`
  color: #4caf50;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #4caf50;
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
  color: #a5d6a7;
  text-align: center;
  position: relative;
  z-index: 1;

  a {
    color: #4caf50;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const NaturalEventsTracker = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [limit, setLimit] = useState(100);
  const [days, setDays] = useState(20);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [eventsData, categoriesData] = await Promise.all([
        comprehensiveAPIService.getNaturalEvents(statusFilter, limit, days),
        comprehensiveAPIService.getEventCategories()
      ]);
      
      setEvents(eventsData.events || []);
      setCategories(categoriesData.categories || []);
    } catch (err) {
      setError(`Failed to load natural events data: ${err.message}`);
      console.error('Natural events fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, limit, days]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (categoryId) => {
    switch (categoryId) {
      case 8: return '🔥'; // Wildfires
      case 12: return '🌋'; // Volcanoes
      case 10: return '🌪️'; // Severe Storms
      case 9: return '🌊'; // Floods
      case 16: return '🏔️'; // Earthquakes
      case 14: return '⛰️'; // Landslides
      case 6: return '🏜️'; // Drought
      case 5: return '🌫️'; // Dust and Haze
      case 15: return '❄️'; // Snow
      case 13: return '🌊'; // Water Color
      case 11: return '🏭'; // Manmade
      case 17: return '🧊'; // Sea and Lake Ice
      default: return '🌍';
    }
  };

  const getFilteredEvents = () => {
    if (categoryFilter === 'all') return events;
    return events.filter(event => 
      event.categories.some(cat => cat.id.toString() === categoryFilter)
    );
  };

  const getStats = () => {
    const filteredEvents = getFilteredEvents();
    const openEvents = filteredEvents.filter(event => !event.closed).length;
    const closedEvents = filteredEvents.filter(event => event.closed).length;
    const recentEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.geometry[event.geometry.length - 1]?.date);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventDate > dayAgo;
    }).length;

    return {
      total: filteredEvents.length,
      open: openEvents,
      closed: closedEvents,
      recent: recentEvents
    };
  };

  if (loading) {
    return (
      <EventsContainer>
        <Header>
          <Title>🌍 Natural Events Tracker</Title>
        </Header>
        <LoadingSpinner>Monitoring natural events worldwide...</LoadingSpinner>
      </EventsContainer>
    );
  }

  if (error) {
    return (
      <EventsContainer>
        <Header>
          <Title>🌍 Natural Events Tracker</Title>
        </Header>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={fetchEvents}>Try Again</Button>
      </EventsContainer>
    );
  }

  const stats = getStats();
  const filteredEvents = getFilteredEvents();

  return (
    <EventsContainer>
      <Header>
        <Title>🌍 Natural Events Tracker</Title>
        <Controls>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">Open Events</option>
            <option value="closed">Closed Events</option>
            <option value="all">All Events</option>
          </Select>
          <Select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
            <option value={7}>Last 7 Days</option>
            <option value={20}>Last 20 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={60}>Last 60 Days</option>
          </Select>
          <Select value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
            <option value={50}>50 Events</option>
            <option value={100}>100 Events</option>
            <option value={200}>200 Events</option>
          </Select>
          <Button onClick={fetchEvents}>Refresh</Button>
        </Controls>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Events</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.open}</StatValue>
          <StatLabel>Open Events</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.closed}</StatValue>
          <StatLabel>Closed Events</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.recent}</StatValue>
          <StatLabel>Last 24 Hours</StatLabel>
        </StatCard>
      </StatsGrid>

      <FilterContainer>
        <FilterChip 
          active={categoryFilter === 'all'} 
          onClick={() => setCategoryFilter('all')}
        >
          All Categories
        </FilterChip>
        {categories.map(category => (
          <FilterChip
            key={category.id}
            active={categoryFilter === category.id.toString()}
            onClick={() => setCategoryFilter(category.id.toString())}
          >
            {getCategoryIcon(category.id)} {category.title}
          </FilterChip>
        ))}
      </FilterContainer>

      <EventsList>
        {filteredEvents.map((event) => {
          const latestGeometry = event.geometry[event.geometry.length - 1];
          const category = event.categories[0];
          
          return (
            <EventCard key={event.id}>
              <EventHeader>
                <EventTitle>
                  {getCategoryIcon(category?.id)} {event.title}
                </EventTitle>
                <div>
                  <CategoryBadge category={category?.title}>
                    {category?.title || 'Unknown'}
                  </CategoryBadge>
                  <StatusBadge status={event.closed ? 'closed' : 'open'}>
                    {event.closed ? 'Closed' : 'Open'}
                  </StatusBadge>
                </div>
              </EventHeader>

              <EventDetails>
                <DetailItem>
                  <DetailLabel>Event ID</DetailLabel>
                  <DetailValue>{event.id}</DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Latest Update</DetailLabel>
                  <DetailValue>
                    {latestGeometry ? formatDate(latestGeometry.date) : 'N/A'}
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Coordinates</DetailLabel>
                  <DetailValue>
                    {latestGeometry && latestGeometry.coordinates ? 
                      `${latestGeometry.coordinates[1]?.toFixed(4)}°, ${latestGeometry.coordinates[0]?.toFixed(4)}°` : 
                      'N/A'
                    }
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Geometry Updates</DetailLabel>
                  <DetailValue>{event.geometry.length}</DetailValue>
                </DetailItem>

                {event.description && (
                  <DetailItem>
                    <DetailLabel>Description</DetailLabel>
                    <DetailValue>{event.description}</DetailValue>
                  </DetailItem>
                )}
              </EventDetails>

              {event.sources && event.sources.length > 0 && (
                <GeometryInfo>
                  <GeometryTitle>Data Sources</GeometryTitle>
                  <EventDetails>
                    {event.sources.map((source, index) => (
                      <DetailItem key={index}>
                        <DetailLabel>Source {index + 1}</DetailLabel>
                        <DetailValue>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#4caf50', textDecoration: 'none' }}
                          >
                            {source.id}
                          </a>
                        </DetailValue>
                      </DetailItem>
                    ))}
                  </EventDetails>
                </GeometryInfo>
              )}
            </EventCard>
          );
        })}

        {filteredEvents.length === 0 && (
          <EventCard>
            <EventTitle>No events found for the selected filters.</EventTitle>
          </EventCard>
        )}
      </EventsList>

      <Attribution>
        Data provided by <a href="https://eonet.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA EONET</a>
        {' • '}
        <a href="https://earthdata.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Earthdata</a>
      </Attribution>
    </EventsContainer>
  );
};

export default NaturalEventsTracker;