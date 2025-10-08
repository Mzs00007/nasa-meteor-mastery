import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { GlassCard, GlassButton, GlassPanel } from './ui/GlassComponents';

// Custom hook for map events and zoom handling
const MapEventHandler = ({ onZoomChange, onLocationChange, simulationRunning }) => {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      onZoomChange(zoom);
      onLocationChange(center);
    },
    moveend: () => {
      const center = map.getCenter();
      onLocationChange(center);
    },
    click: (e) => {
      if (!simulationRunning) {
        onLocationChange(e.latlng);
      }
    }
  });

  return null;
};

// Custom component for simulation overlay
const SimulationOverlay = ({ simulationResults, impactLocation, asteroidParams }) => {
  const map = useMap();

  useEffect(() => {
    if (impactLocation && simulationResults && 
        typeof impactLocation.latitude === 'number' && 
        typeof impactLocation.longitude === 'number') {
      // Center map on impact location
      map.setView([impactLocation.latitude, impactLocation.longitude], 8);
    }
  }, [map, impactLocation, simulationResults]);

  if (!simulationResults || !impactLocation) return null;

  // Calculate damage zones based on simulation results
  const calculateDamageZones = () => {
    const craterDiameter = simulationResults.craterDiameter || 1000; // meters
    return {
      totalDestruction: craterDiameter / 2,
      severeDestruction: craterDiameter * 1.25,
      moderateDestruction: craterDiameter * 2.5,
      lightDestruction: craterDiameter * 5,
      thermalRadiation: craterDiameter * 7.5
    };
  };

  const damageZones = calculateDamageZones();

  return (
    <>
      {/* Impact point marker */}
      <Marker position={[impactLocation.latitude, impactLocation.longitude]}>
        <Popup>
          <div className="text-center">
            <h3 className="font-bold text-red-600">🎯 Impact Point</h3>
            <p>Coordinates: {impactLocation.latitude.toFixed(4)}°, {impactLocation.longitude.toFixed(4)}°</p>
            <p>Asteroid: {asteroidParams.diameter}m {asteroidParams.composition}</p>
            <p>Impact Energy: {((simulationResults.energy || simulationResults.impactEnergy || 1e15) / 4.184e15).toFixed(2)} MT TNT</p>
          </div>
        </Popup>
      </Marker>

      {/* Damage zone circles */}
      <Circle
        center={[impactLocation.latitude, impactLocation.longitude]}
        radius={damageZones.totalDestruction}
        pathOptions={{ color: '#ff0000', fillColor: '#ff0000', fillOpacity: 0.7 }}
      >
        <Popup>Total Destruction Zone</Popup>
      </Circle>

      <Circle
        center={[impactLocation.latitude, impactLocation.longitude]}
        radius={damageZones.severeDestruction}
        pathOptions={{ color: '#ff4500', fillColor: '#ff4500', fillOpacity: 0.5 }}
      >
        <Popup>Severe Destruction Zone</Popup>
      </Circle>

      <Circle
        center={[impactLocation.latitude, impactLocation.longitude]}
        radius={damageZones.moderateDestruction}
        pathOptions={{ color: '#ffa500', fillColor: '#ffa500', fillOpacity: 0.3 }}
      >
        <Popup>Moderate Destruction Zone</Popup>
      </Circle>

      <Circle
        center={[impactLocation.latitude, impactLocation.longitude]}
        radius={damageZones.lightDestruction}
        pathOptions={{ color: '#ffff00', fillColor: '#ffff00', fillOpacity: 0.2 }}
      >
        <Popup>Light Destruction Zone</Popup>
      </Circle>

      <Circle
        center={[impactLocation.latitude, impactLocation.longitude]}
        radius={damageZones.thermalRadiation}
        pathOptions={{ color: '#ff69b4', fillColor: '#ff69b4', fillOpacity: 0.1 }}
      >
        <Popup>Thermal Radiation Zone</Popup>
      </Circle>
    </>
  );
};

// Main Enhanced Interactive Map Component
const EnhancedInteractiveMap = ({ 
  simulationResults, 
  impactLocation, 
  asteroidParams,
  simulationRunning,
  onVisualizationComplete,
  onError 
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(2);
  const [currentCenter, setCurrentCenter] = useState({ lat: 20, lng: 0 });
  const [mapStyle, setMapStyle] = useState('satellite');
  const [showLabels, setShowLabels] = useState(true);
  const [visualizationCompleted, setVisualizationCompleted] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const mapRef = useRef(null);

  // Map style configurations
  const mapStyles = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    },
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  };

  // Get zoom level description
  const getZoomDescription = useCallback((zoom) => {
    if (zoom <= 3) return 'Global View - Continents';
    if (zoom <= 6) return 'Regional View - Countries';
    if (zoom <= 9) return 'National View - States/Provinces';
    if (zoom <= 12) return 'Local View - Cities';
    if (zoom <= 15) return 'Urban View - Districts';
    return 'Street View - Villages/Neighborhoods';
  }, []);

  // Handle zoom changes
  const handleZoomChange = useCallback((zoom) => {
    setCurrentZoom(zoom);
  }, []);

  // Handle location changes
  const handleLocationChange = useCallback((location) => {
    setCurrentCenter(location);
  }, []);

  // Handle visualization completion
  const handleVisualizationComplete = useCallback(() => {
    if (!visualizationCompleted) {
      setShowCompletionDialog(true);
    }
  }, [visualizationCompleted]);

  // Confirm visualization completion
  const confirmVisualizationComplete = useCallback(() => {
    setVisualizationCompleted(true);
    setShowCompletionDialog(false);
    if (onVisualizationComplete) {
      onVisualizationComplete(userNotes);
    }
  }, [userNotes, onVisualizationComplete]);

  // Prevent navigation during simulation
  useEffect(() => {
    if (simulationRunning && !visualizationCompleted) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Simulation is running. Are you sure you want to leave?';
        return e.returnValue;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [simulationRunning, visualizationCompleted]);

  return (
    <div className="w-full h-full relative">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        <GlassPanel className="p-3">
          <div className="text-sm text-white mb-2">
            <div className="font-semibold">🗺️ {getZoomDescription(currentZoom)}</div>
            <div className="text-xs text-gray-300">
              Zoom: {currentZoom} | Lat: {currentCenter.lat?.toFixed(4)} | Lng: {currentCenter.lng?.toFixed(4)}
            </div>
          </div>
          
          {/* Map Style Selector */}
          <div className="flex space-x-1 mb-2">
            <GlassButton
              size="xs"
              variant={mapStyle === 'satellite' ? 'primary' : 'secondary'}
              onClick={() => setMapStyle('satellite')}
            >
              🛰️ Satellite
            </GlassButton>
            <GlassButton
              size="xs"
              variant={mapStyle === 'terrain' ? 'primary' : 'secondary'}
              onClick={() => setMapStyle('terrain')}
            >
              🏔️ Terrain
            </GlassButton>
            <GlassButton
              size="xs"
              variant={mapStyle === 'standard' ? 'primary' : 'secondary'}
              onClick={() => setMapStyle('standard')}
            >
              🗺️ Standard
            </GlassButton>
          </div>

          {/* Labels Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLabels"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showLabels" className="text-xs text-white">
              Show Labels
            </label>
          </div>
        </GlassPanel>

        {/* Simulation Status */}
        {simulationRunning && (
          <GlassPanel className="p-3">
            <div className="text-sm text-white">
              <div className="font-semibold text-yellow-400">⚡ Simulation Running</div>
              <div className="text-xs text-gray-300">
                Review the visualization carefully before proceeding
              </div>
              {!visualizationCompleted && (
                <GlassButton
                  size="sm"
                  variant="primary"
                  onClick={handleVisualizationComplete}
                  className="mt-2 w-full"
                >
                  ✅ Complete Review
                </GlassButton>
              )}
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Map Container */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={() => setMapReady(true)}
      >
        <TileLayer
          url={mapStyles[mapStyle].url}
          attribution={mapStyles[mapStyle].attribution}
          maxZoom={18}
        />
        
        <MapEventHandler
          onZoomChange={handleZoomChange}
          onLocationChange={handleLocationChange}
          simulationRunning={simulationRunning}
        />

        {/* Simulation Results Overlay */}
        {simulationResults && impactLocation && (
          <SimulationOverlay
            simulationResults={simulationResults}
            impactLocation={impactLocation}
            asteroidParams={asteroidParams}
          />
        )}
      </MapContainer>

      {/* Completion Dialog */}
      {showCompletionDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <GlassCard className="p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              📝 Complete Visualization Review
            </h3>
            <p className="text-gray-300 mb-4">
              Have you thoroughly reviewed the simulation results and impact visualization? 
              Please add any notes about your observations:
            </p>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Enter your notes about the simulation results..."
              className="w-full h-24 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none"
            />
            <div className="flex space-x-3 mt-4">
              <GlassButton
                variant="secondary"
                onClick={() => setShowCompletionDialog(false)}
                className="flex-1"
              >
                Continue Review
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={confirmVisualizationComplete}
                className="flex-1"
              >
                ✅ Complete
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Zoom Instructions */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <GlassPanel className="p-3 max-w-xs">
          <div className="text-xs text-white">
            <div className="font-semibold mb-1">🔍 Navigation Guide</div>
            <div className="space-y-1 text-gray-300">
              <div>• Scroll to zoom in/out</div>
              <div>• Drag to pan around</div>
              <div>• Click to center on location</div>
              <div>• Zoom levels: Global → Countries → Cities → Villages</div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default EnhancedInteractiveMap;