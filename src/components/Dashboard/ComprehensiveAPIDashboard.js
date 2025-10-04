/**
 * Comprehensive API Dashboard
 * Main dashboard integrating all NASA and partner API components
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Import all API components
import APODViewer from '../APOD/APODViewer.js';
import NeoTracker from '../NeoWs/NeoTracker.js';
import SpaceWeatherDashboard from '../DONKI/SpaceWeatherDashboard.js';
import NaturalEventsTracker from '../EONET/NaturalEventsTracker.js';
import EarthImageViewer from '../EPIC/EarthImageViewer.js';
import MarsExplorer from '../Mars/MarsExplorer.js';
import AdvancedNASAExplorer from '../Advanced/AdvancedNASAExplorer.js';
import PartnerAPIsExplorer from '../Partners/PartnerAPIsExplorer.js';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0d1421 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  padding: 20px;
  position: relative;
  overflow-x: hidden;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="star1" cx="50%" cy="50%" r="2px"><stop offset="0%" style="stop-color:white;stop-opacity:1" /><stop offset="100%" style="stop-color:white;stop-opacity:0" /></radialGradient><radialGradient id="star2" cx="50%" cy="50%" r="1px"><stop offset="0%" style="stop-color:rgba(255,255,255,0.8);stop-opacity:1" /><stop offset="100%" style="stop-color:rgba(255,255,255,0.8);stop-opacity:0" /></radialGradient></defs><circle cx="100" cy="150" r="1" fill="url(%23star1)"/><circle cx="300" cy="80" r="0.5" fill="url(%23star2)"/><circle cx="500" cy="200" r="1" fill="url(%23star1)"/><circle cx="700" cy="120" r="0.5" fill="url(%23star2)"/><circle cx="900" cy="180" r="1" fill="url(%23star1)"/><circle cx="150" cy="350" r="0.5" fill="url(%23star2)"/><circle cx="350" cy="280" r="1" fill="url(%23star1)"/><circle cx="550" cy="400" r="0.5" fill="url(%23star2)"/><circle cx="750" cy="320" r="1" fill="url(%23star1)"/><circle cx="950" cy="380" r="0.5" fill="url(%23star2)"/><circle cx="200" cy="550" r="1" fill="url(%23star1)"/><circle cx="400" cy="480" r="0.5" fill="url(%23star2)"/><circle cx="600" cy="600" r="1" fill="url(%23star1)"/><circle cx="800" cy="520" r="0.5" fill="url(%23star2)"/><circle cx="50" cy="750" r="1" fill="url(%23star1)"/><circle cx="250" cy="680" r="0.5" fill="url(%23star2)"/><circle cx="450" cy="800" r="1" fill="url(%23star1)"/><circle cx="650" cy="720" r="0.5" fill="url(%23star2)"/><circle cx="850" cy="780" r="1" fill="url(%23star1)"/><circle cx="100" cy="950" r="0.5" fill="url(%23star2)"/><circle cx="300" cy="880" r="1" fill="url(%23star1)"/><circle cx="500" cy="920" r="0.5" fill="url(%23star2)"/><circle cx="700" cy="860" r="1" fill="url(%23star1)"/><circle cx="900" cy="940" r="0.5" fill="url(%23star2)"/></svg>') repeat;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const MainTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 15px 0;
  animation: gradientShift 8s ease-in-out infinite;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.1);

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 30px 0;
  font-weight: 300;
  letter-spacing: 1px;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const NavigationTabs = styled.div`
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 25px;
  padding: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  justify-content: center;
  max-width: 100%;
  overflow-x: auto;

  @media (max-width: 768px) {
    gap: 4px;
    padding: 6px;
  }
`;

const NavTab = styled.button`
  background: ${props => props.active ? 
    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' : 
    'transparent'};
  border: 2px solid ${props => props.active ? '#667eea' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 20px;
  padding: 12px 20px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 12px;
    gap: 4px;
  }
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
`;

const StatsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 20, 33, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: white;
  font-size: 1.2rem;
  text-align: center;
`;

const Attribution = styled.div`
  margin-top: 60px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  position: relative;
  z-index: 1;
`;

const AttributionTitle = styled.h3`
  color: #667eea;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 600;
`;

const AttributionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const AttributionCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const AttributionLink = styled.a`
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 1.1rem;
  display: block;
  margin-bottom: 8px;

  &:hover {
    text-decoration: underline;
    color: #764ba2;
  }
`;

const AttributionDesc = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
`;

const ComprehensiveAPIDashboard = () => {
  const [activeTab, setActiveTab] = useState('apod');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'apod', label: 'APOD', icon: '🌌', title: 'Astronomy Picture of the Day' },
    { id: 'neo', label: 'NEO Tracker', icon: '☄️', title: 'Near Earth Objects' },
    { id: 'space-weather', label: 'Space Weather', icon: '🌞', title: 'Solar Activity & Space Weather' },
    { id: 'natural-events', label: 'Earth Events', icon: '🌍', title: 'Natural Earth Events' },
    { id: 'earth-images', label: 'Earth Images', icon: '🛰️', title: 'EPIC Earth Imagery' },
    { id: 'mars', label: 'Mars Explorer', icon: '🔴', title: 'Mars Weather & Photos' },
    { id: 'advanced', label: 'Advanced APIs', icon: '🚀', title: 'Advanced NASA APIs' },
    { id: 'partners', label: 'Partner APIs', icon: '🤝', title: 'Partner & External APIs' }
  ];

  const stats = [
    { icon: '🛰️', value: '20+', label: 'NASA APIs' },
    { icon: '🌍', value: '5+', label: 'Partner APIs' },
    { icon: '📊', value: 'Real-time', label: 'Data Updates' },
    { icon: '🔬', value: 'Scientific', label: 'Accuracy' },
    { icon: '🎯', value: '100%', label: 'Coverage' },
    { icon: '⚡', value: 'Fast', label: 'Performance' }
  ];

  const attributions = [
    {
      name: 'NASA Open Data',
      url: 'https://data.nasa.gov/',
      description: 'Primary source for space science data, imagery, and research'
    },
    {
      name: 'USGS Earthquake Hazards',
      url: 'https://earthquake.usgs.gov/',
      description: 'Real-time earthquake monitoring and geological data'
    },
    {
      name: 'OpenWeatherMap',
      url: 'https://openweathermap.org/',
      description: 'Global weather data and meteorological services'
    },
    {
      name: 'NASA Exoplanet Archive',
      url: 'https://exoplanetarchive.ipac.caltech.edu/',
      description: 'Comprehensive database of confirmed exoplanets'
    },
    {
      name: 'JPL Solar System Dynamics',
      url: 'https://ssd.jpl.nasa.gov/',
      description: 'Precise orbital data for solar system objects'
    },
    {
      name: 'OpenStreetMap',
      url: 'https://www.openstreetmap.org/',
      description: 'Free, editable map data for global geographic context'
    }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'apod':
        return <APODViewer />;
      case 'neo':
        return <NeoTracker />;
      case 'space-weather':
        return <SpaceWeatherDashboard />;
      case 'natural-events':
        return <NaturalEventsTracker />;
      case 'earth-images':
        return <EarthImageViewer />;
      case 'mars':
        return <MarsExplorer />;
      case 'advanced':
        return <AdvancedNASAExplorer />;
      case 'partners':
        return <PartnerAPIsExplorer />;
      default:
        return <APODViewer />;
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <DashboardContainer>
      {loading && (
        <LoadingOverlay>
          <div>
            <LoadingSpinner />
            <LoadingText>Loading NASA Data...</LoadingText>
          </div>
        </LoadingOverlay>
      )}

      <Header>
        <MainTitle>🚀 NASA API Explorer</MainTitle>
        <Subtitle>
          Comprehensive integration of NASA and partner APIs for space science exploration
        </Subtitle>
      </Header>

      <StatsOverview>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatIcon>{stat.icon}</StatIcon>
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsOverview>

      <NavigationContainer>
        <NavigationTabs>
          {tabs.map(tab => (
            <NavTab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.title}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </NavTab>
          ))}
        </NavigationTabs>
      </NavigationContainer>

      <ContentContainer>
        {renderActiveComponent()}
      </ContentContainer>

      <Attribution>
        <AttributionTitle>🙏 Data Sources & Attribution</AttributionTitle>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px' }}>
          This application integrates data from multiple NASA and partner organizations. 
          We gratefully acknowledge these sources for making their data freely available.
        </p>
        <AttributionGrid>
          {attributions.map((attr, index) => (
            <AttributionCard key={index}>
              <AttributionLink href={attr.url} target="_blank" rel="noopener noreferrer">
                {attr.name}
              </AttributionLink>
              <AttributionDesc>{attr.description}</AttributionDesc>
            </AttributionCard>
          ))}
        </AttributionGrid>
      </Attribution>
    </DashboardContainer>
  );
};

export default ComprehensiveAPIDashboard;