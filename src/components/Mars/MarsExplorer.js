/**
 * Mars Explorer Component
 * Combines Mars InSight Weather data and Mars Rover Photos
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const ExplorerContainer = styled.div`
  background: linear-gradient(135deg, #d84315 0%, #ff5722 50%, #ff8a65 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="mars" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:rgba(255,87,34,0.1);stop-opacity:1" /><stop offset="100%" style="stop-color:rgba(255,87,34,0);stop-opacity:0" /></radialGradient></defs><circle cx="25" cy="25" r="12" fill="url(%23mars)"/><circle cx="75" cy="35" r="18" fill="url(%23mars)"/><circle cx="40" cy="75" r="15" fill="url(%23mars)"/></svg>') repeat;
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
  background: linear-gradient(45deg, #ff5722, #ff8a65, #ffab91);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
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
    'linear-gradient(45deg, #ff5722, #ff8a65)' : 
    'rgba(255, 255, 255, 0.1)'};
  border: 2px solid ${props => props.active ? '#ff5722' : 'rgba(255, 87, 34, 0.3)'};
  border-radius: 25px;
  padding: 12px 24px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    border-color: #ff5722;
    transform: translateY(-2px);
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

const Select = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 87, 34, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ff5722;
    box-shadow: 0 0 10px rgba(255, 87, 34, 0.3);
  }

  option {
    background: #d84315;
    color: white;
  }
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 87, 34, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ff5722;
    box-shadow: 0 0 10px rgba(255, 87, 34, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #ff5722, #ff8a65);
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
    box-shadow: 0 5px 15px rgba(255, 87, 34, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Weather Components
const WeatherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
`;

const WeatherCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 87, 34, 0.2);
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(255, 87, 34, 0.3);
    border-color: #ff5722;
  }
`;

const WeatherTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #ff5722;
  margin: 0 0 15px 0;
  text-align: center;
`;

const WeatherDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
`;

const WeatherItem = styled.div`
  text-align: center;
`;

const WeatherValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff8a65;
  margin-bottom: 5px;
`;

const WeatherLabel = styled.div`
  font-size: 0.8rem;
  color: #ffab91;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

// Photo Components
const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  position: relative;
  z-index: 1;
`;

const PhotoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 87, 34, 0.2);
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(255, 87, 34, 0.3);
    border-color: #ff5722;
  }
`;

const PhotoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
`;

const MarsPhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const PhotoOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 15px;
  color: white;
`;

const PhotoInfo = styled.div`
  padding: 15px;
`;

const PhotoTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ff5722;
  margin: 0 0 10px 0;
`;

const PhotoDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
`;

const PhotoDetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const PhotoDetailLabel = styled.span`
  font-size: 0.8rem;
  color: #ffab91;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const PhotoDetailValue = styled.span`
  font-size: 0.9rem;
  color: white;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #ff5722;
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

const FullscreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
`;

const FullscreenImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 10px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Attribution = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  color: #ffab91;
  text-align: center;
  position: relative;
  z-index: 1;

  a {
    color: #ff5722;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const MarsExplorer = () => {
  const [activeTab, setActiveTab] = useState('weather');
  const [weatherData, setWeatherData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  // Photo controls
  const [selectedRover, setSelectedRover] = useState('curiosity');
  const [selectedCamera, setSelectedCamera] = useState('all');
  const [sol, setSol] = useState('1000');
  const [earthDate, setEarthDate] = useState('');

  const rovers = [
    { name: 'curiosity', displayName: 'Curiosity' },
    { name: 'opportunity', displayName: 'Opportunity' },
    { name: 'spirit', displayName: 'Spirit' },
    { name: 'perseverance', displayName: 'Perseverance' }
  ];

  const cameras = {
    curiosity: [
      { name: 'all', displayName: 'All Cameras' },
      { name: 'FHAZ', displayName: 'Front Hazard Avoidance Camera' },
      { name: 'RHAZ', displayName: 'Rear Hazard Avoidance Camera' },
      { name: 'MAST', displayName: 'Mast Camera' },
      { name: 'CHEMCAM', displayName: 'Chemistry and Camera Complex' },
      { name: 'MAHLI', displayName: 'Mars Hand Lens Imager' },
      { name: 'MARDI', displayName: 'Mars Descent Imager' },
      { name: 'NAVCAM', displayName: 'Navigation Camera' }
    ],
    perseverance: [
      { name: 'all', displayName: 'All Cameras' },
      { name: 'EDL_RUCAM', displayName: 'Rover Up-Look Camera' },
      { name: 'EDL_RDCAM', displayName: 'Rover Down-Look Camera' },
      { name: 'EDL_DDCAM', displayName: 'Descent Stage Down-Look Camera' },
      { name: 'EDL_PUCAM1', displayName: 'Parachute Up-Look Camera A' },
      { name: 'EDL_PUCAM2', displayName: 'Parachute Up-Look Camera B' },
      { name: 'NAVCAM_LEFT', displayName: 'Navigation Camera - Left' },
      { name: 'NAVCAM_RIGHT', displayName: 'Navigation Camera - Right' },
      { name: 'MCZ_LEFT', displayName: 'Mast Camera Zoom - Left' },
      { name: 'MCZ_RIGHT', displayName: 'Mast Camera Zoom - Right' },
      { name: 'FRONT_HAZCAM_LEFT_A', displayName: 'Front Hazard Camera - Left A' },
      { name: 'FRONT_HAZCAM_RIGHT_A', displayName: 'Front Hazard Camera - Right A' },
      { name: 'REAR_HAZCAM_LEFT', displayName: 'Rear Hazard Camera - Left' },
      { name: 'REAR_HAZCAM_RIGHT', displayName: 'Rear Hazard Camera - Right' }
    ],
    opportunity: [
      { name: 'all', displayName: 'All Cameras' },
      { name: 'FHAZ', displayName: 'Front Hazard Avoidance Camera' },
      { name: 'RHAZ', displayName: 'Rear Hazard Avoidance Camera' },
      { name: 'NAVCAM', displayName: 'Navigation Camera' },
      { name: 'PANCAM', displayName: 'Panoramic Camera' },
      { name: 'MINITES', displayName: 'Miniature Thermal Emission Spectrometer' }
    ],
    spirit: [
      { name: 'all', displayName: 'All Cameras' },
      { name: 'FHAZ', displayName: 'Front Hazard Avoidance Camera' },
      { name: 'RHAZ', displayName: 'Rear Hazard Avoidance Camera' },
      { name: 'NAVCAM', displayName: 'Navigation Camera' },
      { name: 'PANCAM', displayName: 'Panoramic Camera' },
      { name: 'MINITES', displayName: 'Miniature Thermal Emission Spectrometer' }
    ]
  };

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await comprehensiveAPIService.getMarsWeather();
      setWeatherData(data);
    } catch (err) {
      setError(`Failed to load Mars weather data: ${err.message}`);
      console.error('Mars weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        rover: selectedRover,
        camera: selectedCamera === 'all' ? undefined : selectedCamera,
        sol: sol ? parseInt(sol) : undefined,
        earth_date: earthDate || undefined
      };
      
      const data = await comprehensiveAPIService.getMarsRoverPhotos(params);
      setPhotos(data.photos || []);
    } catch (err) {
      setError(`Failed to load Mars rover photos: ${err.message}`);
      console.error('Mars photos fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRover, selectedCamera, sol, earthDate]);

  useEffect(() => {
    if (activeTab === 'weather') {
      fetchWeatherData();
    } else {
      fetchPhotos();
    }
  }, [activeTab, fetchWeatherData, fetchPhotos]);

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) return 'N/A';
    return `${temp}°C (${(temp * 9/5 + 32).toFixed(1)}°F)`;
  };

  const formatPressure = (pressure) => {
    if (pressure === null || pressure === undefined) return 'N/A';
    return `${pressure} Pa`;
  };

  const formatWindSpeed = (speed) => {
    if (speed === null || speed === undefined) return 'N/A';
    return `${speed} m/s`;
  };

  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <ExplorerContainer>
      <Header>
        <Title>🔴 Mars Explorer</Title>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'weather'} 
          onClick={() => setActiveTab('weather')}
        >
          🌡️ Weather Data
        </Tab>
        <Tab 
          active={activeTab === 'photos'} 
          onClick={() => setActiveTab('photos')}
        >
          📸 Rover Photos
        </Tab>
      </TabContainer>

      {activeTab === 'weather' && (
        <>
          <Controls>
            <Button onClick={fetchWeatherData} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Weather'}
            </Button>
          </Controls>

          {loading && (
            <LoadingSpinner>Loading Mars weather data...</LoadingSpinner>
          )}

          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          {weatherData && !loading && (
            <WeatherGrid>
              {Object.entries(weatherData.sol_keys || {}).map(([sol, data]) => (
                <WeatherCard key={sol}>
                  <WeatherTitle>Sol {sol}</WeatherTitle>
                  <WeatherDetails>
                    <WeatherItem>
                      <WeatherValue>
                        {data.AT?.av ? formatTemperature(data.AT.av) : 'N/A'}
                      </WeatherValue>
                      <WeatherLabel>Avg Temp</WeatherLabel>
                    </WeatherItem>

                    <WeatherItem>
                      <WeatherValue>
                        {data.AT?.mx ? formatTemperature(data.AT.mx) : 'N/A'}
                      </WeatherValue>
                      <WeatherLabel>Max Temp</WeatherLabel>
                    </WeatherItem>

                    <WeatherItem>
                      <WeatherValue>
                        {data.AT?.mn ? formatTemperature(data.AT.mn) : 'N/A'}
                      </WeatherValue>
                      <WeatherLabel>Min Temp</WeatherLabel>
                    </WeatherItem>

                    <WeatherItem>
                      <WeatherValue>
                        {data.PRE?.av ? formatPressure(data.PRE.av) : 'N/A'}
                      </WeatherValue>
                      <WeatherLabel>Pressure</WeatherLabel>
                    </WeatherItem>

                    <WeatherItem>
                      <WeatherValue>
                        {data.HWS?.av ? formatWindSpeed(data.HWS.av) : 'N/A'}
                      </WeatherValue>
                      <WeatherLabel>Wind Speed</WeatherLabel>
                    </WeatherItem>

                    <WeatherItem>
                      <WeatherValue>
                        {data.WD?.most_common?.compass_point || 'N/A'}
                      </WeatherValue>
                      <WeatherLabel>Wind Direction</WeatherLabel>
                    </WeatherItem>
                  </WeatherDetails>
                </WeatherCard>
              ))}

              {(!weatherData.sol_keys || Object.keys(weatherData.sol_keys).length === 0) && (
                <WeatherCard>
                  <WeatherTitle>No Recent Weather Data</WeatherTitle>
                  <p style={{ color: '#ffab91', textAlign: 'center', margin: '10px 0' }}>
                    Mars InSight weather data may not be available for recent sols.
                  </p>
                </WeatherCard>
              )}
            </WeatherGrid>
          )}
        </>
      )}

      {activeTab === 'photos' && (
        <>
          <Controls>
            <Select value={selectedRover} onChange={(e) => setSelectedRover(e.target.value)}>
              {rovers.map(rover => (
                <option key={rover.name} value={rover.name}>
                  {rover.displayName}
                </option>
              ))}
            </Select>

            <Select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)}>
              {cameras[selectedRover]?.map(camera => (
                <option key={camera.name} value={camera.name}>
                  {camera.displayName}
                </option>
              ))}
            </Select>

            <Input
              type="number"
              placeholder="Sol (Martian day)"
              value={sol}
              onChange={(e) => setSol(e.target.value)}
              min="1"
            />

            <Input
              type="date"
              placeholder="Earth Date"
              value={earthDate}
              onChange={(e) => setEarthDate(e.target.value)}
            />

            <Button onClick={fetchPhotos} disabled={loading}>
              {loading ? 'Loading...' : 'Load Photos'}
            </Button>
          </Controls>

          {loading && (
            <LoadingSpinner>Loading Mars rover photos...</LoadingSpinner>
          )}

          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          {!loading && (
            <PhotoGrid>
              {photos.map((photo) => (
                <PhotoCard key={photo.id} onClick={() => openFullscreen(photo.img_src)}>
                  <PhotoContainer>
                    <MarsPhoto
                      src={photo.img_src}
                      alt={`Mars photo by ${photo.rover.name} - ${photo.camera.full_name}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{ display: 'none', color: '#ffab91', textAlign: 'center', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      Image not available
                    </div>
                    <PhotoOverlay>
                      <PhotoTitle>{photo.camera.full_name}</PhotoTitle>
                    </PhotoOverlay>
                  </PhotoContainer>

                  <PhotoInfo>
                    <PhotoDetails>
                      <PhotoDetailItem>
                        <PhotoDetailLabel>Rover</PhotoDetailLabel>
                        <PhotoDetailValue>{photo.rover.name}</PhotoDetailValue>
                      </PhotoDetailItem>

                      <PhotoDetailItem>
                        <PhotoDetailLabel>Sol</PhotoDetailLabel>
                        <PhotoDetailValue>{photo.sol}</PhotoDetailValue>
                      </PhotoDetailItem>

                      <PhotoDetailItem>
                        <PhotoDetailLabel>Earth Date</PhotoDetailLabel>
                        <PhotoDetailValue>{photo.earth_date}</PhotoDetailValue>
                      </PhotoDetailItem>

                      <PhotoDetailItem>
                        <PhotoDetailLabel>Camera</PhotoDetailLabel>
                        <PhotoDetailValue>{photo.camera.name}</PhotoDetailValue>
                      </PhotoDetailItem>

                      <PhotoDetailItem>
                        <PhotoDetailLabel>Status</PhotoDetailLabel>
                        <PhotoDetailValue>{photo.rover.status}</PhotoDetailValue>
                      </PhotoDetailItem>

                      <PhotoDetailItem>
                        <PhotoDetailLabel>Landing Date</PhotoDetailLabel>
                        <PhotoDetailValue>{photo.rover.landing_date}</PhotoDetailValue>
                      </PhotoDetailItem>
                    </PhotoDetails>
                  </PhotoInfo>
                </PhotoCard>
              ))}

              {photos.length === 0 && !loading && (
                <PhotoCard>
                  <PhotoInfo>
                    <PhotoTitle>No photos found</PhotoTitle>
                    <p style={{ color: '#ffab91', margin: '10px 0' }}>
                      Try adjusting the rover, camera, sol, or date filters.
                    </p>
                  </PhotoInfo>
                </PhotoCard>
              )}
            </PhotoGrid>
          )}
        </>
      )}

      {fullscreenImage && (
        <FullscreenModal onClick={closeFullscreen}>
          <CloseButton onClick={closeFullscreen}>×</CloseButton>
          <FullscreenImage src={fullscreenImage} alt="Mars photo - Fullscreen" />
        </FullscreenModal>
      )}

      <Attribution>
        Data courtesy of <a href="https://mars.nasa.gov/insight/" target="_blank" rel="noopener noreferrer">NASA Mars InSight</a>
        {' • '}
        <a href="https://mars.nasa.gov/mars2020/" target="_blank" rel="noopener noreferrer">Mars 2020 Perseverance</a>
        {' • '}
        <a href="https://mars.nasa.gov/msl/" target="_blank" rel="noopener noreferrer">Mars Science Laboratory</a>
        {' • '}
        <a href="https://mars.nasa.gov/mer/" target="_blank" rel="noopener noreferrer">Mars Exploration Rovers</a>
      </Attribution>
    </ExplorerContainer>
  );
};

export default MarsExplorer;