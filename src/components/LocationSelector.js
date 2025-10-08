import React, { useState, useEffect, useRef } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { GlassInput, GlassButton, GlassPanel } from './ui/GlassComponents';
import './LocationSelector.css';

const LocationSelector = ({ 
  showMap = true, 
  compact = false, 
  onLocationChange = null,
  className = ""
}) => {
  const { impactLocation, setImpactLocation } = useSimulation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [manualCoords, setManualCoords] = useState({
    lat: impactLocation.latitude || '',
    lng: impactLocation.longitude || ''
  });
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [inputMode, setInputMode] = useState('search'); // 'search' or 'coordinates'
  const searchTimeoutRef = useRef(null);

  // Validation functions
  const validateCoordinates = (lat, lng) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return 'Please enter valid numeric coordinates';
    }
    
    if (latitude < -90 || latitude > 90) {
      return 'Latitude must be between -90 and 90 degrees';
    }
    
    if (longitude < -180 || longitude > 180) {
      return 'Longitude must be between -180 and 180 degrees';
    }
    
    return null;
  };

  const clearErrors = () => {
    setError(null);
    setValidationError(null);
  };

  // Update manual coordinates when impactLocation changes
  useEffect(() => {
    setManualCoords({
      lat: impactLocation.latitude || '',
      lng: impactLocation.longitude || ''
    });
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
      clearErrors();
      return;
    }

    setIsSearching(true);
    clearErrors();
    
    try {
      // Using Nominatim API for geocoding (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setError('No locations found. Try a different search term.');
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      const results = data.map(item => ({
        id: item.place_id,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        country: item.address?.country || ''
      }));
      
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to search locations. Please check your internet connection and try again.');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location) => {
    const newLocation = {
      latitude: location.lat,
      longitude: location.lng,
      name: location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    };
    
    setImpactLocation(newLocation);
    setLocationName(location.name || '');
    setManualCoords({ lat: location.lat, lng: location.lng });
    setShowResults(false);
    setSearchQuery('');
    
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const handleManualCoordinates = () => {
    const validationErr = validateCoordinates(manualCoords.lat, manualCoords.lng);
    
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }
    
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    clearErrors();
    
    const newLocation = {
      latitude: lat,
      longitude: lng,
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
    
    setImpactLocation(newLocation);
    setLocationName(newLocation.name);
    
    if (onLocationChange) {
      onLocationChange(newLocation);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please use the search function or enter coordinates manually.');
      return;
    }

    clearErrors();
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: `Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
        };
        handleLocationSelect(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your current location. ';
        let suggestion = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied.';
            suggestion = 'Please allow location access in your browser settings, or use the search function to find your location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            suggestion = 'This may happen if GPS is disabled or you\'re indoors. Try using the search function or enter coordinates manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            suggestion = 'Please try again, or use the search function as an alternative.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            suggestion = 'Please try using the search function or enter coordinates manually.';
            break;
        }
        
        setError(`${errorMessage} ${suggestion}`);
        
        // Auto-suggest a default location as fallback
        setTimeout(() => {
          if (!impactLocation.latitude && !impactLocation.longitude) {
            // Suggest New York City as a default location
            const fallbackLocation = {
              latitude: 40.7128,
              longitude: -74.0060,
              name: 'New York City (Default)'
            };
            setError(`${errorMessage} ${suggestion} We've set New York City as a default location - you can change this using search or coordinates.`);
            handleLocationSelect(fallbackLocation);
          }
        }, 2000);
      },
      {
        enableHighAccuracy: false, // Reduced accuracy for better compatibility
        timeout: 15000, // Increased timeout
        maximumAge: 600000 // 10 minutes cache
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

  if (compact) {
    return (
      <div className={`location-selector-compact ${className}`}>
        <div className="current-location-display">
          <span className="location-icon">📍</span>
          <span className="location-text">
            {locationName || `${formatCoordinate(impactLocation.latitude, 'lat')}, ${formatCoordinate(impactLocation.longitude, 'lng')}`}
          </span>
          <GlassButton
            size="sm"
            onClick={() => setInputMode(inputMode === 'search' ? 'coordinates' : 'search')}
            className="change-location-btn"
          >
            Change
          </GlassButton>
        </div>
        
        {inputMode === 'search' && (
          <div className="search-section">
            <GlassInput
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="location-search-input"
            />
            {showResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="search-result-item"
                    onClick={() => handleLocationSelect(result)}
                  >
                    <div className="result-name">{result.name}</div>
                    <div className="result-coords">
                      {formatCoordinate(result.lat, 'lat')}, {formatCoordinate(result.lng, 'lng')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {inputMode === 'coordinates' && (
          <div className="coordinates-section">
            <div className="coordinate-inputs">
              <GlassInput
                type="number"
                placeholder="Latitude"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                step="0.0001"
                min="-90"
                max="90"
              />
              <GlassInput
                type="number"
                placeholder="Longitude"
                value={manualCoords.lng}
                onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                step="0.0001"
                min="-180"
                max="180"
              />
              <GlassButton onClick={handleManualCoordinates} size="sm">
                Set
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <GlassPanel className={`location-selector ${className}`}>
      <div className="location-selector-header">
        <h3>📍 Impact Location</h3>
        <div className="input-mode-toggle">
          <button
            className={`mode-btn ${inputMode === 'search' ? 'active' : ''}`}
            onClick={() => setInputMode('search')}
          >
            🔍 Search
          </button>
          <button
            className={`mode-btn ${inputMode === 'coordinates' ? 'active' : ''}`}
            onClick={() => setInputMode('coordinates')}
          >
            🎯 Coordinates
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(error || validationError) && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error || validationError}
        </div>
      )}

      <div className="current-location">
        <div className="location-display">
          <div className="location-name">
            {locationName || 'Custom Location'}
          </div>
          <div className="location-coords">
            {formatCoordinate(impactLocation.latitude, 'lat')}, {formatCoordinate(impactLocation.longitude, 'lng')}
          </div>
        </div>
      </div>

      {inputMode === 'search' && (
        <div className="search-section">
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
                  <div className="result-header">
                    <div className="result-name">{result.name.split(',')[0]}</div>
                    <div className="result-type">{result.type}</div>
                  </div>
                  <div className="result-details">
                    <div className="result-address">{result.name}</div>
                    <div className="result-coords">
                      {formatCoordinate(result.lat, 'lat')}, {formatCoordinate(result.lng, 'lng')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {inputMode === 'coordinates' && (
        <div className="coordinates-section">
          <div className="coordinate-inputs">
            <div className="input-group">
              <label>Latitude (-90 to 90)</label>
              <GlassInput
                type="number"
                placeholder="e.g., 40.7128"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                step="0.0001"
                min="-90"
                max="90"
              />
            </div>
            <div className="input-group">
              <label>Longitude (-180 to 180)</label>
              <GlassInput
                type="number"
                placeholder="e.g., -74.0060"
                value={manualCoords.lng}
                onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                step="0.0001"
                min="-180"
                max="180"
              />
            </div>
          </div>
          <GlassButton onClick={handleManualCoordinates} className="set-coordinates-btn">
            Set Coordinates
          </GlassButton>
        </div>
      )}

      <div className="location-actions">
        <GlassButton onClick={getCurrentLocation} className="current-location-btn">
          📱 Use Current Location
        </GlassButton>
        
        <div className="popular-locations">
          <span className="popular-label">Quick Select:</span>
          {[
            { name: 'New York City', lat: 40.7128, lng: -74.0060 },
            { name: 'London', lat: 51.5074, lng: -0.1278 },
            { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
            { name: 'Sydney', lat: -33.8688, lng: 151.2093 }
          ].map((location) => (
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
    </GlassPanel>
  );
};

export default LocationSelector;