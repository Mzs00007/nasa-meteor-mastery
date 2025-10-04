/**
 * NeoWs (Near Earth Object Web Service) Tracker Component
 * Displays real-time asteroid data, trajectories, and impact risk assessment
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const NeoContainer = styled.div`
  background: linear-gradient(135deg, #0d1421 0%, #1a1a2e 50%, #16213e 100%);
  border-radius: 15px;
  padding: 25px;
  margin: 20px 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  color: white;
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h2`
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f);
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

const DateInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 107, 53, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ff6b35;
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.3);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #ff6b35, #f7931e);
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
    box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
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
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 107, 53, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #ff6b35;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #ffcc80;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AsteroidList = styled.div`
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
    background: rgba(255, 107, 53, 0.5);
    border-radius: 4px;
  }
`;

const AsteroidCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 107, 53, 0.2);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateX(5px);
    border-color: #ff6b35;
    box-shadow: 0 5px 15px rgba(255, 107, 53, 0.2);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const AsteroidHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
`;

const AsteroidName = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #ff6b35;
  margin: 0;
  flex: 1;
`;

const HazardBadge = styled.span`
  background: ${props => props.hazardous ? 
    'linear-gradient(45deg, #f44336, #d32f2f)' : 
    'linear-gradient(45deg, #4caf50, #388e3c)'};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AsteroidDetails = styled.div`
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
  color: #ffcc80;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  color: white;
  font-weight: 500;
`;

const ApproachData = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 107, 53, 0.2);
`;

const ApproachTitle = styled.h4`
  color: #ff6b35;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #ff6b35;
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
  color: #ffcc80;
  text-align: center;

  a {
    color: #ff6b35;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const NeoTracker = () => {
  const [neoData, setNeoData] = useState(null);
  const [neoStats, setNeoStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const fetchNeoData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [feedData, statsData] = await Promise.all([
        comprehensiveAPIService.getNeoFeed(startDate, endDate),
        comprehensiveAPIService.getNeoStats()
      ]);
      
      setNeoData(feedData);
      setNeoStats(statsData);
    } catch (err) {
      setError(`Failed to load NEO data: ${err.message}`);
      console.error('NEO fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchNeoData();
  }, [fetchNeoData]);

  const handleDateChange = () => {
    fetchNeoData();
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatDistance = (km) => {
    const distance = parseFloat(km);
    if (distance > 1000000) {
      return `${(distance / 1000000).toFixed(2)}M km`;
    } else if (distance > 1000) {
      return `${(distance / 1000).toFixed(2)}K km`;
    }
    return `${distance.toFixed(2)} km`;
  };

  const formatVelocity = (kmh) => {
    const velocity = parseFloat(kmh);
    return `${velocity.toFixed(2)} km/h`;
  };

  const formatDiameter = (min, max) => {
    return `${min.toFixed(2)} - ${max.toFixed(2)} m`;
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

  const getAllAsteroids = () => {
    if (!neoData || !neoData.near_earth_objects) return [];
    
    const asteroids = [];
    Object.values(neoData.near_earth_objects).forEach(dayAsteroids => {
      asteroids.push(...dayAsteroids);
    });
    
    return asteroids.sort((a, b) => {
      const aDistance = parseFloat(a.close_approach_data[0]?.miss_distance?.kilometers || 0);
      const bDistance = parseFloat(b.close_approach_data[0]?.miss_distance?.kilometers || 0);
      return aDistance - bDistance;
    });
  };

  if (loading) {
    return (
      <NeoContainer>
        <Header>
          <Title>🌌 Near Earth Object Tracker</Title>
        </Header>
        <LoadingSpinner>Scanning for approaching asteroids...</LoadingSpinner>
      </NeoContainer>
    );
  }

  if (error) {
    return (
      <NeoContainer>
        <Header>
          <Title>🌌 Near Earth Object Tracker</Title>
        </Header>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={fetchNeoData}>Try Again</Button>
      </NeoContainer>
    );
  }

  const asteroids = getAllAsteroids();

  return (
    <NeoContainer>
      <Header>
        <Title>🌌 Near Earth Object Tracker</Title>
        <Controls>
          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: '#ffcc80' }}>to</span>
          <DateInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={handleDateChange}>Update Range</Button>
        </Controls>
      </Header>

      {neoStats && (
        <StatsGrid>
          <StatCard>
            <StatValue>{formatNumber(neoStats.near_earth_object_count)}</StatValue>
            <StatLabel>Total NEOs</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{formatNumber(neoData?.element_count || 0)}</StatValue>
            <StatLabel>This Period</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>
              {asteroids.filter(a => a.is_potentially_hazardous_asteroid).length}
            </StatValue>
            <StatLabel>Potentially Hazardous</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>
              {asteroids.length > 0 ? 
                formatDistance(asteroids[0]?.close_approach_data[0]?.miss_distance?.kilometers || 0) : 
                'N/A'
              }
            </StatValue>
            <StatLabel>Closest Approach</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      <AsteroidList>
        {asteroids.map((asteroid) => {
          const approach = asteroid.close_approach_data[0];
          const diameter = asteroid.estimated_diameter?.meters;
          
          return (
            <AsteroidCard key={asteroid.id}>
              <AsteroidHeader>
                <AsteroidName>{asteroid.name}</AsteroidName>
                <HazardBadge hazardous={asteroid.is_potentially_hazardous_asteroid}>
                  {asteroid.is_potentially_hazardous_asteroid ? 'Hazardous' : 'Safe'}
                </HazardBadge>
              </AsteroidHeader>

              <AsteroidDetails>
                <DetailItem>
                  <DetailLabel>Diameter</DetailLabel>
                  <DetailValue>
                    {diameter ? 
                      formatDiameter(diameter.estimated_diameter_min, diameter.estimated_diameter_max) : 
                      'Unknown'
                    }
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Miss Distance</DetailLabel>
                  <DetailValue>
                    {approach ? formatDistance(approach.miss_distance.kilometers) : 'N/A'}
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Velocity</DetailLabel>
                  <DetailValue>
                    {approach ? formatVelocity(approach.relative_velocity.kilometers_per_hour) : 'N/A'}
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Approach Date</DetailLabel>
                  <DetailValue>
                    {approach ? formatDate(approach.close_approach_date_full) : 'N/A'}
                  </DetailValue>
                </DetailItem>
              </AsteroidDetails>

              {approach && (
                <ApproachData>
                  <ApproachTitle>Close Approach Details</ApproachTitle>
                  <AsteroidDetails>
                    <DetailItem>
                      <DetailLabel>Orbiting Body</DetailLabel>
                      <DetailValue>{approach.orbiting_body}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Miss Distance (AU)</DetailLabel>
                      <DetailValue>{parseFloat(approach.miss_distance.astronomical).toFixed(6)} AU</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Miss Distance (Lunar)</DetailLabel>
                      <DetailValue>{parseFloat(approach.miss_distance.lunar).toFixed(2)} LD</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Velocity (km/s)</DetailLabel>
                      <DetailValue>{parseFloat(approach.relative_velocity.kilometers_per_second).toFixed(2)} km/s</DetailValue>
                    </DetailItem>
                  </AsteroidDetails>
                </ApproachData>
              )}
            </AsteroidCard>
          );
        })}
      </AsteroidList>

      <Attribution>
        Data provided by <a href="https://cneos.jpl.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA CNEOS</a>
        {' • '}
        <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Open Data Portal</a>
      </Attribution>
    </NeoContainer>
  );
};

export default NeoTracker;