/**
 * APOD (Astronomy Picture of the Day) Viewer Component
 * Displays NASA's daily astronomy images with educational content
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import comprehensiveAPIService from '../../services/comprehensive-api-service.js';

const APODContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
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
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="star" cx="50%" cy="50%" r="50%"><stop offset="0%" style="stop-color:white;stop-opacity:1" /><stop offset="100%" style="stop-color:white;stop-opacity:0" /></radialGradient></defs><circle cx="20" cy="20" r="1" fill="url(%23star)" opacity="0.8"/><circle cx="80" cy="30" r="0.5" fill="url(%23star)" opacity="0.6"/><circle cx="60" cy="70" r="0.8" fill="url(%23star)" opacity="0.7"/><circle cx="30" cy="80" r="0.6" fill="url(%23star)" opacity="0.5"/><circle cx="90" cy="60" r="0.4" fill="url(%23star)" opacity="0.8"/></svg>') repeat;
    opacity: 0.1;
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
`;

const Title = styled.h2`
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #64b5f6, #42a5f5, #2196f3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const DateControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const DateInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(100, 181, 246, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #64b5f6;
    box-shadow: 0 0 10px rgba(100, 181, 246, 0.3);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #2196f3, #1976d2);
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

const ContentArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ImageSection = styled.div`
  position: relative;
`;

const APODImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
  }
`;

const VideoContainer = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
`;

const APODVideo = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const APODTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  color: #64b5f6;
  margin: 0;
  line-height: 1.3;
`;

const APODDate = styled.div`
  font-size: 1rem;
  color: #90caf9;
  font-weight: 500;
`;

const APODExplanation = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #e3f2fd;
  margin: 0;
  text-align: justify;
`;

const Copyright = styled.div`
  font-size: 0.9rem;
  color: #bbdefb;
  font-style: italic;
  margin-top: 10px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #64b5f6;
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
  color: #90caf9;
  text-align: center;

  a {
    color: #64b5f6;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const FullscreenModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
`;

const FullscreenImage = styled.img`
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 8px;
`;

const APODViewer = () => {
  const [apodData, setApodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const fetchAPOD = async (date = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await comprehensiveAPIService.getAPOD(date);
      setApodData(data);
    } catch (err) {
      setError(`Failed to load APOD data: ${err.message}`);
      console.error('APOD fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAPOD();
  }, []);

  const handleDateChange = (event) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
  };

  const handleDateSubmit = () => {
    fetchAPOD(selectedDate);
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchAPOD();
  };

  const handleRandomClick = () => {
    // Generate random date between APOD start (1995-06-16) and today
    const startDate = new Date('1995-06-16');
    const endDate = new Date();
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const randomDate = new Date(randomTime).toISOString().split('T')[0];
    setSelectedDate(randomDate);
    fetchAPOD(randomDate);
  };

  const handleImageClick = () => {
    if (apodData && apodData.media_type === 'image') {
      setShowFullscreen(true);
    }
  };

  const handleFullscreenClose = () => {
    setShowFullscreen(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVideoEmbedUrl = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop()
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <APODContainer>
        <Header>
          <Title>🌌 Astronomy Picture of the Day</Title>
        </Header>
        <LoadingSpinner>Loading today's cosmic wonder...</LoadingSpinner>
      </APODContainer>
    );
  }

  if (error) {
    return (
      <APODContainer>
        <Header>
          <Title>🌌 Astronomy Picture of the Day</Title>
        </Header>
        <ErrorMessage>{error}</ErrorMessage>
        <Button onClick={() => fetchAPOD()}>Try Again</Button>
      </APODContainer>
    );
  }

  return (
    <>
      <APODContainer>
        <Header>
          <Title>🌌 Astronomy Picture of the Day</Title>
          <DateControls>
            <DateInput
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min="1995-06-16"
              max={new Date().toISOString().split('T')[0]}
            />
            <Button onClick={handleDateSubmit}>Load Date</Button>
            <Button onClick={handleTodayClick}>Today</Button>
            <Button onClick={handleRandomClick}>Random</Button>
          </DateControls>
        </Header>

        {apodData && (
          <ContentArea>
            <ImageSection>
              {apodData.media_type === 'image' ? (
                <APODImage
                  src={apodData.url}
                  alt={apodData.title}
                  onClick={handleImageClick}
                />
              ) : (
                <VideoContainer>
                  <APODVideo
                    src={getVideoEmbedUrl(apodData.url)}
                    title={apodData.title}
                    allowFullScreen
                  />
                </VideoContainer>
              )}
            </ImageSection>

            <InfoSection>
              <APODTitle>{apodData.title}</APODTitle>
              <APODDate>{formatDate(apodData.date)}</APODDate>
              <APODExplanation>{apodData.explanation}</APODExplanation>
              {apodData.copyright && (
                <Copyright>© {apodData.copyright}</Copyright>
              )}
            </InfoSection>
          </ContentArea>
        )}

        <Attribution>
          Data provided by <a href="https://apod.nasa.gov/apod/" target="_blank" rel="noopener noreferrer">NASA APOD</a>
          {' • '}
          <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA Open Data Portal</a>
        </Attribution>
      </APODContainer>

      {showFullscreen && apodData && (
        <FullscreenModal onClick={handleFullscreenClose}>
          <FullscreenImage
            src={apodData.hdurl || apodData.url}
            alt={apodData.title}
          />
        </FullscreenModal>
      )}
    </>
  );
};

export default APODViewer;