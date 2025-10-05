/**
 * EPIC Earth Image Viewer Component
 * Displays daily Earth satellite images from NASA's EPIC camera
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const ViewerContainer = styled.div`
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="earth" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:rgba(33,150,243,0.1);stop-opacity:1" /><stop offset="100%" style="stop-color:rgba(33,150,243,0);stop-opacity:0" /></radialGradient></defs><circle cx="20" cy="20" r="10" fill="url(%23earth)"/><circle cx="80" cy="30" r="15" fill="url(%23earth)"/><circle cx="30" cy="80" r="12" fill="url(%23earth)"/></svg>') repeat;
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

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const DateInput = styled.input`
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

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
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

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
`;

const ImageCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.2);
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(33, 150, 243, 0.3);
    border-color: #2196f3;
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EarthImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 15px;
  color: white;
`;

const ImageTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #2196f3;
  margin: 0 0 10px 0;
`;

const ImageDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
`;

const MetadataCard = styled.div`
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

const MetadataValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2196f3;
  margin-bottom: 5px;
`;

const MetadataLabel = styled.div`
  font-size: 0.9rem;
  color: #90caf9;
  text-transform: uppercase;
  letter-spacing: 1px;
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

const EarthImageViewer = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageType, setImageType] = useState('natural');
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use backend EPIC endpoint instead of direct NASA API
      const response = await fetch(`http://localhost:5001/api/epic/images?date=${selectedDate}`);
      const result = await response.json();
      
      if (result.success) {
        setImages(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch EPIC images');
      }
    } catch (err) {
      setError(`Failed to load EPIC images: ${err.message}`);
      console.error('EPIC images fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, imageType]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getImageUrl = (image) => {
    // If the backend provides an imageUrl, use it
    if (image.imageUrl) {
      return image.imageUrl;
    }
    
    // Fallback to constructing the URL from image data
    if (image.image && image.date) {
      const date = image.date.split(' ')[0].replace(/-/g, '/');
      return `https://epic.gsfc.nasa.gov/archive/${imageType}/${date.split('/')[0]}/${date.split('/')[1]}/${date.split('/')[2]}/png/${image.image}.png`;
    }
    
    // Ultimate fallback to a placeholder Earth image
    return 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop&crop=center';
  };

  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  if (loading) {
    return (
      <ViewerContainer>
        <Header>
          <Title>🌍 EPIC Earth Viewer</Title>
        </Header>
        <LoadingSpinner>Loading Earth images from space...</LoadingSpinner>
      </ViewerContainer>
    );
  }

  if (error) {
    return (
      <ViewerContainer>
        <Header>
          <Title>🌍 EPIC Earth Viewer</Title>
        </Header>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={fetchImages}>Try Again</Button>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer>
      <Header>
        <Title>🌍 EPIC Earth Viewer</Title>
        <Controls>
          <DateInput
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          <Select value={imageType} onChange={(e) => setImageType(e.target.value)}>
            <option value="natural">Natural Color</option>
            <option value="enhanced">Enhanced Color</option>
          </Select>
          <Button onClick={fetchImages}>Load Images</Button>
        </Controls>
      </Header>

      {images.length > 0 && (
        <MetadataGrid>
          <MetadataCard>
            <MetadataValue>{images.length}</MetadataValue>
            <MetadataLabel>Images Available</MetadataLabel>
          </MetadataCard>
          <MetadataCard>
            <MetadataValue>{formatDate(images[0]?.date).split(',')[0]}</MetadataValue>
            <MetadataLabel>Capture Date</MetadataLabel>
          </MetadataCard>
          <MetadataCard>
            <MetadataValue>{imageType === 'natural' ? 'Natural' : 'Enhanced'}</MetadataValue>
            <MetadataLabel>Color Mode</MetadataLabel>
          </MetadataCard>
          <MetadataCard>
            <MetadataValue>DSCOVR</MetadataValue>
            <MetadataLabel>Satellite</MetadataLabel>
          </MetadataCard>
        </MetadataGrid>
      )}

      <ImageGrid>
        {images.map((image, index) => {
          const imageUrl = getImageUrl(image);
          
          return (
            <ImageCard key={`${image.image}-${index}`} onClick={() => openFullscreen(imageUrl)}>
              <ImageContainer>
                <EarthImage
                  src={imageUrl}
                  alt={`Earth from EPIC - ${image.date}`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none', color: '#90caf9', textAlign: 'center' }}>
                  Image not available
                </div>
                <ImageOverlay>
                  <ImageTitle>Earth View #{index + 1}</ImageTitle>
                </ImageOverlay>
              </ImageContainer>

              <ImageDetails>
                <DetailItem>
                  <DetailLabel>Capture Time</DetailLabel>
                  <DetailValue>{formatDate(image.date).split(' at ')[1]}</DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Centroid Lat</DetailLabel>
                  <DetailValue>{image.centroid_coordinates?.lat?.toFixed(2)}°</DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Centroid Lon</DetailLabel>
                  <DetailValue>{image.centroid_coordinates?.lon?.toFixed(2)}°</DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>DSCOVR Position</DetailLabel>
                  <DetailValue>
                    J2000: ({image.dscovr_j2000_position?.x?.toFixed(0)}, {image.dscovr_j2000_position?.y?.toFixed(0)}, {image.dscovr_j2000_position?.z?.toFixed(0)})
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Lunar Position</DetailLabel>
                  <DetailValue>
                    J2000: ({image.lunar_j2000_position?.x?.toFixed(0)}, {image.lunar_j2000_position?.y?.toFixed(0)}, {image.lunar_j2000_position?.z?.toFixed(0)})
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <DetailLabel>Sun Position</DetailLabel>
                  <DetailValue>
                    J2000: ({image.sun_j2000_position?.x?.toFixed(0)}, {image.sun_j2000_position?.y?.toFixed(0)}, {image.sun_j2000_position?.z?.toFixed(0)})
                  </DetailValue>
                </DetailItem>

                {image.attitude_quaternions && (
                  <DetailItem>
                    <DetailLabel>Attitude</DetailLabel>
                    <DetailValue>
                      Q: ({image.attitude_quaternions.q0?.toFixed(3)}, {image.attitude_quaternions.q1?.toFixed(3)}, {image.attitude_quaternions.q2?.toFixed(3)}, {image.attitude_quaternions.q3?.toFixed(3)})
                    </DetailValue>
                  </DetailItem>
                )}
              </ImageDetails>
            </ImageCard>
          );
        })}

        {images.length === 0 && (
          <ImageCard>
            <ImageTitle>No images available for the selected date.</ImageTitle>
            <p style={{ color: '#90caf9', margin: '10px 0' }}>
              Try selecting a different date. EPIC images are typically available from 2015 onwards.
            </p>
          </ImageCard>
        )}
      </ImageGrid>

      {fullscreenImage && (
        <FullscreenModal onClick={closeFullscreen}>
          <CloseButton onClick={closeFullscreen}>×</CloseButton>
          <FullscreenImage src={fullscreenImage} alt="Earth from EPIC - Fullscreen" />
        </FullscreenModal>
      )}

      <Attribution>
        Images courtesy of <a href="https://epic.gsfc.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA EPIC</a>
        {' • '}
        <a href="https://www.nesdis.noaa.gov/content/dscovr-deep-space-climate-observatory" target="_blank" rel="noopener noreferrer">DSCOVR Mission</a>
        {' • '}
        Data from the <a href="https://www.nesdis.noaa.gov/" target="_blank" rel="noopener noreferrer">NOAA/NESDIS</a>
      </Attribution>
    </ViewerContainer>
  );
};

export default EarthImageViewer;