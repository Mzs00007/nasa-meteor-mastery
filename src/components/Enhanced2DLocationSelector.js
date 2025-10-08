import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulation } from '../context/SimulationContext';
import { GlassInput, GlassButton, GlassPanel } from './ui/GlassComponents';
import './Enhanced2DLocationSelector.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom impact target icon
const createTargetIcon = () => {
  return L.divIcon({
    className: 'target-marker',
    html: `<div class="target-crosshair">
             <div class="target-center"></div>
             <div class="target-ring"></div>
             <div class="target-outer-ring"></div>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Map click handler component
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ latitude: lat, longitude: lng });
    }
  });
  return null;
};

// Map controller component for programmatic map control
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.latitude && center.longitude) {
      map.setView([center.latitude, center.longitude], zoom || 10);
    }
  }, [map, center, zoom]);
  
  return null;
};

const Enhanced2DLocationSelector = ({ 
  onLocationChange = null,
  className = "",
  showSearchPanel = true,
  mapHeight = "400px",
  defaultZoom = 6
}) => {
  const { impactLocation, setImpactLocation } = useSimulation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(impactLocation);
  const [mapCenter, setMapCenter] = useState(impactLocation || { latitude: 40.7128, longitude: -74.0060 });
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);
  const mapRef = useRef(null);

  // Update selected location when impactLocation changes
  useEffect(() => {
    if (impactLocation) {
      setSelectedLocation(impactLocation);
      setMapCenter(impactLocation);
    }
  }, [impactLocation]);

  // Debounced search function
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const formattedResults = data.map((item, index) => ({
        id: item.place_id || index,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || 'location',
        importance: item.importance || 0
      }));
      
      setSearchResults(formattedResults);
      setShowResults(formattedResults.length > 0);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again or click on the map to select a location.');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = useCallback(async (location) => {
    const newLocation = {
      latitude: location.latitude || location.lat,
      longitude: location.longitude || location.lng,
      name: location.name || 'Selected Location'
    };

    setSelectedLocation(newLocation);
    setMapCenter(newLocation);
    setMapZoom(12);
    setShowResults(false);
    setSearchQuery('');
    setError(null);

    // Update the simulation context
    setImpactLocation(newLocation);
    
    // Call external callback if provided
    if (onLocationChange) {
      onLocationChange(newLocation);
    }

    // Try to get location name from reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.latitude}&lon=${newLocation.longitude}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const name = data.display_name?.split(',')[0] || 'Selected Location';
        setLocationName(name);
        
        const updatedLocation = { ...newLocation, name };
        setSelectedLocation(updatedLocation);
        setImpactLocation(updatedLocation);
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }
  }, [setImpactLocation, onLocationChange]);

  const handleMapClick = useCallback((location) => {
    handleLocationSelect(location);
  }, [handleLocationSelect]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: 'Current Location'
        };
        handleLocationSelect(location);
      },
      (error) => {
        let errorMessage = 'Unable to get your current location. ';
        let suggestion = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied.';
            suggestion = 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            suggestion = 'Try clicking on the map to select a location manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            suggestion = 'Please try again or select a location on the map.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            suggestion = 'Please select a location on the map.';
            break;
        }
        
        setError(`${errorMessage} ${suggestion}`);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 600000
      }
    );
  };

  const formatCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    const direction = type === 'lat' 
      ? (num >= 0 ? 'N' : 'S')
      : (num >= 0 ? 'E' : 'W');
    
    return `${Math.abs(num).toFixed(4)}° ${direction}`;
  };

  const popularLocations = [
    { name: 'New York City', latitude: 40.7128, longitude: -74.0060 },
    { name: 'London', latitude: 51.5074, longitude: -0.1278 },
    { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    { name: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
    { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
    { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437 }
  ];

  return (
    <GlassPanel className={`enhanced-2d-location-selector ${className}`}>
      <div className="location-selector-header">
        <h3>🎯 Select Impact Location</h3>
        <p className="instruction-text">Click on the map or search for a location</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Current Selection Display */}
      {selectedLocation && (
        <div className="current-selection">
          <div className="selection-info">
            <span className="location-icon">📍</span>
            <div className="location-details">
              <div className="location-name">
                {locationName || selectedLocation.name || 'Selected Location'}
              </div>
              <div className="location-coords">
                {formatCoordinate(selectedLocation.latitude, 'lat')}, {formatCoordinate(selectedLocation.longitude, 'lng')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Panel */}
      {showSearchPanel && (
        <div className="search-panel">
          <div className="search-input-container">
            <GlassInput
              type="text"
              placeholder="Search for cities, landmarks, or addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="location-search-input"
            />
            {isSearching && <div className="search-spinner">🔄</div>}
          </div>
          
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="result-name">{result.name.split(',')[0]}</div>
                  <div className="result-address">{result.name}</div>
                  <div className="result-coords">
                    {formatCoordinate(result.lat, 'lat')}, {formatCoordinate(result.lng, 'lng')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Map */}
      <div className="map-container" style={{ height: mapHeight }}>
        <MapContainer
          center={[mapCenter.latitude, mapCenter.longitude]}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          {/* Satellite imagery layer */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            maxZoom={18}
          />
          
          {/* Hybrid overlay for labels */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            opacity={0.7}
          />
          
          {/* Map click handler */}
          <MapClickHandler onLocationSelect={handleMapClick} />
          
          {/* Map controller */}
          <MapController center={mapCenter} zoom={mapZoom} />
          
          {/* Selected location marker */}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.latitude, selectedLocation.longitude]} 
              icon={createTargetIcon()}
            >
              <Popup>
                <div className="location-popup">
                  <h4>🎯 Impact Target</h4>
                  <p><strong>{locationName || selectedLocation.name || 'Selected Location'}</strong></p>
                  <p>
                    Lat: {formatCoordinate(selectedLocation.latitude, 'lat')}<br/>
                    Lng: {formatCoordinate(selectedLocation.longitude, 'lng')}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Action Buttons */}
      <div className="location-actions">
        <GlassButton onClick={getCurrentLocation} className="current-location-btn">
          📱 Use Current Location
        </GlassButton>
        
        <div className="popular-locations">
          <span className="popular-label">Quick Select:</span>
          <div className="popular-buttons">
            {popularLocations.map((location) => (
              <button
                key={location.name}
                className="popular-location-btn"
                onClick={() => handleLocationSelect(location)}
              >
                {location.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

export default Enhanced2DLocationSelector;