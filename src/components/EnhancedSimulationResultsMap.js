import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents, LayersControl, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { GlassCard, GlassButton, GlassPanel } from './ui/GlassComponents';

// Custom hook for map events and controls
const MapController = ({ onZoomChange, onLocationChange, impactLocation, autoCenter }) => {
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
    }
  });

  useEffect(() => {
    if (autoCenter && impactLocation && map && 
        typeof impactLocation.latitude === 'number' && 
        typeof impactLocation.longitude === 'number') {
      map.setView([impactLocation.latitude, impactLocation.longitude], 10);
    }
  }, [map, impactLocation, autoCenter]);

  return null;
};

// Enhanced damage zone visualization with energy data
const EnhancedDamageZones = ({ simulationResults, impactLocation, asteroidParams, showEnergyData, selectedZones }) => {
  const damageZones = useMemo(() => {
    if (!simulationResults || !impactLocation) return [];

    // Get energy from either property name and ensure it's a valid number
    const energy = simulationResults.energy || simulationResults.impactEnergy || 1e15; // joules
    const craterDiameter = simulationResults.craterDiameter || 1000; // meters
    const megatons = energy / 4.184e15; // Convert to megatons TNT
    
    console.log('Damage Zones Debug:', {
      energy,
      craterDiameter,
      megatons,
      simulationResults
    });

    return [
      {
        id: 'crater',
        name: 'Crater Zone',
        radius: Math.max(craterDiameter / 2, 500), // Ensure minimum radius
        color: '#8B0000',
        fillColor: '#FF0000',
        fillOpacity: 0.8,
        energy: energy * 0.1,
        effects: ['Complete vaporization', 'Crater formation', 'Ground zero'],
        casualties: '100% fatality',
        description: 'Direct impact crater with complete destruction'
      },
      {
        id: 'fireball',
        name: 'Fireball Zone',
        radius: Math.max(Math.pow(megatons, 0.4) * 1000, 1000),
        color: '#FF4500',
        fillColor: '#FF6347',
        fillOpacity: 0.7,
        energy: energy * 0.3,
        effects: ['Thermal radiation', 'Plasma formation', 'Intense heat'],
        casualties: '90-100% fatality',
        description: 'Fireball and intense thermal radiation zone'
      },
      {
        id: 'thermal',
        name: 'Thermal Radiation',
        radius: Math.max(Math.pow(megatons, 0.4) * 2500, 2000),
        color: '#FF8C00',
        fillColor: '#FFA500',
        fillOpacity: 0.5,
        energy: energy * 0.25,
        effects: ['3rd degree burns', 'Ignition of materials', 'Severe burns'],
        casualties: '50-90% fatality',
        description: 'Severe thermal radiation causing widespread burns'
      },
      {
        id: 'blast',
        name: 'Blast Wave',
        radius: Math.max(Math.pow(megatons, 0.33) * 3000, 3000),
        color: '#FFD700',
        fillColor: '#FFFF00',
        fillOpacity: 0.4,
        energy: energy * 0.2,
        effects: ['Building collapse', '5+ psi overpressure', 'Structural damage'],
        casualties: '25-50% fatality',
        description: 'Destructive blast wave with severe structural damage'
      },
      {
        id: 'moderate',
        name: 'Moderate Damage',
        radius: Math.max(Math.pow(megatons, 0.33) * 5000, 4000),
        color: '#ADFF2F',
        fillColor: '#9ACD32',
        fillOpacity: 0.3,
        energy: energy * 0.1,
        effects: ['Window breakage', '1-5 psi overpressure', 'Moderate damage'],
        casualties: '5-25% fatality',
        description: 'Moderate structural damage and injuries'
      },
      {
        id: 'light',
        name: 'Light Damage',
        radius: Math.max(Math.pow(megatons, 0.33) * 8000, 6000),
        color: '#87CEEB',
        fillColor: '#87CEFA',
        fillOpacity: 0.2,
        energy: energy * 0.05,
        effects: ['Glass breakage', 'Minor injuries', 'Light damage'],
        casualties: '1-5% fatality',
        description: 'Light damage with broken windows and minor injuries'
      }
    ];
  }, [simulationResults, impactLocation, asteroidParams]);

  if (!impactLocation || !simulationResults) return null;

  return (
    <>
      {damageZones.map((zone, index) => {
        if (selectedZones && !selectedZones.includes(zone.id)) return null;
        
        return (
          <Circle
            key={zone.id}
            center={[impactLocation.latitude, impactLocation.longitude]}
            radius={zone.radius}
            pathOptions={{ 
              color: zone.color, 
              fillColor: zone.fillColor, 
              fillOpacity: zone.fillOpacity,
              weight: 2
            }}
          >
            <Popup maxWidth={300}>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2" style={{ color: zone.color }}>
                  {zone.name}
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Radius:</strong> {(zone.radius / 1000).toFixed(1)} km</p>
                  <p><strong>Area:</strong> {(Math.PI * Math.pow(zone.radius / 1000, 2)).toFixed(1)} km²</p>
                  {showEnergyData && (
                    <p><strong>Energy:</strong> {(zone.energy / 1e15).toFixed(2)} PJ</p>
                  )}
                  <p><strong>Casualties:</strong> {zone.casualties}</p>
                  <p><strong>Description:</strong> {zone.description}</p>
                  <div className="mt-2">
                    <strong>Effects:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {zone.effects.map((effect, i) => (
                        <li key={i} className="text-xs">{effect}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
};

// Direction selection component
const DirectionSelector = ({ impactLocation, onDirectionChange, selectedDirection }) => {
  const directions = [
    { id: 'north', name: 'North', angle: 0, icon: '⬆️' },
    { id: 'northeast', name: 'Northeast', angle: 45, icon: '↗️' },
    { id: 'east', name: 'East', angle: 90, icon: '➡️' },
    { id: 'southeast', name: 'Southeast', angle: 135, icon: '↘️' },
    { id: 'south', name: 'South', angle: 180, icon: '⬇️' },
    { id: 'southwest', name: 'Southwest', angle: 225, icon: '↙️' },
    { id: 'west', name: 'West', angle: 270, icon: '⬅️' },
    { id: 'northwest', name: 'Northwest', angle: 315, icon: '↖️' }
  ];

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        <span className="mr-2">🧭</span>
        Direction Analysis
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {directions.map((direction) => (
          <GlassButton
            key={direction.id}
            onClick={() => onDirectionChange(direction)}
            className={`p-2 text-center ${
              selectedDirection?.id === direction.id 
                ? 'bg-blue-500/30 border-blue-400' 
                : 'hover:bg-white/10'
            }`}
          >
            <div className="text-lg">{direction.icon}</div>
            <div className="text-xs">{direction.name}</div>
          </GlassButton>
        ))}
      </div>
      {selectedDirection && (
        <div className="mt-3 p-2 bg-white/10 rounded">
          <p className="text-sm text-white">
            <strong>Selected:</strong> {selectedDirection.name} ({selectedDirection.angle}°)
          </p>
        </div>
      )}
    </GlassCard>
  );
};

// Energy visualization overlay
const EnergyVisualization = ({ simulationResults, impactLocation, showHeatmap }) => {
  if (!showHeatmap || !simulationResults || !impactLocation) return null;

  // Get energy from either property name and ensure it's a valid number
  const energy = simulationResults.energy || simulationResults.impactEnergy || 1e15;
  const megatons = energy / 4.184e15;
  
  const energyZones = [
    { radius: Math.max(1000, megatons * 100), intensity: 1.0, color: '#FF0000' },
    { radius: Math.max(2500, megatons * 250), intensity: 0.8, color: '#FF4500' },
    { radius: Math.max(5000, megatons * 500), intensity: 0.6, color: '#FFA500' },
    { radius: Math.max(8000, megatons * 800), intensity: 0.4, color: '#FFD700' },
    { radius: Math.max(12000, megatons * 1200), intensity: 0.2, color: '#FFFF00' }
  ];

  return (
    <>
      {energyZones.map((zone, index) => (
        <Circle
          key={`energy-${index}`}
          center={[impactLocation.latitude, impactLocation.longitude]}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.intensity * 0.3,
            weight: 1,
            dashArray: '5, 5'
          }}
        >
          <Popup>
            <div>
              <h4 className="font-bold">Energy Zone {index + 1}</h4>
              <p>Intensity: {(zone.intensity * 100).toFixed(0)}%</p>
              <p>Energy: {((energy * zone.intensity) / 1e15).toFixed(2)} PJ</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
};

// Main Enhanced Simulation Results Map Component
const EnhancedSimulationResultsMap = ({ 
  simulationResults, 
  impactLocation, 
  asteroidParams,
  onVisualizationComplete,
  className = ""
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(8);
  const [currentCenter, setCurrentCenter] = useState({ lat: 20, lng: 0 });
  const [mapStyle, setMapStyle] = useState('satellite');
  const [showEnergyData, setShowEnergyData] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedZones, setSelectedZones] = useState(['crater', 'fireball', 'thermal', 'blast']);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [autoCenter, setAutoCenter] = useState(true);
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

  const handleZoomChange = useCallback((zoom) => {
    setCurrentZoom(zoom);
  }, []);

  const handleLocationChange = useCallback((location) => {
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      setCurrentCenter(location);
    }
  }, []);

  const handleDirectionChange = useCallback((direction) => {
    setSelectedDirection(direction);
    if (impactLocation && mapRef.current && 
        typeof impactLocation.latitude === 'number' && 
        typeof impactLocation.longitude === 'number') {
      // Calculate offset position based on direction
      const offsetDistance = 0.1; // degrees
      const angle = direction.angle * Math.PI / 180;
      const newLat = impactLocation.latitude + offsetDistance * Math.cos(angle);
      const newLng = impactLocation.longitude + offsetDistance * Math.sin(angle);
      
      mapRef.current.setView([newLat, newLng], currentZoom);
    }
  }, [impactLocation, currentZoom]);

  const toggleZone = useCallback((zoneId) => {
    setSelectedZones(prev => 
      prev.includes(zoneId) 
        ? prev.filter(id => id !== zoneId)
        : [...prev, zoneId]
    );
  }, []);

  useEffect(() => {
    if (impactLocation) {
      setCurrentCenter({ lat: impactLocation.latitude, lng: impactLocation.longitude });
    }
  }, [impactLocation]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Style Controls */}
        <GlassCard className="p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="mr-2">🗺️</span>
            Map Controls
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Map Style</label>
              <select 
                value={mapStyle} 
                onChange={(e) => setMapStyle(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
              >
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
                <option value="standard">Standard</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showEnergyData"
                checked={showEnergyData}
                onChange={(e) => setShowEnergyData(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showEnergyData" className="text-sm text-white">Show Energy Data</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showHeatmap"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showHeatmap" className="text-sm text-white">Energy Heatmap</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoCenter"
                checked={autoCenter}
                onChange={(e) => setAutoCenter(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoCenter" className="text-sm text-white">Auto Center</label>
            </div>
          </div>
        </GlassCard>

        {/* Zone Selection */}
        <GlassCard className="p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Damage Zones
          </h3>
          <div className="space-y-2">
            {['crater', 'fireball', 'thermal', 'blast', 'moderate', 'light'].map((zone) => (
              <div key={zone} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={zone}
                  checked={selectedZones.includes(zone)}
                  onChange={() => toggleZone(zone)}
                  className="rounded"
                />
                <label htmlFor={zone} className="text-sm text-white capitalize">
                  {zone.replace(/([A-Z])/g, ' $1')}
                </label>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Direction Selector */}
        <DirectionSelector 
          impactLocation={impactLocation}
          onDirectionChange={handleDirectionChange}
          selectedDirection={selectedDirection}
        />
      </div>

      {/* Main Map */}
      <GlassCard className="p-4">
        <div className="h-[600px] rounded-lg overflow-hidden">
          {impactLocation && typeof impactLocation.latitude === 'number' && typeof impactLocation.longitude === 'number' ? (
            <MapContainer
              ref={mapRef}
              center={[impactLocation.latitude, impactLocation.longitude]}
              zoom={currentZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                url={mapStyles[mapStyle].url}
                attribution={mapStyles[mapStyle].attribution}
              />
              
              <MapController
                onZoomChange={handleZoomChange}
                onLocationChange={handleLocationChange}
                impactLocation={impactLocation}
                autoCenter={autoCenter}
              />

              {/* Impact point marker */}
              <Marker position={[impactLocation.latitude, impactLocation.longitude]}>
                <Popup maxWidth={300}>
                  <div className="p-2">
                    <h3 className="font-bold text-red-600 text-lg mb-2">🎯 Impact Point</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Coordinates:</strong> {impactLocation.latitude ? impactLocation.latitude.toFixed(4) : 'N/A'}°, {impactLocation.longitude ? impactLocation.longitude.toFixed(4) : 'N/A'}°</p>
                      <p><strong>Asteroid:</strong> {asteroidParams?.diameter}m {asteroidParams?.composition}</p>
                      {simulationResults && (
                        <>
                          <p><strong>Impact Energy:</strong> {((simulationResults.energy || simulationResults.impactEnergy || 0) / 1e15).toFixed(2)} PJ</p>
                          <p><strong>Crater Diameter:</strong> {((simulationResults.craterDiameter || 0) / 1000).toFixed(1)} km</p>
                        </>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Enhanced damage zones */}
              <EnhancedDamageZones
                simulationResults={simulationResults}
                impactLocation={impactLocation}
                asteroidParams={asteroidParams}
                showEnergyData={showEnergyData}
                selectedZones={selectedZones}
              />

              {/* Energy visualization */}
              <EnergyVisualization
                simulationResults={simulationResults}
                impactLocation={impactLocation}
                showHeatmap={showHeatmap}
              />
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <p>Select an impact location to view simulation results</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Map Information */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white">
          <div>
            <h4 className="font-semibold mb-2">Current View</h4>
            <p>Zoom: {currentZoom}</p>
            <p>Center: {currentCenter.lat ? currentCenter.lat.toFixed(4) : 'N/A'}°, {currentCenter.lng ? currentCenter.lng.toFixed(4) : 'N/A'}°</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Active Zones</h4>
            <p>{selectedZones.length} of 6 zones visible</p>
            <p>Energy data: {showEnergyData ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Direction</h4>
            <p>{selectedDirection ? `${selectedDirection.name} (${selectedDirection.angle}°)` : 'None selected'}</p>
            <p>Auto-center: {autoCenter ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default EnhancedSimulationResultsMap;