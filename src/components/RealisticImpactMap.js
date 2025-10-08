import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AdvancedPhysicsEngine } from '../utils/AdvancedPhysicsEngine';
import './RealisticImpactMap.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom impact marker
const createImpactIcon = (size = 'large') => {
  const sizes = {
    small: [20, 20],
    medium: [30, 30],
    large: [40, 40]
  };
  
  return L.divIcon({
    className: 'impact-marker',
    html: `<div class="impact-point ${size}">
             <div class="impact-core"></div>
             <div class="impact-pulse"></div>
           </div>`,
    iconSize: sizes[size],
    iconAnchor: [sizes[size][0]/2, sizes[size][1]/2]
  });
};

// Energy zone component
const EnergyZone = ({ zone, center, zoneKey }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!zone || !center) return;
    
    const circle = L.circle(center, {
      radius: zone.radius,
      fillColor: zone.color,
      fillOpacity: zone.opacity,
      color: zone.color,
      weight: 2,
      opacity: 0.8,
      className: `energy-zone ${zoneKey}`
    }).addTo(map);
    
    // Add energy text markers
    const textMarker = L.divIcon({
      className: 'energy-text-marker',
      html: `<div class="energy-label">
               <div class="energy-type">${zoneKey.replace(/([A-Z])/g, ' $1').toUpperCase()}</div>
               <div class="energy-value">${(zone.energy / 1e15).toFixed(2)} PJ</div>
               <div class="energy-effects">${zone.effects.slice(0, 2).join(', ')}</div>
             </div>`,
      iconSize: [120, 60],
      iconAnchor: [60, 30]
    });
    
    const textPosition = [
      center[0] + (zone.radius / 111320) * 0.7 * Math.cos(Math.PI / 4),
      center[1] + (zone.radius / (111320 * Math.cos(center[0] * Math.PI / 180))) * 0.7 * Math.sin(Math.PI / 4)
    ];
    
    const textMarkerInstance = L.marker(textPosition, { icon: textMarker }).addTo(map);
    
    return () => {
      map.removeLayer(circle);
      map.removeLayer(textMarkerInstance);
    };
  }, [zone, center, zoneKey, map]);
  
  return null;
};

// Gradient overlay component for energy distribution
const EnergyGradientOverlay = ({ energyZones, center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!energyZones || !center) return;
    
    // Create gradient overlay using canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 800;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(400, 400, 0, 400, 400, 400);
    
    // Add color stops based on energy zones
    const sortedZones = Object.entries(energyZones).sort((a, b) => a[1].radius - b[1].radius);
    
    sortedZones.forEach(([key, zone], index) => {
      const stop = index / (sortedZones.length - 1);
      gradient.addColorStop(stop, zone.color + '40'); // Add transparency
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);
    
    // Convert canvas to image overlay
    const imageUrl = canvas.toDataURL();
    const maxRadius = Math.max(...Object.values(energyZones).map(z => z.radius));
    
    const bounds = [
      [center[0] - maxRadius / 111320, center[1] - maxRadius / (111320 * Math.cos(center[0] * Math.PI / 180))],
      [center[0] + maxRadius / 111320, center[1] + maxRadius / (111320 * Math.cos(center[0] * Math.PI / 180))]
    ];
    
    const overlay = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.3,
      className: 'energy-gradient-overlay'
    }).addTo(map);
    
    return () => {
      map.removeLayer(overlay);
    };
  }, [energyZones, center, map]);
  
  return null;
};

// Line distribution component for energy waves
const EnergyWaveLines = ({ energyZones, center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!energyZones || !center) return;
    
    const lines = [];
    
    Object.entries(energyZones).forEach(([key, zone]) => {
      // Create concentric circles with varying opacity
      for (let i = 0; i < 5; i++) {
        const radius = zone.radius * (0.2 + i * 0.2);
        const opacity = 0.8 - i * 0.15;
        
        const circle = L.circle(center, {
          radius: radius,
          fillOpacity: 0,
          color: zone.color,
          weight: 2 - i * 0.3,
          opacity: opacity,
          dashArray: i % 2 === 0 ? null : '5, 5',
          className: `energy-wave-line ${key}-${i}`
        }).addTo(map);
        
        lines.push(circle);
      }
      
      // Add directional energy lines
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const endLat = center[0] + (zone.radius / 111320) * Math.cos(rad);
        const endLng = center[1] + (zone.radius / (111320 * Math.cos(center[0] * Math.PI / 180))) * Math.sin(rad);
        
        const line = L.polyline([center, [endLat, endLng]], {
          color: zone.color,
          weight: 1,
          opacity: 0.4,
          dashArray: '3, 6',
          className: `energy-direction-line ${key}`
        }).addTo(map);
        
        lines.push(line);
      }
    });
    
    return () => {
      lines.forEach(line => map.removeLayer(line));
    };
  }, [energyZones, center, map]);
  
  return null;
};

const RealisticImpactMap = ({ 
  impactLocation, 
  simulationResults, 
  onLocationSelect, 
  showSimulation = false 
}) => {
  const [physicsEngine] = useState(new AdvancedPhysicsEngine());
  const [impactData, setImpactData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef();

  // Calculate impact effects when simulation results change
  useEffect(() => {
    if (simulationResults && showSimulation) {
      setIsLoading(true);
      
      try {
        const asteroidParams = {
          diameter: simulationResults.diameter || 100,
          velocity: simulationResults.velocity || 20,
          composition: simulationResults.composition || 'stone',
          angle: simulationResults.angle || 45,
          mass: simulationResults.mass
        };
        
        const results = physicsEngine.calculateComprehensiveImpact(asteroidParams);
        setImpactData(results);
      } catch (error) {
        console.error('Error calculating impact effects:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [simulationResults, showSimulation, physicsEngine]);

  const handleMapClick = (e) => {
    if (onLocationSelect) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    }
  };

  const defaultCenter = impactLocation || [40.7128, -74.0060]; // Default to NYC
  const defaultZoom = 10;

  return (
    <div className="realistic-impact-map">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Calculating Impact Effects...</div>
        </div>
      )}
      
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '600px', width: '100%' }}
        ref={mapRef}
        onClick={handleMapClick}
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
        
        {/* Impact location marker */}
        {impactLocation && (
          <Marker 
            position={impactLocation} 
            icon={createImpactIcon('large')}
          >
            <Popup>
              <div className="impact-popup">
                <h3>Impact Location</h3>
                <p>Coordinates: {impactLocation[0].toFixed(4)}, {impactLocation[1].toFixed(4)}</p>
                {impactData && (
                  <div className="impact-summary">
                    <p><strong>Energy:</strong> {(impactData.kineticEnergy / 1e15).toFixed(2)} PJ</p>
                    <p><strong>TNT Equivalent:</strong> {impactData.impactResults.tntEquivalent.toFixed(2)} MT</p>
                    <p><strong>Classification:</strong> {impactData.impactClassification.level}</p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Energy zones visualization */}
        {impactData && impactData.energyZones && impactLocation && (
          <>
            {/* Gradient overlay */}
            <EnergyGradientOverlay 
              energyZones={impactData.energyZones} 
              center={impactLocation} 
            />
            
            {/* Energy wave lines */}
            <EnergyWaveLines 
              energyZones={impactData.energyZones} 
              center={impactLocation} 
            />
            
            {/* Individual energy zones */}
            {Object.entries(impactData.energyZones).map(([key, zone]) => (
              <EnergyZone
                key={key}
                zone={zone}
                center={impactLocation}
                zoneKey={key}
              />
            ))}
          </>
        )}
      </MapContainer>
      
      {/* Impact statistics panel */}
      {impactData && (
        <div className="impact-statistics">
          <div className="stats-header">
            <h3>Impact Analysis</h3>
            <div className={`classification-badge ${impactData.impactClassification.level.toLowerCase()}`}>
              {impactData.impactClassification.level} Impact
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Energy</span>
              <span className="stat-value">{(impactData.kineticEnergy / 1e15).toFixed(2)} PJ</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">TNT Equivalent</span>
              <span className="stat-value">{impactData.impactResults.tntEquivalent.toFixed(2)} MT</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Crater Diameter</span>
              <span className="stat-value">{(impactData.impactResults.crater.diameter / 1000).toFixed(2)} km</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Seismic Magnitude</span>
              <span className="stat-value">{impactData.impactResults.seismicMagnitude.toFixed(1)}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Thermal Radius</span>
              <span className="stat-value">{(impactData.impactResults.thermalEffects.thermalRadiationRadius / 1000).toFixed(1)} km</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Blast Radius</span>
              <span className="stat-value">{(impactData.impactResults.blastEffects.blastRadius5psi / 1000).toFixed(1)} km</span>
            </div>
          </div>
          
          {/* Energy distribution legend */}
          <div className="energy-legend">
            <h4>Energy Dissipation Zones</h4>
            <div className="legend-items">
              {Object.entries(impactData.energyZones).map(([key, zone]) => (
                <div key={key} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: zone.color, opacity: zone.opacity }}
                  ></div>
                  <div className="legend-info">
                    <span className="legend-name">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="legend-radius">
                      {(zone.radius / 1000).toFixed(1)} km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealisticImpactMap;