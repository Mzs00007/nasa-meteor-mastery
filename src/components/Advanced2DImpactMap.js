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
  const [showEnergyDistribution, setShowEnergyDistribution] = useState(true);
  const [showRadiationMap, setShowRadiationMap] = useState(true);
  const [showThermalDistribution, setShowThermalDistribution] = useState(true);
  const [energyWaves, setEnergyWaves] = useState([]);
  const [impactAnimation, setImpactAnimation] = useState(null);
  const [smokeEffects, setSmokeEffects] = useState([]);
  const animationFrameRef = useRef(null);

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
    if (!asteroidParams) return 0;
    
    const diameter = asteroidParams.diameter || 100;
    const velocity = asteroidParams.velocity || 20;
    const density = asteroidParams.composition === 'iron' ? 7.8 : 
                   asteroidParams.composition === 'stone' ? 3.5 : 2.0;
    
    // If simulation results are available, use them
    if (simulationResults && simulationResults.craterDiameter) {
      return simulationResults.craterDiameter;
    }
    
    // Otherwise, calculate estimated crater size (in meters)
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

  // Calculate energy distribution zones
  const calculateEnergyDistribution = useCallback(() => {
    if (!asteroidParams || !simulationResults) return null;
    
    const energy = simulationResults.energy || simulationResults.impactEnergy || 1e15; // Default 1 MT TNT equivalent
    const craterSize = calculateCraterSize();
    
    return {
      seismicWaves: {
        radius: craterSize * 50, // Seismic waves travel far
        intensity: Math.log10(energy / 1e12) // Richter scale approximation
      },
      airBlast: {
        radius: craterSize * 25,
        pressure: energy / 1e14 // Overpressure in PSI
      },
      thermalPulse: {
        radius: craterSize * 20,
        temperature: Math.pow(energy / 1e12, 0.4) * 1000 // Temperature in Kelvin
      },
      radiationZone: {
        radius: craterSize * 30,
        dosage: energy / 1e13 // Radiation dosage
      }
    };
  }, [asteroidParams, simulationResults, calculateCraterSize]);

  // Draw energy wave propagation
  const drawEnergyWaves = useCallback((ctx) => {
    if (!showEnergyDistribution || !simulationResults) return;
    
    const location = impactLocation || { latitude: 40.7128, longitude: -74.0060 };
    const { x, y } = latLngToCanvas(location.latitude, location.longitude);
    const energyData = calculateEnergyDistribution();
    
    if (!energyData) return;
    
    const metersToPixels = (meters) => (meters / 111320) * (mapWidth / 360) * zoomLevel;
    
    // Draw expanding energy waves
    energyWaves.forEach(wave => {
      const waveRadius = metersToPixels(wave.radius);
      const alpha = Math.max(0, 1 - wave.age / wave.maxAge);
      
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      
      // Create pulsing wave effect
      const gradient = ctx.createRadialGradient(
        x + panOffset.x, y + panOffset.y, waveRadius * 0.8,
        x + panOffset.x, y + panOffset.y, waveRadius
      );
      
      switch(wave.type) {
        case 'seismic':
          gradient.addColorStop(0, 'rgba(139, 69, 19, 0)');
          gradient.addColorStop(1, 'rgba(139, 69, 19, 0.8)');
          break;
        case 'airblast':
          gradient.addColorStop(0, 'rgba(135, 206, 235, 0)');
          gradient.addColorStop(1, 'rgba(135, 206, 235, 0.6)');
          break;
        case 'thermal':
          gradient.addColorStop(0, 'rgba(255, 69, 0, 0)');
          gradient.addColorStop(1, 'rgba(255, 69, 0, 0.7)');
          break;
      }
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + panOffset.x, y + panOffset.y, waveRadius, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.restore();
    });
  }, [showEnergyDistribution, simulationResults, impactLocation, latLngToCanvas, energyWaves, zoomLevel, panOffset, calculateEnergyDistribution]);

  // Draw radiation intensity map
  const drawRadiationMap = useCallback((ctx) => {
    if (!showRadiationMap || !simulationResults) return;
    
    const location = impactLocation || { latitude: 40.7128, longitude: -74.0060 };
    const { x, y } = latLngToCanvas(location.latitude, location.longitude);
    const energyData = calculateEnergyDistribution();
    
    if (!energyData) return;
    
    const metersToPixels = (meters) => (meters / 111320) * (mapWidth / 360) * zoomLevel;
    const radiationRadius = metersToPixels(energyData.radiationZone.radius);
    
    // Create radiation intensity gradient
    const gradient = ctx.createRadialGradient(
      x + panOffset.x, y + panOffset.y, 0,
      x + panOffset.x, y + panOffset.y, radiationRadius
    );
    
    // Color coding for radiation levels
    gradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)'); // Magenta - lethal
    gradient.addColorStop(0.3, 'rgba(255, 0, 0, 0.6)'); // Red - severe
    gradient.addColorStop(0.6, 'rgba(255, 165, 0, 0.4)'); // Orange - moderate
    gradient.addColorStop(0.8, 'rgba(255, 255, 0, 0.2)'); // Yellow - mild
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0.05)'); // Transparent
    
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + panOffset.x, y + panOffset.y, radiationRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add radiation symbol at center
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff00ff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('☢', x + panOffset.x, y + panOffset.y + 6);
    
    ctx.restore();
  }, [showRadiationMap, simulationResults, impactLocation, latLngToCanvas, zoomLevel, panOffset, calculateEnergyDistribution]);

  // Draw thermal distribution
  const drawThermalDistribution = useCallback((ctx) => {
    if (!showThermalDistribution || !simulationResults) return;
    
    const location = impactLocation || { latitude: 40.7128, longitude: -74.0060 };
    const { x, y } = latLngToCanvas(location.latitude, location.longitude);
    const energyData = calculateEnergyDistribution();
    
    if (!energyData) return;
    
    const metersToPixels = (meters) => (meters / 111320) * (mapWidth / 360) * zoomLevel;
    const thermalRadius = metersToPixels(energyData.thermalPulse.radius);
    
    // Create thermal heat map with multiple temperature zones
    const temperatureZones = [
      { radius: thermalRadius * 0.2, temp: 6000, color: 'rgba(255, 255, 255, 0.9)' }, // White hot
      { radius: thermalRadius * 0.4, temp: 3000, color: 'rgba(255, 255, 0, 0.8)' },   // Yellow
      { radius: thermalRadius * 0.6, temp: 1500, color: 'rgba(255, 165, 0, 0.6)' },   // Orange
      { radius: thermalRadius * 0.8, temp: 800, color: 'rgba(255, 69, 0, 0.4)' },     // Red-orange
      { radius: thermalRadius, temp: 400, color: 'rgba(139, 0, 0, 0.2)' }             // Dark red
    ];
    
    temperatureZones.forEach((zone, index) => {
      const gradient = ctx.createRadialGradient(
        x + panOffset.x, y + panOffset.y, index > 0 ? temperatureZones[index - 1].radius : 0,
        x + panOffset.x, y + panOffset.y, zone.radius
      );
      
      gradient.addColorStop(0, index > 0 ? temperatureZones[index - 1].color : zone.color);
      gradient.addColorStop(1, zone.color);
      
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x + panOffset.x, y + panOffset.y, zone.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
    
    // Add temperature readings at key points
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    temperatureZones.forEach((zone, index) => {
      if (index % 2 === 0) { // Show every other temperature
        const textX = x + panOffset.x + zone.radius * 0.7;
        const textY = y + panOffset.y;
        const tempText = `${zone.temp}°K`;
        
        ctx.strokeText(tempText, textX, textY);
        ctx.fillText(tempText, textX, textY);
      }
    });
    
    ctx.restore();
  }, [showThermalDistribution, simulationResults, impactLocation, latLngToCanvas, zoomLevel, panOffset, calculateEnergyDistribution]);

  // Trigger energy wave propagation
  const triggerEnergyWaves = useCallback(() => {
    if (!simulationResults || !impactLocation) return;
    
    const energyData = calculateEnergyDistribution();
    if (!energyData) return;
    
    // Create different types of energy waves
    const waveTypes = [
      { type: 'seismic', radius: energyData.seismicWaves.radius, speed: 8000, delay: 0 }, // 8 km/s
      { type: 'airblast', radius: energyData.airBlast.radius, speed: 343, delay: 1000 }, // Speed of sound
      { type: 'thermal', radius: energyData.thermalPulse.radius, speed: 299792458, delay: 0 } // Speed of light
    ];
    
    waveTypes.forEach(waveType => {
      setTimeout(() => {
        const wave = {
          id: Date.now() + Math.random(),
          type: waveType.type,
          radius: 0,
          maxRadius: waveType.radius,
          speed: waveType.speed,
          age: 0,
          maxAge: 10000, // 10 seconds
          startTime: Date.now()
        };
        
        setEnergyWaves(prev => [...prev, wave]);
        
        // Animate wave expansion
        const animateWave = () => {
          const elapsed = Date.now() - wave.startTime;
          const newRadius = (elapsed / 1000) * waveType.speed; // meters per second
          const age = elapsed;
          
          if (age < wave.maxAge && newRadius < waveType.radius) {
            setEnergyWaves(prev => prev.map(w => 
              w.id === wave.id 
                ? { ...w, radius: newRadius, age }
                : w
            ));
            requestAnimationFrame(animateWave);
          } else {
            // Remove wave
            setEnergyWaves(prev => prev.filter(w => w.id !== wave.id));
          }
        };
        
        requestAnimationFrame(animateWave);
      }, waveType.delay);
    });
  }, [simulationResults, impactLocation, calculateEnergyDistribution]);
  
  // Draw realistic world map with detailed continents
  const drawWorldMap = useCallback((ctx) => {
    // Ocean background
    ctx.fillStyle = '#1a365d';
    ctx.fillRect(0, 0, mapWidth, mapHeight);
    
    // Land masses
    ctx.fillStyle = '#2d5a27';
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;

    // More detailed continent shapes
    const continents = [
      // North America - more detailed shape
      { 
        name: 'North America',
        points: [
          [150, 80], [180, 70], [220, 75], [250, 85], [280, 95], [300, 110], 
          [320, 130], [310, 150], [290, 170], [270, 185], [250, 195], [230, 200],
          [210, 190], [190, 180], [170, 165], [155, 145], [145, 120], [140, 95]
        ]
      },
      // Greenland
      {
        name: 'Greenland',
        points: [[320, 40], [340, 45], [350, 60], [345, 80], [330, 85], [315, 75], [310, 55]]
      },
      // South America - more detailed
      {
        name: 'South America',
        points: [
          [240, 210], [260, 215], [275, 225], [285, 240], [290, 260], [285, 280],
          [280, 300], [275, 320], [265, 335], [250, 340], [235, 335], [225, 320],
          [220, 300], [225, 280], [230, 260], [235, 240], [238, 225]
        ]
      },
      // Europe - detailed
      {
        name: 'Europe',
        points: [
          [370, 70], [390, 65], [410, 70], [425, 80], [435, 95], [430, 110],
          [420, 120], [405, 125], [390, 120], [375, 115], [365, 100], [368, 85]
        ]
      },
      // Africa - detailed shape
      {
        name: 'Africa',
        points: [
          [370, 130], [385, 135], [400, 145], [415, 160], [425, 180], [430, 200],
          [435, 220], [440, 240], [435, 260], [425, 280], [410, 295], [395, 305],
          [380, 310], [365, 305], [355, 290], [350, 270], [355, 250], [360, 230],
          [365, 210], [368, 190], [370, 170], [372, 150]
        ]
      },
      // Asia - more detailed
      {
        name: 'Asia',
        points: [
          [440, 50], [480, 45], [520, 50], [560, 60], [600, 75], [640, 90],
          [680, 105], [720, 120], [740, 140], [735, 160], [720, 175], [700, 185],
          [680, 190], [660, 185], [640, 180], [620, 175], [600, 170], [580, 165],
          [560, 160], [540, 155], [520, 150], [500, 145], [480, 140], [460, 135],
          [445, 125], [440, 110], [438, 95], [440, 80], [442, 65]
        ]
      },
      // India subcontinent
      {
        name: 'India',
        points: [
          [520, 160], [535, 165], [545, 175], [550, 190], [545, 205], [535, 215],
          [525, 220], [515, 215], [510, 200], [515, 185], [518, 170]
        ]
      },
      // Australia - detailed
      {
        name: 'Australia',
        points: [
          [580, 250], [620, 255], [650, 265], [670, 280], [675, 295], [670, 310],
          [650, 320], [620, 315], [590, 310], [570, 300], [560, 285], [565, 270],
          [575, 260]
        ]
      },
      // Antarctica
      {
        name: 'Antarctica',
        points: [
          [100, 360], [200, 365], [300, 370], [400, 375], [500, 370], [600, 365],
          [700, 360], [700, 390], [100, 390]
        ]
      }
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
      ctx.fill();
      ctx.stroke();
    });

    // Add some major islands
    const islands = [
      // Madagascar
      { points: [[440, 270], [445, 275], [450, 285], [445, 295], [440, 290], [435, 280]] },
      // Japan
      { points: [[680, 120], [685, 125], [690, 135], [685, 140], [680, 135], [675, 130]] },
      // UK
      { points: [[360, 85], [365, 90], [370, 95], [365, 100], [360, 95], [355, 90]] },
      // New Zealand
      { points: [[720, 290], [725, 295], [730, 305], [725, 310], [720, 305], [715, 295]] }
    ];

    islands.forEach(island => {
      ctx.beginPath();
      island.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
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

  // Draw impact crater and damage zones with enhanced heat visualization
  const drawImpactZones = useCallback((ctx) => {
    // Use actual impact location or default preview location
    const location = impactLocation || { latitude: 40.7128, longitude: -74.0060 }; // Default to NYC
    
    if (!showDamageZones && !impactLocation) return;

    const { x, y } = latLngToCanvas(location.latitude, location.longitude);
    const damageZones = calculateDamageZones();

    // Convert meters to pixels (approximate)
    const metersToPixels = (meters) => (meters / 111320) * (mapWidth / 360) * zoomLevel;

    // Enhanced heat zones with gradient effects
    const zones = [
      { 
        radius: metersToPixels(damageZones.thermalRadiation), 
        color: 'rgba(255, 165, 0, 0.15)', 
        borderColor: 'rgba(255, 165, 0, 0.6)',
        label: 'Thermal Radiation',
        temp: '3rd degree burns'
      },
      { 
        radius: metersToPixels(damageZones.lightDestruction), 
        color: 'rgba(255, 255, 0, 0.25)', 
        borderColor: 'rgba(255, 255, 0, 0.7)',
        label: 'Light Destruction',
        temp: 'Glass breaks, minor injuries'
      },
      { 
        radius: metersToPixels(damageZones.moderateDestruction), 
        color: 'rgba(255, 140, 0, 0.35)', 
        borderColor: 'rgba(255, 140, 0, 0.8)',
        label: 'Moderate Destruction',
        temp: 'Buildings damaged'
      },
      { 
        radius: metersToPixels(damageZones.severeDestruction), 
        color: 'rgba(255, 69, 0, 0.5)', 
        borderColor: 'rgba(255, 69, 0, 0.9)',
        label: 'Severe Destruction',
        temp: 'Most buildings destroyed'
      },
      { 
        radius: metersToPixels(damageZones.totalDestruction), 
        color: 'rgba(139, 0, 0, 0.7)', 
        borderColor: 'rgba(139, 0, 0, 1)',
        label: 'Total Destruction',
        temp: 'Complete annihilation'
      }
    ];

    // Draw damage zones from largest to smallest with gradient effects
    if (showDamageZones) {
      zones.forEach((zone, index) => {
        // Create radial gradient for heat effect
        const gradient = ctx.createRadialGradient(
          x + panOffset.x, y + panOffset.y, 0,
          x + panOffset.x, y + panOffset.y, zone.radius
        );
        
        if (simulationResults) {
          // More intense colors for actual simulation
          gradient.addColorStop(0, zone.color.replace(/0\.\d+/, '0.8'));
          gradient.addColorStop(0.7, zone.color.replace(/0\.\d+/, '0.4'));
          gradient.addColorStop(1, zone.color.replace(/0\.\d+/, '0.1'));
        } else {
          // Softer colors for preview
          gradient.addColorStop(0, zone.color.replace(/0\.\d+/, '0.3'));
          gradient.addColorStop(0.7, zone.color.replace(/0\.\d+/, '0.15'));
          gradient.addColorStop(1, zone.color.replace(/0\.\d+/, '0.05'));
        }

        ctx.beginPath();
        ctx.arc(x + panOffset.x, y + panOffset.y, zone.radius, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Pulsing border effect for active simulation
        if (simulationResults && impactAnimation) {
          const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
          ctx.strokeStyle = zone.borderColor.replace(/[\d\.]+\)$/, `${pulseIntensity})`);
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = zone.borderColor;
          ctx.lineWidth = 2;
        }
        ctx.stroke();
      });
    }

    // Draw smoke effects if any
    smokeEffects.forEach(smoke => {
      if (smoke.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = smoke.opacity;
        ctx.fillStyle = `rgba(60, 60, 60, ${smoke.opacity})`;
        
        // Draw multiple smoke particles
        smoke.particles.forEach(particle => {
          ctx.beginPath();
          ctx.arc(
            particle.x + panOffset.x, 
            particle.y + panOffset.y, 
            particle.size, 
            0, 2 * Math.PI
          );
          ctx.fill();
        });
        ctx.restore();
      }
    });

    // Draw meteor trail if animation is active
    if (impactAnimation && impactAnimation.progress < 1) {
      const startX = impactAnimation.startX + panOffset.x;
      const startY = impactAnimation.startY + panOffset.y;
      const endX = x + panOffset.x;
      const endY = y + panOffset.y;
      
      const currentX = startX + (endX - startX) * impactAnimation.progress;
      const currentY = startY + (endY - startY) * impactAnimation.progress;
      
      // Meteor trail
      const gradient = ctx.createLinearGradient(startX, startY, currentX, currentY);
      gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
      gradient.addColorStop(0.7, 'rgba(255, 150, 0, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 200, 0, 1)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      
      // Meteor head
      ctx.beginPath();
      ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffff00';
      ctx.fill();
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw impact point
    ctx.beginPath();
    const impactSize = simulationResults ? 8 * zoomLevel : 5 * zoomLevel;
    ctx.arc(x + panOffset.x, y + panOffset.y, impactSize, 0, 2 * Math.PI);
    
    if (simulationResults) {
      // Pulsing red for actual impact
      const pulseIntensity = Math.sin(Date.now() * 0.02) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseIntensity})`;
    } else {
      // Orange for preview
      ctx.fillStyle = '#ffaa00';
    }
    
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [impactLocation, showDamageZones, latLngToCanvas, calculateDamageZones, zoomLevel, panOffset, simulationResults, impactAnimation, smokeEffects]);

  // Draw impact information
  const drawImpactInfo = useCallback((ctx) => {
    // Use actual impact location or default preview location
    const location = impactLocation || { latitude: 40.7128, longitude: -74.0060 }; // Default to NYC
    
    const { x, y } = latLngToCanvas(location.latitude, location.longitude);
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
    
    if (impactLocation && simulationResults) {
      ctx.fillText(`Impact Location:`, infoX + 10, infoY + 20);
      ctx.fillText(`${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`, infoX + 10, infoY + 35);
      ctx.fillText(`Crater Diameter: ${(craterSize / 1000).toFixed(1)} km`, infoX + 10, infoY + 50);
      const displayEnergy = simulationResults.energy || simulationResults.impactEnergy || 1e15;
      ctx.fillText(`Energy: ${(displayEnergy / 4.184e15).toFixed(2)} MT`, infoX + 10, infoY + 65);
    } else {
      ctx.fillText(`Preview Location:`, infoX + 10, infoY + 20);
      ctx.fillText(`${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`, infoX + 10, infoY + 35);
      ctx.fillText(`Estimated Crater: ${(craterSize / 1000).toFixed(1)} km`, infoX + 10, infoY + 50);
      ctx.fillText(`Run simulation for details`, infoX + 10, infoY + 65);
    }
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
    
    // Draw energy visualization features
    drawEnergyWaves(ctx);
    drawRadiationMap(ctx);
    drawThermalDistribution(ctx);
    
    drawImpactInfo(ctx);
  }, [zoomLevel, panOffset, drawGrid, drawWorldMap, drawImpactZones, drawEnergyWaves, drawRadiationMap, drawThermalDistribution, drawImpactInfo]);

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

  // Animation functions
  const startMeteorAnimation = useCallback(() => {
    if (!impactLocation) return;
    
    const { x: endX, y: endY } = latLngToCanvas(impactLocation.latitude, impactLocation.longitude);
    const startX = endX - 200; // Start from upper left
    const startY = endY - 200;
    
    setImpactAnimation({
      startX,
      startY,
      endX,
      endY,
      progress: 0,
      duration: 2000 // 2 seconds
    });
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 2000, 1);
      
      setImpactAnimation(prev => ({
        ...prev,
        progress
      }));
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, trigger smoke effects
        triggerSmokeEffects();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [impactLocation, latLngToCanvas]);
  
  const triggerSmokeEffects = useCallback(() => {
    if (!impactLocation) return;
    
    const { x, y } = latLngToCanvas(impactLocation.latitude, impactLocation.longitude);
    
    // Create multiple smoke particles
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        size: Math.random() * 20 + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
    
    const smokeEffect = {
      id: Date.now(),
      particles,
      opacity: 0.8,
      startTime: Date.now(),
      duration: 5000 // 5 seconds
    };
    
    setSmokeEffects(prev => [...prev, smokeEffect]);
    
    // Animate smoke
    const animateSmoke = () => {
      const elapsed = Date.now() - smokeEffect.startTime;
      const progress = elapsed / smokeEffect.duration;
      
      if (progress < 1) {
        setSmokeEffects(prev => prev.map(smoke => {
          if (smoke.id === smokeEffect.id) {
            return {
              ...smoke,
              opacity: 0.8 * (1 - progress),
              particles: smoke.particles.map(particle => ({
                ...particle,
                x: particle.x + particle.vx,
                y: particle.y + particle.vy,
                size: particle.size * (1 + progress * 0.5)
              }))
            };
          }
          return smoke;
        }));
        
        requestAnimationFrame(animateSmoke);
      } else {
        // Remove smoke effect
        setSmokeEffects(prev => prev.filter(smoke => smoke.id !== smokeEffect.id));
      }
    };
    
    requestAnimationFrame(animateSmoke);
  }, [impactLocation, latLngToCanvas]);

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

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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
                onClick={() => setShowEnergyDistribution(!showEnergyDistribution)}
                variant={showEnergyDistribution ? 'primary' : 'secondary'}
              >
                Energy Waves
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={() => setShowRadiationMap(!showRadiationMap)}
                variant={showRadiationMap ? 'primary' : 'secondary'}
              >
                Radiation
              </GlassButton>
              <GlassButton
                size="sm"
                onClick={() => setShowThermalDistribution(!showThermalDistribution)}
                variant={showThermalDistribution ? 'primary' : 'secondary'}
              >
                Thermal
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
              {simulationResults && (
                <GlassButton size="sm" onClick={triggerEnergyWaves} variant="accent">
                  Trigger Waves
                </GlassButton>
              )}
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
            
            {/* Preview Mode Overlay */}
          {!simulationResults && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-black/80 text-white px-4 py-3 rounded-lg border border-orange-500/50 text-center">
                <div className="text-orange-400 text-lg mb-1">🌠 Preview Mode</div>
                <div className="text-sm text-gray-300">
                  Run simulation to see actual impact results
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Click on map to set impact location
                </div>
              </div>
            </div>
          )}
            
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