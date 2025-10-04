/**
 * Advanced NASA Explorer Component
 * Handles multiple advanced NASA APIs: Exoplanet Archive, NASA Image Library, 
 * SSC, SSD/CNEOS, Techport, TechTransfer, and TLE
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const ExplorerContainer = styled.div`
  background: linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #8e24aa 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="space" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:rgba(156,39,176,0.1);stop-opacity:1" /><stop offset="100%" style="stop-color:rgba(156,39,176,0);stop-opacity:0" /></radialGradient></defs><circle cx="20" cy="20" r="8" fill="url(%23space)"/><circle cx="80" cy="30" r="12" fill="url(%23space)"/><circle cx="30" cy="80" r="10" fill="url(%23space)"/><circle cx="70" cy="70" r="6" fill="url(%23space)"/></svg>') repeat;
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
  background: linear-gradient(45deg, #9c27b0, #ba68c8, #ce93d8);
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
    'linear-gradient(45deg, #9c27b0, #ba68c8)' : 
    'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.active ? '#9c27b0' : 'rgba(156, 39, 176, 0.3)'};
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;

  &:hover {
    border-color: #9c27b0;
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
  border: 2px solid rgba(156, 39, 176, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #9c27b0;
    box-shadow: 0 0 10px rgba(156, 39, 176, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(156, 39, 176, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #9c27b0;
    box-shadow: 0 0 10px rgba(156, 39, 176, 0.3);
  }

  option {
    background: #4a148c;
    color: white;
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #9c27b0, #ba68c8);
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
    box-shadow: 0 5px 15px rgba(156, 39, 176, 0.4);
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
  border: 1px solid rgba(156, 39, 176, 0.2);
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(156, 39, 176, 0.3);
    border-color: #9c27b0;
  }
`;

const CardTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #9c27b0;
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
  color: #ce93d8;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DetailValue = styled.span`
  font-size: 0.9rem;
  color: white;
  font-weight: 500;
  word-break: break-word;
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ContentImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #9c27b0;
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
  border: 1px solid rgba(156, 39, 176, 0.2);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(156, 39, 176, 0.2);
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #9c27b0;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #ce93d8;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Attribution = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  color: #ce93d8;
  text-align: center;
  position: relative;
  z-index: 1;

  a {
    color: #9c27b0;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const AdvancedNASAExplorer = () => {
  const [activeTab, setActiveTab] = useState('exoplanets');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [yearStart, setYearStart] = useState('2020');
  const [limit, setLimit] = useState('20');

  const tabs = [
    { id: 'exoplanets', label: '🪐 Exoplanets', icon: '🪐' },
    { id: 'images', label: '📸 NASA Images', icon: '📸' },
    { id: 'satellites', label: '🛰️ Satellites', icon: '🛰️' },
    { id: 'asteroids', label: '☄️ Asteroids', icon: '☄️' },
    { id: 'techport', label: '🔬 Techport', icon: '🔬' },
    { id: 'patents', label: '💡 Patents', icon: '💡' },
    { id: 'tle', label: '🌌 TLE Data', icon: '🌌' }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result = [];
      
      switch (activeTab) {
        case 'exoplanets':
          result = await comprehensiveAPIService.getExoplanets(searchQuery || 'Kepler', parseInt(limit));
          break;
        case 'images':
          result = await comprehensiveAPIService.getNASAImages(searchQuery || 'meteor', mediaType, parseInt(limit));
          break;
        case 'satellites':
          result = await comprehensiveAPIService.getSatelliteData(searchQuery || 'ISS');
          break;
        case 'asteroids':
          result = await comprehensiveAPIService.getAsteroidData(searchQuery || '2022');
          break;
        case 'techport':
          result = await comprehensiveAPIService.getTechportProjects(searchQuery || 'Mars', parseInt(limit));
          break;
        case 'patents':
          result = await comprehensiveAPIService.getTechTransfer(searchQuery || 'space', parseInt(limit));
          break;
        case 'tle':
          result = await comprehensiveAPIService.getTLEData(searchQuery || 'ISS');
          break;
        default:
          result = [];
      }
      
      setData(Array.isArray(result) ? result : result.results || result.data || [result]);
    } catch (err) {
      setError(`Failed to load ${activeTab} data: ${err.message}`);
      console.error(`${activeTab} fetch error:`, err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, mediaType, limit]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const renderExoplanetCard = (planet) => (
    <ContentCard key={planet.pl_name || Math.random()}>
      <CardTitle>{planet.pl_name || 'Unknown Planet'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>Host Star</DetailLabel>
          <DetailValue>{planet.hostname || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Discovery Year</DetailLabel>
          <DetailValue>{planet.disc_year || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Discovery Method</DetailLabel>
          <DetailValue>{planet.discoverymethod || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Orbital Period (days)</DetailLabel>
          <DetailValue>{planet.pl_orbper ? `${parseFloat(planet.pl_orbper).toFixed(2)}` : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Planet Radius (Earth radii)</DetailLabel>
          <DetailValue>{planet.pl_rade ? `${parseFloat(planet.pl_rade).toFixed(2)}` : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Distance (parsecs)</DetailLabel>
          <DetailValue>{planet.sy_dist ? `${parseFloat(planet.sy_dist).toFixed(2)}` : 'N/A'}</DetailValue>
        </DetailItem>
      </CardContent>
    </ContentCard>
  );

  const renderImageCard = (image) => (
    <ContentCard key={image.nasa_id || Math.random()}>
      {image.links && image.links[0] && (
        <ImageContainer>
          <ContentImage
            src={image.links[0].href}
            alt={image.data[0]?.title || 'NASA Image'}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div style={{ display: 'none', color: '#ce93d8', textAlign: 'center', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            Image not available
          </div>
        </ImageContainer>
      )}
      <CardTitle>{image.data[0]?.title || 'NASA Image'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>NASA ID</DetailLabel>
          <DetailValue>{image.data[0]?.nasa_id || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Date Created</DetailLabel>
          <DetailValue>{image.data[0]?.date_created ? new Date(image.data[0].date_created).toLocaleDateString() : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Media Type</DetailLabel>
          <DetailValue>{image.data[0]?.media_type || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Center</DetailLabel>
          <DetailValue>{image.data[0]?.center || 'N/A'}</DetailValue>
        </DetailItem>
        {image.data[0]?.description && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Description</DetailLabel>
            <DetailValue>{image.data[0].description.substring(0, 200)}...</DetailValue>
          </DetailItem>
        )}
      </CardContent>
    </ContentCard>
  );

  const renderSatelliteCard = (satellite) => (
    <ContentCard key={satellite.Id || Math.random()}>
      <CardTitle>{satellite.Name || 'Unknown Satellite'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>ID</DetailLabel>
          <DetailValue>{satellite.Id || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Resolution</DetailLabel>
          <DetailValue>{satellite.Resolution || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Start Time</DetailLabel>
          <DetailValue>{satellite.StartTime || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Stop Time</DetailLabel>
          <DetailValue>{satellite.StopTime || 'N/A'}</DetailValue>
        </DetailItem>
      </CardContent>
    </ContentCard>
  );

  const renderAsteroidCard = (asteroid) => (
    <ContentCard key={asteroid.des || Math.random()}>
      <CardTitle>{asteroid.des || 'Unknown Asteroid'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>Designation</DetailLabel>
          <DetailValue>{asteroid.des || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Orbit ID</DetailLabel>
          <DetailValue>{asteroid.orbit_id || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Epoch (TDB)</DetailLabel>
          <DetailValue>{asteroid.epoch_tdb || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Semi-major Axis (au)</DetailLabel>
          <DetailValue>{asteroid.a ? parseFloat(asteroid.a).toFixed(4) : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Eccentricity</DetailLabel>
          <DetailValue>{asteroid.e ? parseFloat(asteroid.e).toFixed(4) : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Inclination (deg)</DetailLabel>
          <DetailValue>{asteroid.i ? parseFloat(asteroid.i).toFixed(2) : 'N/A'}</DetailValue>
        </DetailItem>
      </CardContent>
    </ContentCard>
  );

  const renderTechportCard = (project) => (
    <ContentCard key={project.projectId || Math.random()}>
      <CardTitle>{project.title || 'NASA Technology Project'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>Project ID</DetailLabel>
          <DetailValue>{project.projectId || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Status</DetailLabel>
          <DetailValue>{project.status || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Start Date</DetailLabel>
          <DetailValue>{project.startDate || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>End Date</DetailLabel>
          <DetailValue>{project.endDate || 'N/A'}</DetailValue>
        </DetailItem>
        {project.description && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Description</DetailLabel>
            <DetailValue>{project.description.substring(0, 200)}...</DetailValue>
          </DetailItem>
        )}
      </CardContent>
    </ContentCard>
  );

  const renderPatentCard = (patent) => (
    <ContentCard key={patent.id || Math.random()}>
      <CardTitle>{patent.title || 'NASA Patent/Software'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>ID</DetailLabel>
          <DetailValue>{patent.id || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Category</DetailLabel>
          <DetailValue>{patent.category || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Release Date</DetailLabel>
          <DetailValue>{patent.releaseDate || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Center</DetailLabel>
          <DetailValue>{patent.center || 'N/A'}</DetailValue>
        </DetailItem>
        {patent.abstract && (
          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Abstract</DetailLabel>
            <DetailValue>{patent.abstract.substring(0, 200)}...</DetailValue>
          </DetailItem>
        )}
      </CardContent>
    </ContentCard>
  );

  const renderTLECard = (tle) => (
    <ContentCard key={tle.OBJECT_NAME || Math.random()}>
      <CardTitle>{tle.OBJECT_NAME || 'Satellite TLE Data'}</CardTitle>
      <CardContent>
        <DetailItem>
          <DetailLabel>NORAD ID</DetailLabel>
          <DetailValue>{tle.NORAD_CAT_ID || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Object Type</DetailLabel>
          <DetailValue>{tle.OBJECT_TYPE || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Country</DetailLabel>
          <DetailValue>{tle.COUNTRY_CODE || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Launch Date</DetailLabel>
          <DetailValue>{tle.LAUNCH_DATE || 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Period (minutes)</DetailLabel>
          <DetailValue>{tle.PERIOD ? parseFloat(tle.PERIOD).toFixed(2) : 'N/A'}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Inclination (deg)</DetailLabel>
          <DetailValue>{tle.INCLINATION ? parseFloat(tle.INCLINATION).toFixed(2) : 'N/A'}</DetailValue>
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
          <p style={{ color: '#ce93d8', margin: '10px 0' }}>
            Try adjusting your search parameters or check back later.
          </p>
        </ContentCard>
      );
    }

    return (
      <ContentGrid>
        {data.map((item) => {
          switch (activeTab) {
            case 'exoplanets':
              return renderExoplanetCard(item);
            case 'images':
              return renderImageCard(item);
            case 'satellites':
              return renderSatelliteCard(item);
            case 'asteroids':
              return renderAsteroidCard(item);
            case 'techport':
              return renderTechportCard(item);
            case 'patents':
              return renderPatentCard(item);
            case 'tle':
              return renderTLECard(item);
            default:
              return null;
          }
        })}
      </ContentGrid>
    );
  };

  return (
    <ExplorerContainer>
      <Header>
        <Title>🚀 Advanced NASA Explorer</Title>
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
        <Input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {activeTab === 'images' && (
          <Select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </Select>
        )}

        {(activeTab === 'techport' || activeTab === 'patents') && (
          <Input
            type="number"
            placeholder="Year"
            value={yearStart}
            onChange={(e) => setYearStart(e.target.value)}
            min="1990"
            max="2024"
          />
        )}

        <Input
          type="number"
          placeholder="Limit"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          min="1"
          max="100"
        />

        <Button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </Button>
      </Controls>

      {data && data.length > 0 && (
        <StatsGrid>
          <StatCard>
            <StatValue>{data.length}</StatValue>
            <StatLabel>Results Found</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{activeTab}</StatValue>
            <StatLabel>Data Type</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{searchQuery || 'All'}</StatValue>
            <StatLabel>Search Query</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      {renderContent()}

      <Attribution>
        Data courtesy of{' '}
        <a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noopener noreferrer">NASA Exoplanet Archive</a>
        {' • '}
        <a href="https://images.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Image and Video Library</a>
        {' • '}
        <a href="https://sscweb.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">Satellite Situation Center</a>
        {' • '}
        <a href="https://ssd.jpl.nasa.gov/" target="_blank" rel="noopener noreferrer">JPL Solar System Dynamics</a>
        {' • '}
        <a href="https://techport.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Techport</a>
        {' • '}
        <a href="https://technology.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Technology Transfer</a>
      </Attribution>
    </ExplorerContainer>
  );
};

export default AdvancedNASAExplorer;