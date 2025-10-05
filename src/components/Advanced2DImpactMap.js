import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard, GlassButton, GlassSpinner } from './ui/GlassComponents';

const Advanced2DImpactMap = ({ 
  simulationResults, 
  impactLocation, 
  asteroidParams,
  onError 
}) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [showDamageZones, setShowDamageZones] = useState(true);
  const [showPopulationData, setShowPopulationData] = useState(true);

  // World map coordinates and projection
  const mapWidth = 800;
  const mapHeight = 400;

  // Convert lat/lng to canvas coordinates (Equirectangular projection)
  const latLngToCanvas = useCallback((lat, lng) => {
    const x = ((lng + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  }, []);

  // Calculate impact crater size based on asteroid parameters
  const calculateCraterSize = useCallback(() => {
    if (!asteroidParams || !simulationResults) return 0;
    
    const diameter = asteroidParams.diameter || 100;
    const velocity = asteroidParams.velocity || 20;
    const density = asteroidParams.composition === 'iron' ? 7.8 : 
                   asteroidParams.composition === 'stone' ? 3.5 : 2.0;
    
    // Simplified crater size calculation (in meters)
    const energy = 0.5 * (Math.PI * Math.pow(diameter/2, 3) * density * 1000) * Math.pow(velocity * 1000, 2);
    const craterDiameter = Math.pow(energy / 1e15, 0.25) * 1000; // Convert to meters
    
    return craterDiameter;
  }, [asteroidParams, simulationResults]);

  // Calculate damage zones
  const calculateDamageZones = useCallback(() => {
    const craterSize = calculateCraterSize();
    return {
      totalDestruction: craterSize,
      severeDestruction: craterSize * 2.5,
      moderateDestruction: craterSize * 5,
      lightDestruction: craterSize * 10,
      thermalRadiation: craterSize * 15
    };
  }, [calculateCraterSize]);

  // Draw world map outline
  const drawWorldMap = useCallback((ctx) => {
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    // Simplified world map outline (continents)
    const continents = [
      // North America
      { points: [[235, 100], [280, 120], [300, 140], [250, 180], [200, 160], [180, 120]] },
      // South America
      { points: [[260, 200], [280, 240], [270, 300], [250, 320], [240, 280], [250, 220]] },
      // Europe
      { points: [[380, 80], [420, 90], [440, 110], [420, 130], [390, 120], [370, 100]] },
      // Africa
      { points: [[380, 140], [420, 160], [440, 200], [430, 280], [400, 300], [370, 260], [360, 180]] },
      // Asia
      { points: [[440, 60], [580, 80], [620, 120], [600, 160], [520, 140], [460, 100]] },
      // Australia
      { points: [[580, 240], [640, 250], [660, 280], [640, 300], [580, 290], [560, 270]] }
    ];

    continents.forEach(continent => {
      ctx.beginPath();
      continent.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }, []);

  // Draw grid lines
  const drawGrid = useCallback((ctx) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;

    // Latitude lines
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * mapHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapWidth, y);
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * mapWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapHeight);
      ctx.stroke();
    }
  }, []);

  // Draw impact crater and damage zones
  const drawImpactZones = useCallback((ctx) => {
    if (!impactLocation || !showDamageZones) return;

    const { x, y } = latLngToCanvas(impactLocation.latitude, impactLocation.longitude);
    const damageZones = calculateDamageZones();

    // Convert meters to pixels (approximate)
    const metersToPixels = (meters) => (meters / 111320) * (mapWidth / 360) * zoomLevel;

    const zones = [
      { radius: metersToPixels(damageZones.thermalRadiation), color: 'rgba(255, 165, 0, 0.2)', label: 'Thermal Radiation' },
      { radius: metersToPixels(damageZones.lightDestruction), color: 'rgba(255, 255, 0, 0.3)', label: 'Light Destruction' },
      { radius: metersToPixels(damageZones.moderateDestruction), color: 'rgba(255, 140, 0, 0.4)', label: 'Moderate Destruction' },
      { radius: metersToPixels(damageZones.severeDestruction), color: 'rgba(255, 69, 0, 0.6)', label: 'Severe Destruction' },
      { radius: metersToPixels(damageZones.totalDestruction), color: 'rgba(139, 0, 0, 0.8)', label: 'Total Destruction' }
    ];

    // Draw damage zones from largest to smallest
    zones.forEach(zone => {
      ctx.beginPath();
      ctx.arc(x + panOffset.x, y + panOffset.y, zone.radius, 0, 2 * Math.PI);
      ctx.fillStyle = zone.color;
      ctx.fill();
      ctx.strokeStyle = zone.color.replace(/0\.\d+/, '0.8');
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw impact point
    ctx.beginPath();
    ctx.arc(x + panOffset.x, y + panOffset.y, 5 * zoomLevel, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [impactLocation, showDamageZones, latLngToCanvas, calculateDamageZones, zoomLevel, panOffset]);

  // Draw impact information
  const drawImpactInfo = useCallback((ctx) => {
    if (!impactLocation || !simulationResults) return;

    const { x, y } = latLngToCanvas(impactLocation.latitude, impactLocation.longitude);
    const craterSize = calculateCraterSize();

    // Info box
    const infoX = x + panOffset.x + 20;
    const infoY = y + panOffset.y - 60;
    const boxWidth = 200;
    const boxHeight = 80;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(infoX, infoY, boxWidth, boxHeight);
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 1;
    ctx.strokeRect(infoX, infoY, boxWidth, boxHeight);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(`Impact Location:`, infoX + 10, infoY + 20);
    ctx.fillText(`${impactLocation.latitude.toFixed(2)}°, ${impactLocation.longitude.toFixed(2)}°`, infoX + 10, infoY + 35);
    ctx.fillText(`Crater Diameter: ${(craterSize / 1000).toFixed(1)} km`, infoX + 10, infoY + 50);
    ctx.fillText(`Energy: ${(simulationResults.impactEnergy / 1e15).toFixed(2)} MT`, infoX + 10, infoY + 65);
  }, [impactLocation, simulationResults, latLngToCanvas, calculateCraterSize, panOffset]);

  // Main render function
  const renderMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x / zoomLevel, panOffset.y / zoomLevel);

    // Draw map components
    drawGrid(ctx);
    drawWorldMap(ctx);
    
    ctx.restore();

    // Draw impact zones (after restoring transform)
    drawImpactZones(ctx);
    drawImpactInfo(ctx);
  }, [zoomLevel, panOffset, drawGrid, drawWorldMap, drawImpactZones, drawImpactInfo]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setLastMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setPanOffset(prev => ({
      x: prev.x + (currentPos.x - lastMousePos.x),
      y: prev.y + (currentPos.y - lastMousePos.y)
    }));

    setLastMousePos(currentPos);
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(5, prev * zoomFactor)));
  }, []);

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate loading time for realistic effect
        await new Promise(resolve => setTimeout(resolve, 1000));

        setMapData({ initialized: true });
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize impact map');
        setIsLoading(false);
        onError?.(err);
      }
    };

    initializeMap();
  }, [onError]);

  // Render map when data changes
  useEffect(() => {
    if (mapData && !isLoading) {
      renderMap();
    }
  }, [mapData, isLoading, renderMap]);

  // Reset view
  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  if (error) {
    return (
      <GlassCard className="p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-center text-red-400">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg font-medium mb-2">Map Error</div>
          <p className="text-sm">{error}</p>
          <GlassButton 
            onClick={() => window.location.reload()} 
            className="mt-4"
            size="sm"
          >
            Retry
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 min-h-[500px]">
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center text-gray-300">
            <GlassSpinner size="lg" className="mb-4" />
            <div className="text-lg font-medium mb-2">Loading Impact Map</div>
            <p className="text-sm">Calculating impact zones and damage assessment...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Map Controls */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">🗺️ 2D Impact Analysis</h3>
            <div className="flex space-x-2">
              <GlassButton
                size="sm"
                onClick={() => setShowDamageZones(!showDamageZones)}
                variant={showDamageZones ? 'primary' : 'secondary'}
              >
                Damage Zones
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={() => setShowPopulationData(!showPopulationData)}
                variant={showPopulationData ? 'primary' : 'secondary'}
              >
                Population
              </GlassButton>
              <GlassButton size="sm" onClick={resetView}>
                Reset View
              </GlassButton>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="relative bg-black/20 rounded-lg border border-white/10 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={mapWidth}
              height={mapHeight}
              className="w-full h-auto cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{ maxHeight: '400px' }}
            />
            
            {/* Zoom indicator */}
            <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-sm">
              Zoom: {(zoomLevel * 100).toFixed(0)}%
            </div>
          </div>

          {/* Legend */}
          {showDamageZones && (
            <div className="grid grid-cols-5 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-800"></div>
                <span className="text-gray-300">Total Destruction</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-600"></div>
                <span className="text-gray-300">Severe Destruction</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-gray-300">Moderate Destruction</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Light Destruction</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-300"></div>
                <span className="text-gray-300">Thermal Radiation</span>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default Advanced2DImpactMap;