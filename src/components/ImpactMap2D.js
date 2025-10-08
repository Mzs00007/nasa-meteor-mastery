import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useSimulation } from '../context/SimulationContext';
import { useEarthObservation, useWebSocket } from '../hooks/useWebSocket';
import visualizationDataIntegration from '../services/visualizationDataIntegration';
import { useAnimations, useEntranceAnimation, useLoadingAnimation } from '../hooks/useAnimations';
import * as animations from '../utils/animations';

import '../styles/theme.css';
import '../styles/components.css';
import '../styles/seismic-data.css';
import '../styles/glassmorphic.css';

// OpenLayers imports - with safety check
const getOpenLayers = () => {
  if (typeof window !== 'undefined' && window.ol) {
    return window.ol;
  }
  return null;
};

// Enhanced Particle System for Impact Effects
class ParticleSystem {
  constructor(canvas, impactLocation) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.impactLocation = impactLocation;
    this.animationId = null;
    this.startTime = Date.now();
  }

  createExplosionParticles(count = 100) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * 8 + 2,
        color: `hsl(${Math.random() * 60 + 10}, 100%, ${Math.random() * 50 + 50}%)`,
        type: 'explosion'
      });
    }
  }

  createShockwaveParticles() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      this.particles.push({
        x: centerX,
        y: centerY,
        angle: angle,
        radius: 0,
        maxRadius: Math.min(this.canvas.width, this.canvas.height) * 0.8,
        speed: 5,
        life: 1.0,
        decay: 0.008,
        size: 3,
        color: 'rgba(255, 255, 255, 0.8)',
        type: 'shockwave'
      });
    }
  }

  createDebrisParticles(count = 200) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        gravity: 0.3,
        life: 1.0,
        decay: Math.random() * 0.005 + 0.002,
        size: Math.random() * 6 + 1,
        color: `hsl(${Math.random() * 40 + 20}, 70%, ${Math.random() * 30 + 40}%)`,
        type: 'debris',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  update() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (particle.type === 'explosion') {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      } else if (particle.type === 'shockwave') {
        particle.radius += particle.speed;
        particle.x = this.canvas.width / 2 + Math.cos(particle.angle) * particle.radius;
        particle.y = this.canvas.height / 2 + Math.sin(particle.angle) * particle.radius;
      } else if (particle.type === 'debris') {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.rotation += particle.rotationSpeed;
      }
      
      particle.life -= particle.decay;
      
      if (particle.life <= 0 || (particle.type === 'shockwave' && particle.radius > particle.maxRadius)) {
        this.particles.splice(i, 1);
        continue;
      }
      
      this.drawParticle(particle);
    }
    
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.update());
    }
  }

  drawParticle(particle) {
    this.ctx.save();
    this.ctx.globalAlpha = particle.life;
    
    if (particle.type === 'shockwave') {
      this.ctx.strokeStyle = particle.color;
      this.ctx.lineWidth = particle.size;
      this.ctx.beginPath();
      this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, particle.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    } else {
      this.ctx.fillStyle = particle.color;
      this.ctx.translate(particle.x, particle.y);
      
      if (particle.type === 'debris') {
        this.ctx.rotate(particle.rotation);
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }

  start() {
    this.createExplosionParticles(150);
    this.createShockwaveParticles();
    this.createDebrisParticles(300);
    this.update();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
  }
}

// Error Boundary for ImpactMap2D
class ImpactMapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ImpactMap2D Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          margin: '16px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div className="error-message">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#ff6b6b', marginBottom: '12px' }}>Map Visualization Error</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '16px' }}>There was an error loading the impact map. This might be due to:</p>
            <ul style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
              <li>Missing map data or coordinates</li>
              <li>Network connectivity issues</li>
              <li>Browser compatibility problems</li>
            </ul>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ImpactMap2D = () => {
  const { impactLocation, simulationResults, loading, nasaAsteroidData, nasaDataLoading } = useSimulation();
  const { satelliteImagery, environmentalIndicators, naturalDisasters } =
    useEarthObservation();
  const { isConnected, getCachedData } = useWebSocket();

  const mapRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const [map, setMap] = useState(null);
  const [olLoaded, setOlLoaded] = useState(false);
  const [mapMode, setMapMode] = useState('nasa_satellite'); // nasa_satellite, nasa_blue_marble, usgs_terrain, standard
  const [overlayLayers, setOverlayLayers] = useState({
    impactZone: true,
    seismicData: true,
    atmosphericEffects: true,
    realTimeEvents: true,
    populationDensity: false,
    infrastructureData: false,
    weatherData: false,
    energyVisualization: true,
    particleEffects: true,
    shockwaveAnimation: true,
    thermalEffects: true,
    debrisField: true,
    craterAnimation: true,
    shockwaveAnimationLayer: true,
    thermalEffectsAnimation: true,
    debrisFieldAnimation: true
  });

  // Enhanced state for new features
  const [particleSystem, setParticleSystem] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [showAdvancedEffects, setShowAdvancedEffects] = useState(true);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [seismicData, setSeismicData] = useState([]);
  const [realTimeEvents, setRealTimeEvents] = useState([]);
  const [weatherStations, setWeatherStations] = useState([]);
  const [populationData, setPopulationData] = useState([]);
  const [infrastructureData, setInfrastructureData] = useState([]);
  const [mapInteractionMode, setMapInteractionMode] = useState('view'); // view, measure, analyze
  const [measurementData, setMeasurementData] = useState(null);
  const [downloadedData, setDownloadedData] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [elevationLayer, setElevationLayer] = useState(null);
  const [spaceWeatherLayer, setSpaceWeatherLayer] = useState(null);

  // Time-based animation system
  const [animationPhase, setAnimationPhase] = useState('pre-impact'); // pre-impact, approach, impact, crater-formation, shockwave, aftermath
  const [animationStartTime, setAnimationStartTime] = useState(null);
  const [craterRadius, setCraterRadius] = useState(0);
  const [shockwaveRadius, setShockwaveRadius] = useState(0);
  const [debrisField, setDebrisField] = useState([]);
  const [thermalEffects, setThermalEffects] = useState({ intensity: 0, radius: 0 });
  const [seismicWaves, setSeismicWaves] = useState([]);

  // Animation hooks for enhanced visual effects
  const {
    animateEntrance,
    animateImpactRipple,
    animateMapMarker,
    animatePulse,
    animateShake,
    animateMeteorTrail,
    animateStagger,
    stopAllAnimations
  } = useAnimations();

  // Entrance animation for the map container
  const mapContainerRef = useEntranceAnimation({ type: 'fade', delay: 200 });
  
  // Loading animation for the loading overlay
  const loadingRef = useLoadingAnimation(loading, { duration: 1000 });

  // Animation timeline configuration
  const animationTimeline = {
    'pre-impact': { duration: 2000, description: 'Pre-Impact Assessment' },
    'approach': { duration: 3000, description: 'Meteor Approach' },
    'impact': { duration: 1000, description: 'Initial Impact' },
    'crater-formation': { duration: 4000, description: 'Crater Formation' },
    'shockwave': { duration: 3000, description: 'Shockwave Propagation' },
    'aftermath': { duration: 5000, description: 'Aftermath & Recovery' }
  };

  const totalAnimationDuration = Object.values(animationTimeline).reduce((sum, phase) => sum + phase.duration, 0);

  // Check if OpenLayers is loaded
  useEffect(() => {
    const checkOlLoaded = () => {
      const ol = getOpenLayers();
      if (ol) {
        setOlLoaded(true);
      } else {
        // Retry after a short delay
        setTimeout(checkOlLoaded, 100);
      }
    };
    checkOlLoaded();
  }, []);

  // Function to create base layers
  const createBaseLayers = () => {
    const ol = getOpenLayers();
    if (!ol) return {};
    
    return {
      nasa_satellite: new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          crossOrigin: 'anonymous',
          attributions: 'Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
          maxZoom: 18,
        }),
        visible: mapMode === 'nasa_satellite',
      }),
      nasa_blue_marble: new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
          crossOrigin: 'anonymous',
          attributions: 'National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
          maxZoom: 16,
        }),
        visible: mapMode === 'nasa_blue_marble',
      }),
      usgs_terrain: new ol.layer.Tile({
        source: new ol.source.XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          crossOrigin: 'anonymous',
          attributions: 'Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
          maxZoom: 18,
        }),
        visible: mapMode === 'usgs_terrain',
      }),
      standard: new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: mapMode === 'standard',
      }),
    };
  };

  // Enhanced atmospheric effects visualization
  const createAtmosphericEffectsLayer = () => {
    if (!impactLocation || !simulationResults || !impactLocation.longitude || !impactLocation.latitude) {
      return null;
    }

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const craterDiameter = simulationResults.craterDiameter || 1; // Default to 1 km if undefined

    // Create multiple concentric circles for atmospheric effects
    const effectRadii = [
      {
        radius: craterDiameter * 2,
        color: 'rgba(255, 100, 0, 0.3)',
        effect: 'Fireball',
      },
      {
        radius: craterDiameter * 5,
        color: 'rgba(255, 150, 0, 0.2)',
        effect: 'Thermal Radiation',
      },
      {
        radius: craterDiameter * 10,
        color: 'rgba(255, 200, 0, 0.15)',
        effect: 'Atmospheric Disturbance',
      },
      {
        radius: craterDiameter * 20,
        color: 'rgba(200, 200, 200, 0.1)',
        effect: 'Dust Cloud',
      },
    ];

    effectRadii.forEach((effect, index) => {
      const circle = new ol.geom.Circle(
        ol.proj.fromLonLat(impactCoords),
        effect.radius * 1000 // Convert km to meters
      );

      const feature = new ol.Feature({
        geometry: circle,
        effectType: effect.effect,
        radius: effect.radius,
      });

      const style = new ol.style.Style({
        fill: new ol.style.Fill({ color: effect.color }),
        stroke: new ol.style.Stroke({
          color: effect.color.replace(/0\.\d+/, '0.8'),
          width: 2,
          lineDash: [5, 5],
        }),
      });

      feature.setStyle(style);
      features.push(feature);
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'atmosphericEffects',
    });
  };

  // Enhanced thermal effects visualization
  const createThermalEffectsLayer = () => {
    if (!impactLocation || !simulationResults) return null;

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const energy = simulationResults.energy || 1e12;
    const craterDiameter = simulationResults.craterDiameter || 1;

    // Create thermal gradient zones
    const thermalZones = [
      { radius: craterDiameter * 1.5, temp: 3000, color: 'rgba(255, 255, 255, 0.9)' },
      { radius: craterDiameter * 3, temp: 2000, color: 'rgba(255, 200, 0, 0.7)' },
      { radius: craterDiameter * 6, temp: 1000, color: 'rgba(255, 100, 0, 0.5)' },
      { radius: craterDiameter * 12, temp: 500, color: 'rgba(255, 50, 0, 0.3)' },
      { radius: craterDiameter * 25, temp: 200, color: 'rgba(255, 0, 0, 0.2)' }
    ];

    thermalZones.forEach((zone, index) => {
      const circle = new ol.geom.Circle(
        ol.proj.fromLonLat(impactCoords),
        zone.radius * 1000
      );

      const feature = new ol.Feature({
        geometry: circle,
        temperature: zone.temp,
        thermalZone: index + 1
      });

      const style = new ol.style.Style({
        fill: new ol.style.Fill({ color: zone.color }),
        stroke: new ol.style.Stroke({
          color: zone.color.replace(/0\.\d+/, '1.0'),
          width: 1
        })
      });

      feature.setStyle(style);
      features.push(feature);
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'thermalEffects',
    });
  };

  // Enhanced debris field visualization
  const createDebrisFieldLayer = () => {
    if (!impactLocation || !simulationResults) return null;

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const craterDiameter = simulationResults.craterDiameter || 1;

    // Create debris scatter pattern
    const debrisCount = Math.min(500, Math.max(50, craterDiameter * 20));
    
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * craterDiameter * 50 * 1000; // Convert to meters
      const size = Math.random() * 10 + 2;
      
      const debrisCoords = [
        impactLocation.longitude + (Math.cos(angle) * distance) / 111320,
        impactLocation.latitude + (Math.sin(angle) * distance) / 110540
      ];

      const point = new ol.geom.Point(ol.proj.fromLonLat(debrisCoords));
      const feature = new ol.Feature({
        geometry: point,
        debrisSize: size,
        debrisType: Math.random() > 0.5 ? 'rock' : 'metal'
      });

      const style = new ol.style.Style({
        image: new ol.style.Circle({
          radius: size / 2,
          fill: new ol.style.Fill({
            color: Math.random() > 0.5 ? 'rgba(139, 69, 19, 0.8)' : 'rgba(169, 169, 169, 0.8)'
          }),
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            width: 1
          })
        })
      });

      feature.setStyle(style);
      features.push(feature);
    }

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'debrisField',
    });
  };

  // Enhanced energy visualization with heatmap
  const createEnergyVisualizationLayer = () => {
    if (!impactLocation || !simulationResults) return null;

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const energy = simulationResults.energy || 1e12;
    const craterDiameter = simulationResults.craterDiameter || 1;

    // Create energy distribution grid
    const gridSize = 20;
    const maxRadius = craterDiameter * 30;
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let y = -gridSize; y <= gridSize; y++) {
        const distance = Math.sqrt(x * x + y * y);
        if (distance > gridSize) continue;

        const realDistance = (distance / gridSize) * maxRadius;
        const energyIntensity = Math.max(0, 1 - (realDistance / maxRadius));
        
        if (energyIntensity < 0.1) continue;

        const pointCoords = [
          impactLocation.longitude + (x / gridSize) * (maxRadius / 111320),
          impactLocation.latitude + (y / gridSize) * (maxRadius / 110540)
        ];

        const point = new ol.geom.Point(ol.proj.fromLonLat(pointCoords));
        const feature = new ol.Feature({
          geometry: point,
          energyIntensity: energyIntensity,
          energyValue: energy * energyIntensity
        });

        const alpha = energyIntensity * 0.8;
        const hue = (1 - energyIntensity) * 240; // Blue to red gradient
        
        const style = new ol.style.Style({
          image: new ol.style.Circle({
            radius: 8 * energyIntensity + 2,
            fill: new ol.style.Fill({
              color: `hsla(${hue}, 100%, 50%, ${alpha})`
            })
          })
        });

        feature.setStyle(style);
        features.push(feature);
      }
    }

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'energyVisualization',
    });
  };

  // Initialize particle system
  const initializeParticleSystem = useCallback(() => {
    if (particleCanvasRef.current && impactLocation && overlayLayers.particleEffects) {
      const canvas = particleCanvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      const newParticleSystem = new ParticleSystem(canvas, impactLocation);
      setParticleSystem(newParticleSystem);
      
      if (simulationResults && showAdvancedEffects) {
        newParticleSystem.start();
        setIsAnimating(true);
      }
    }
  }, [impactLocation, overlayLayers.particleEffects, simulationResults, showAdvancedEffects]);

  // Trigger impact animation with enhanced Anime.js effects
  const triggerImpactAnimation = useCallback(() => {
    if (particleSystem && showAdvancedEffects) {
      particleSystem.stop();
      particleSystem.start();
      setIsAnimating(true);
      
      // Enhanced impact animations with Anime.js
      if (impactLocation) {
        // Animate impact ripple effect
        animateImpactRipple(mapRef.current, {
          x: impactLocation.longitude,
          y: impactLocation.latitude,
          maxRadius: 200,
          duration: 3000
        });
        
        // Animate meteor trail effect
        animateMeteorTrail(mapRef.current, {
          startX: impactLocation.longitude - 50,
          startY: impactLocation.latitude - 50,
          endX: impactLocation.longitude,
          endY: impactLocation.latitude,
          duration: 2000
        });
        
        // Shake effect for impact
        setTimeout(() => {
          animateShake(mapRef.current, { intensity: 10, duration: 1000 });
        }, 2000);
      }
      
      // Stop animation after 10 seconds
      setTimeout(() => {
        setIsAnimating(false);
      }, 10000);
    }
  }, [particleSystem, showAdvancedEffects, impactLocation, animateImpactRipple, animateMeteorTrail, animateShake]);

  // Time-based animation system functions
  const startTimeBasedAnimation = useCallback(() => {
    setAnimationStartTime(Date.now());
    setAnimationPhase('pre-impact');
    setIsAnimating(true);
    setTimelinePosition(0);
    
    // Reset all animation states
    setCraterRadius(0);
    setShockwaveRadius(0);
    setDebrisField([]);
    setThermalEffects({ intensity: 0, radius: 0 });
    setSeismicWaves([]);
    
    // Start particle system if available
    if (particleSystem && showAdvancedEffects) {
      particleSystem.stop();
      particleSystem.start();
    }
  }, [particleSystem, showAdvancedEffects]);

  const updateAnimationPhase = useCallback((currentTime) => {
    if (!animationStartTime) return;
    
    const elapsed = (currentTime - animationStartTime) * animationSpeed;
    const progress = Math.min(elapsed / totalAnimationDuration, 1);
    
    setTimelinePosition(progress);
    
    // Determine current phase
    let cumulativeDuration = 0;
    let currentPhase = 'pre-impact';
    
    for (const [phase, config] of Object.entries(animationTimeline)) {
      if (elapsed <= cumulativeDuration + config.duration) {
        currentPhase = phase;
        break;
      }
      cumulativeDuration += config.duration;
    }
    
    setAnimationPhase(currentPhase);
    
    // Update phase-specific animations
    updatePhaseAnimations(currentPhase, elapsed, cumulativeDuration);
    
    // Continue animation if not complete
    if (progress < 1 && isAnimating) {
      requestAnimationFrame(updateAnimationPhase);
    } else if (progress >= 1) {
      setIsAnimating(false);
    }
  }, [animationStartTime, animationSpeed, totalAnimationDuration, isAnimating]);

  const updatePhaseAnimations = useCallback((phase, elapsed, cumulativeDuration) => {
    const phaseElapsed = elapsed - cumulativeDuration;
    const phaseDuration = animationTimeline[phase]?.duration || 1000;
    const phaseProgress = Math.min(phaseElapsed / phaseDuration, 1);
    
    switch (phase) {
      case 'pre-impact':
        // Show approach trajectory and impact prediction
        break;
        
      case 'approach':
        // Animate meteor approaching
        if (simulationResults) {
          const meteorTrail = {
            opacity: phaseProgress,
            length: phaseProgress * 100
          };
        }
        break;
        
      case 'impact':
        // Initial impact flash and energy release
        setThermalEffects({
          intensity: Math.sin(phaseProgress * Math.PI) * 100,
          radius: phaseProgress * 50
        });
        break;
        
      case 'crater-formation':
        // Crater formation and expansion
        const maxCraterRadius = simulationResults?.craterDiameter ? 
          simulationResults.craterDiameter / 2 : 500; // meters
        setCraterRadius(phaseProgress * maxCraterRadius);
        
        // Generate debris field
        if (phaseProgress > 0.3) {
          const debrisCount = Math.floor(phaseProgress * 100);
          const newDebris = [];
          for (let i = 0; i < debrisCount; i++) {
            const angle = (i / debrisCount) * Math.PI * 2;
            const distance = (phaseProgress - 0.3) * 2000; // meters
            newDebris.push({
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              size: Math.random() * 10 + 5,
              opacity: Math.max(0, 1 - (phaseProgress - 0.3) * 2)
            });
          }
          setDebrisField(newDebris);
        }
        break;
        
      case 'shockwave':
        // Shockwave propagation
        const maxShockwaveRadius = simulationResults?.shockwaveRadius || 10000; // meters
        setShockwaveRadius(phaseProgress * maxShockwaveRadius);
        
        // Generate seismic waves
        const waveCount = Math.floor(phaseProgress * 5);
        const waves = [];
        for (let i = 0; i < waveCount; i++) {
          waves.push({
            radius: (phaseProgress - i * 0.2) * maxShockwaveRadius,
            opacity: Math.max(0, 1 - (phaseProgress - i * 0.2) * 2),
            intensity: Math.max(0, 10 - i * 2)
          });
        }
        setSeismicWaves(waves);
        break;
        
      case 'aftermath':
        // Aftermath effects - dust clouds, fires, etc.
        setThermalEffects(prev => ({
          intensity: prev.intensity * (1 - phaseProgress * 0.5),
          radius: prev.radius + phaseProgress * 200
        }));
        
        // Fade out debris
        setDebrisField(prev => prev.map(debris => ({
          ...debris,
          opacity: debris.opacity * (1 - phaseProgress * 0.3)
        })));
        break;
    }
  }, [simulationResults, animationTimeline]);

  // Animation loop
  useEffect(() => {
    if (isAnimating && animationStartTime) {
      requestAnimationFrame(updateAnimationPhase);
    }
  }, [isAnimating, animationStartTime, updateAnimationPhase]);

  // Create population density overlay
  const createPopulationDensityLayer = () => {
    if (!impactLocation) return null;

    const features = [];
    const centerCoords = [impactLocation.longitude, impactLocation.latitude];

    // Generate synthetic population density data around impact location
    for (let i = 0; i < 50; i++) {
      const offsetLat = (Math.random() - 0.5) * 2; // ±1 degree
      const offsetLon = (Math.random() - 0.5) * 2; // ±1 degree
      const coords = [centerCoords[0] + offsetLon, centerCoords[1] + offsetLat];
      
      const population = Math.floor(Math.random() * 100000) + 1000;
      const density = population / 100; // people per km²
      
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(coords)),
        population: population,
        density: density,
        type: 'population'
      });

      // Style based on population density
      const color = density > 500 ? 'rgba(255, 0, 0, 0.7)' : 
                   density > 200 ? 'rgba(255, 165, 0, 0.7)' : 
                   'rgba(0, 255, 0, 0.7)';

      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: Math.min(Math.max(density / 50, 3), 15),
          fill: new ol.style.Fill({ color }),
          stroke: new ol.style.Stroke({ color: 'white', width: 1 })
        })
      }));

      features.push(feature);
    }

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'populationDensity'
    });
  };

  // Create infrastructure overlay
  const createInfrastructureLayer = () => {
    if (!impactLocation) return null;

    const features = [];
    const centerCoords = [impactLocation.longitude, impactLocation.latitude];

    const infrastructureTypes = [
      { type: 'hospital', icon: '🏥', color: 'rgba(255, 0, 0, 0.8)' },
      { type: 'school', icon: '🏫', color: 'rgba(0, 0, 255, 0.8)' },
      { type: 'power_plant', icon: '⚡', color: 'rgba(255, 255, 0, 0.8)' },
      { type: 'airport', icon: '✈️', color: 'rgba(128, 128, 128, 0.8)' },
      { type: 'bridge', icon: '🌉', color: 'rgba(139, 69, 19, 0.8)' },
      { type: 'dam', icon: '🏗️', color: 'rgba(0, 191, 255, 0.8)' }
    ];

    // Generate synthetic infrastructure data
    for (let i = 0; i < 30; i++) {
      const offsetLat = (Math.random() - 0.5) * 1.5;
      const offsetLon = (Math.random() - 0.5) * 1.5;
      const coords = [centerCoords[0] + offsetLon, centerCoords[1] + offsetLat];
      
      const infraType = infrastructureTypes[Math.floor(Math.random() * infrastructureTypes.length)];
      
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(coords)),
        infrastructureType: infraType.type,
        icon: infraType.icon,
        importance: Math.random() * 10,
        type: 'infrastructure'
      });

      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({ color: infraType.color }),
          stroke: new ol.style.Stroke({ color: 'white', width: 2 })
        }),
        text: new ol.style.Text({
          text: infraType.icon,
          font: '12px Arial',
          fill: new ol.style.Fill({ color: 'white' })
        })
      }));

      features.push(feature);
    }

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'infrastructureData'
    });
  };

  // Create weather data overlay
  const createWeatherDataLayer = () => {
    if (!impactLocation) return null;

    const features = [];
    const centerCoords = [impactLocation.longitude, impactLocation.latitude];

    // Generate synthetic weather station data
    for (let i = 0; i < 20; i++) {
      const offsetLat = (Math.random() - 0.5) * 3;
      const offsetLon = (Math.random() - 0.5) * 3;
      const coords = [centerCoords[0] + offsetLon, centerCoords[1] + offsetLat];
      
      const temperature = Math.floor(Math.random() * 40) - 10; // -10 to 30°C
      const windSpeed = Math.floor(Math.random() * 50); // 0-50 km/h
      const humidity = Math.floor(Math.random() * 100); // 0-100%
      
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat(coords)),
        temperature: temperature,
        windSpeed: windSpeed,
        humidity: humidity,
        type: 'weather'
      });

      // Style based on temperature
      const tempColor = temperature > 20 ? 'rgba(255, 0, 0, 0.7)' : 
                       temperature > 0 ? 'rgba(255, 255, 0, 0.7)' : 
                       'rgba(0, 0, 255, 0.7)';

      feature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({ color: tempColor }),
          stroke: new ol.style.Stroke({ color: 'white', width: 1 })
        }),
        text: new ol.style.Text({
          text: `${temperature}°C`,
          font: '10px Arial',
          fill: new ol.style.Fill({ color: 'white' }),
          offsetY: -15
        })
      }));

      features.push(feature);
    }

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'weatherData'
    });
  };

  // Create measurement visualization layer
  const createMeasurementLayer = () => {
    if (!measurementData) return null;

    const features = [];
    const ol = getOpenLayers();
    if (!ol) return null;

    // Start point
    if (measurementData.startPoint) {
      const startFeature = new ol.Feature({
        geometry: new ol.geom.Point(measurementData.startPoint),
        type: 'measurement_start'
      });

      startFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({ color: 'rgba(0, 255, 0, 0.8)' }),
          stroke: new ol.style.Stroke({ color: 'white', width: 2 })
        }),
        text: new ol.style.Text({
          text: 'START',
          font: 'bold 12px Arial',
          fill: new ol.style.Fill({ color: 'white' }),
          offsetY: -20
        })
      }));

      features.push(startFeature);
    }

    // End point and line
    if (measurementData.endPoint) {
      const endFeature = new ol.Feature({
        geometry: new ol.geom.Point(measurementData.endPoint),
        type: 'measurement_end'
      });

      endFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
          stroke: new ol.style.Stroke({ color: 'white', width: 2 })
        }),
        text: new ol.style.Text({
          text: 'END',
          font: 'bold 12px Arial',
          fill: new ol.style.Fill({ color: 'white' }),
          offsetY: -20
        })
      }));

      features.push(endFeature);

      // Measurement line
      const lineFeature = new ol.Feature({
        geometry: new ol.geom.LineString([measurementData.startPoint, measurementData.endPoint]),
        type: 'measurement_line'
      });

      lineFeature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 0, 0.8)',
          width: 3,
          lineDash: [10, 5]
        })
      }));

      features.push(lineFeature);

      // Distance label at midpoint
      const midPoint = [
        (measurementData.startPoint[0] + measurementData.endPoint[0]) / 2,
        (measurementData.startPoint[1] + measurementData.endPoint[1]) / 2
      ];

      const labelFeature = new ol.Feature({
        geometry: new ol.geom.Point(midPoint),
        type: 'measurement_label'
      });

      const distanceKm = (measurementData.distance / 1000).toFixed(2);
      labelFeature.setStyle(new ol.style.Style({
        text: new ol.style.Text({
          text: `${distanceKm} km`,
          font: 'bold 14px Arial',
          fill: new ol.style.Fill({ color: 'yellow' }),
          stroke: new ol.style.Stroke({ color: 'black', width: 2 }),
          backgroundFill: new ol.style.Fill({ color: 'rgba(0, 0, 0, 0.7)' }),
          padding: [4, 8, 4, 8]
        })
      }));

      features.push(labelFeature);
    }

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'measurementLayer',
      zIndex: 1000 // Ensure it's on top
    });
  };

  // Create crater formation animation layer
  const createCraterAnimationLayer = () => {
    if (!impactLocation || craterRadius === 0) return null;

    const features = [];
    const ol = getOpenLayers();
    if (!ol) return null;

    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const centerPoint = ol.proj.fromLonLat(impactCoords);

    // Animated crater
    const crater = new ol.geom.Circle(centerPoint, craterRadius);
    const craterFeature = new ol.Feature({
      geometry: crater,
      type: 'animated_crater'
    });

    craterFeature.setStyle(new ol.style.Style({
      fill: new ol.style.Fill({ 
        color: `rgba(139, 0, 0, ${Math.min(craterRadius / 500, 0.8)})` 
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(255, 0, 0, 0.9)',
        width: 3
      })
    }));

    features.push(craterFeature);

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'craterAnimation',
      zIndex: 500
    });
  };

  // Create shockwave animation layer
  const createShockwaveAnimationLayer = () => {
    if (!impactLocation || shockwaveRadius === 0) return null;

    const features = [];
    const ol = getOpenLayers();
    if (!ol) return null;

    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const centerPoint = ol.proj.fromLonLat(impactCoords);

    // Main shockwave
    const shockwave = new ol.geom.Circle(centerPoint, shockwaveRadius);
    const shockwaveFeature = new ol.Feature({
      geometry: shockwave,
      type: 'shockwave'
    });

    shockwaveFeature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: `rgba(255, 165, 0, ${Math.max(0.1, 1 - shockwaveRadius / 10000)})`,
        width: 4
      })
    }));

    features.push(shockwaveFeature);

    // Seismic waves
    seismicWaves.forEach((wave, index) => {
      if (wave.radius > 0 && wave.opacity > 0) {
        const seismicCircle = new ol.geom.Circle(centerPoint, wave.radius);
        const seismicFeature = new ol.Feature({
          geometry: seismicCircle,
          type: 'seismic_wave',
          intensity: wave.intensity
        });

        seismicFeature.setStyle(new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: `rgba(255, 255, 0, ${wave.opacity})`,
            width: Math.max(1, wave.intensity / 2),
            lineDash: [5, 5]
          })
        }));

        features.push(seismicFeature);
      }
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'shockwaveAnimation',
      zIndex: 400
    });
  };





  // Enhanced impact zone visualization with detailed effects
  const createEnhancedImpactZone = () => {
    if (!impactLocation || !simulationResults || !impactLocation.longitude || !impactLocation.latitude) {
      return null;
    }

    const features = [];
    const impactCoords = [impactLocation.longitude, impactLocation.latitude];
    const craterDiameter = simulationResults.craterDiameter || 1; // Default to 1 km if undefined

    // Main crater
    const crater = new ol.geom.Circle(
      ol.proj.fromLonLat(impactCoords),
      (craterDiameter / 2) * 1000
    );

    const craterFeature = new ol.Feature({
      geometry: crater,
      type: 'crater',
      diameter: craterDiameter,
    });

    craterFeature.setStyle(
      new ol.style.Style({
        fill: new ol.style.Fill({ color: 'rgba(139, 0, 0, 0.6)' }),
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 0, 0, 0.9)',
          width: 3,
        }),
      })
    );

    features.push(craterFeature);

    // Damage zones based on energy
    const energy = simulationResults.energy || 1e12;
    const damageZones = [
      {
        radius: craterDiameter * 3,
        color: 'rgba(255, 69, 0, 0.4)',
        type: 'Total Destruction',
        description: 'Complete structural collapse',
      },
      {
        radius: craterDiameter * 6,
        color: 'rgba(255, 140, 0, 0.3)',
        type: 'Severe Damage',
        description: 'Major structural damage',
      },
      {
        radius: craterDiameter * 12,
        color: 'rgba(255, 215, 0, 0.2)',
        type: 'Moderate Damage',
        description: 'Broken windows, minor damage',
      },
      {
        radius: simulationResults.craterDiameter * 25,
        color: 'rgba(255, 255, 0, 0.1)',
        type: 'Light Damage',
        description: 'Possible minor injuries',
      },
    ];

    damageZones.forEach(zone => {
      const circle = new ol.geom.Circle(
        ol.proj.fromLonLat(impactCoords),
        zone.radius * 1000
      );

      const feature = new ol.Feature({
        geometry: circle,
        damageType: zone.type,
        description: zone.description,
        radius: zone.radius,
      });

      feature.setStyle(
        new ol.style.Style({
          fill: new ol.style.Fill({ color: zone.color }),
          stroke: new ol.style.Stroke({
            color: zone.color.replace(/0\.\d+/, '0.8'),
            width: 2,
          }),
        })
      );

      features.push(feature);
    });

    return new ol.layer.Vector({
      source: new ol.source.Vector({ features }),
      name: 'enhancedImpactZone',
    });
  };



  useEffect(() => {
    if (!mapRef.current || map || !olLoaded) {
      return;
    }

    const ol = getOpenLayers();
    if (!ol) return;

    // Create base layers
    const baseLayers = createBaseLayers();

    // Initialize OpenLayers map with NASA GIBS as default
    const newMap = new ol.Map({
      target: mapRef.current,
      layers: Object.values(baseLayers),
      view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]),
        zoom: 2,
        maxZoom: 18,
      }),
    });

    // Enhanced click interaction for multiple modes
    newMap.on('click', event => {
      const coordinate = event.coordinate;
      const lonLat = ol.proj.toLonLat(coordinate);
      
      const feature = newMap.forEachFeatureAtPixel(
        event.pixel,
        feature => feature
      );

      switch (mapInteractionMode) {
        case 'simulate':
          // Click-to-simulate: Set new impact location and trigger simulation
          setImpactLocation({
            latitude: lonLat[1],
            longitude: lonLat[0]
          });
          
          // Auto-trigger impact animation
          setTimeout(() => {
            triggerImpactAnimation();
          }, 500);
          
          // Zoom to impact location
          newMap.getView().animate({
            center: coordinate,
            zoom: Math.max(newMap.getView().getZoom(), 8),
            duration: 1000
          });
          break;
          
        case 'measure':
          // Measurement mode: Add measurement points
          if (!measurementData) {
            setMeasurementData({
              startPoint: coordinate,
              startLonLat: lonLat,
              endPoint: null,
              endLonLat: null,
              distance: 0
            });
          } else if (!measurementData.endPoint) {
            const distance = ol.sphere.getDistance(
              measurementData.startLonLat,
              lonLat
            );
            setMeasurementData({
              ...measurementData,
              endPoint: coordinate,
              endLonLat: lonLat,
              distance: distance
            });
          } else {
            // Reset measurement
            setMeasurementData({
              startPoint: coordinate,
              startLonLat: lonLat,
              endPoint: null,
              endLonLat: null,
              distance: 0
            });
          }
          break;
          
        case 'analyze':
          // Analysis mode: Show detailed information about clicked location
          if (feature) {
            setSelectedFeature(feature);
            // Get feature properties for analysis
            const properties = feature.getProperties();
            console.log('Feature analysis:', properties);
          } else {
            // Analyze location data
            console.log('Location analysis:', {
              coordinates: lonLat,
              elevation: 'Fetching...',
              population: 'Calculating...',
              infrastructure: 'Analyzing...'
            });
            setSelectedFeature(null);
          }
          break;
          
        default: // 'view' mode
          if (feature) {
            setSelectedFeature(feature);
          } else {
            setSelectedFeature(null);
          }
          break;
      }
    });

    // Store base layers reference
    newMap.set('baseLayers', baseLayers);
    setMap(newMap);

    // Cleanup function
    return () => {
      if (newMap) {
        newMap.setTarget(null);
      }
    };
  }, [olLoaded]); // Run when OpenLayers is loaded

  // Fetch real-time seismic data
  useEffect(() => {
    if (isConnected) {
      const updateSeismicData = () => {
        const cachedSeismic = getCachedData('seismic_data');
        if (cachedSeismic) {
          setSeismicData(cachedSeismic);
        }

        const cachedEvents = getCachedData('real_time_events');
        if (cachedEvents) {
          setRealTimeEvents(cachedEvents.events || []);
        }
      };

      // Initial fetch
      updateSeismicData();

      // Set up periodic updates
      const interval = setInterval(updateSeismicData, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, getCachedData]);

  // Integrate NASA asteroid data into real-time events
  useEffect(() => {
    if (nasaAsteroidData && nasaAsteroidData.length > 0) {
      const nasaEvents = nasaAsteroidData.map(asteroid => ({
        id: `nasa-${asteroid.id}`,
        type: 'nasa_asteroid',
        latitude: Math.random() * 180 - 90, // Random position for visualization
        longitude: Math.random() * 360 - 180,
        description: `${asteroid.name} - ${asteroid.diameter ? (asteroid.diameter / 1000).toFixed(2) + ' km' : 'Unknown size'}`,
        severity: asteroid.isPotentiallyHazardous ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        asteroidData: {
          name: asteroid.name,
          diameter: asteroid.diameter,
          velocity: asteroid.velocity,
          isPotentiallyHazardous: asteroid.isPotentiallyHazardous,
          approachDate: asteroid.approachDate,
          missDistance: asteroid.missDistance,
          orbitClass: asteroid.orbitClass
        }
      }));

      // Merge NASA events with existing real-time events
      setRealTimeEvents(prevEvents => {
        // Remove old NASA events
        const filteredEvents = prevEvents.filter(event => event.type !== 'nasa_asteroid');
        // Add new NASA events
        return [...filteredEvents, ...nasaEvents];
      });
    }
  }, [nasaAsteroidData]);

  // Update map when impact location changes
  useEffect(() => {
    if (!map || !impactLocation) {
      return;
    }

    // Clear previous markers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'impactMarker') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add impact marker
    if (impactLocation && impactLocation.latitude && impactLocation.longitude) {
      // Create impact point feature
      const impactFeature = new ol.Feature({
        geometry: new ol.geom.Point(
          ol.proj.fromLonLat([
            impactLocation.longitude,
            impactLocation.latitude,
          ])
        ),
      });

      // Enhanced style for impact marker with pulsing animation
      const impactStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 12,
          fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
          stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
        }),
        text: new ol.style.Text({
          text: '💥',
          font: '20px Arial',
          offsetY: -25,
        }),
      });

      impactFeature.setStyle(impactStyle);

      // Create vector layer for impact marker
      const impactLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [impactFeature],
        }),
        name: 'impactMarker',
      });

      // Add layer to map
      map.addLayer(impactLayer);

      // Center map on impact location
      map.getView().animate({
        center: ol.proj.fromLonLat([
          impactLocation.longitude,
          impactLocation.latitude,
        ]),
        zoom: 6,
        duration: 1500,
      });
    }
  }, [map, impactLocation]);

  // Update atmospheric effects overlay
  useEffect(() => {
    if (!map || !overlayLayers.atmosphericEffects) {
      return;
    }

    // Remove existing atmospheric layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'atmosphericEffects') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add atmospheric effects layer
    const atmosphericLayer = createAtmosphericEffectsLayer();
    if (atmosphericLayer) {
      map.addLayer(atmosphericLayer);
    }
  }, [
    map,
    overlayLayers.atmosphericEffects,
    impactLocation,
    simulationResults,
  ]);

  // Update enhanced impact zone
  useEffect(() => {
    if (!map || !overlayLayers.impactZone) {
      return;
    }

    // Remove existing impact zone layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'enhancedImpactZone') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add enhanced impact zone layer
    const impactZoneLayer = createEnhancedImpactZone();
    if (impactZoneLayer) {
      map.addLayer(impactZoneLayer);
    }
  }, [map, overlayLayers.impactZone, impactLocation, simulationResults]);

  // Update population density overlay
  useEffect(() => {
    if (!map || !overlayLayers.populationDensity) {
      return;
    }

    // Remove existing population layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'populationDensity') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add population density layer
    const populationLayer = createPopulationDensityLayer();
    if (populationLayer) {
      map.addLayer(populationLayer);
    }
  }, [map, overlayLayers.populationDensity]);

  // Update weather data overlay
  useEffect(() => {
    if (!map || !overlayLayers.weatherData) {
      return;
    }

    // Remove existing weather layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'weatherData') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add weather data layer
    const weatherLayer = createWeatherDataLayer();
    if (weatherLayer) {
      map.addLayer(weatherLayer);
    }
  }, [map, overlayLayers.weatherData]);

  useEffect(() => {
    if (!map || !seismicData || !overlayLayers.seismicData) {
      return;
    }

    // Remove existing seismic layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'seismicData') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add earthquake markers
    if (seismicData.earthquakes && seismicData.earthquakes.length > 0) {
      const earthquakeFeatures = seismicData.earthquakes.map(earthquake => {
        const feature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat([earthquake.longitude, earthquake.latitude])
          ),
          magnitude: earthquake.magnitude,
          location: earthquake.location,
          depth: earthquake.depth,
          time: earthquake.time,
          alertLevel: earthquake.alert_level,
        });

        // Style based on magnitude
        const magnitude = earthquake.magnitude || 0;
        let color = 'rgba(0, 255, 0, 0.7)'; // Green for small
        let radius = 4;

        if (magnitude >= 6.0) {
          color = 'rgba(255, 0, 0, 0.8)'; // Red for major
          radius = 12;
        } else if (magnitude >= 5.0) {
          color = 'rgba(255, 165, 0, 0.8)'; // Orange for moderate
          radius = 8;
        } else if (magnitude >= 3.0) {
          color = 'rgba(255, 255, 0, 0.7)'; // Yellow for minor
          radius = 6;
        }

        const style = new ol.style.Style({
          image: new ol.style.Circle({
            radius: radius,
            fill: new ol.style.Fill({ color: color }),
            stroke: new ol.style.Stroke({
              color: 'white',
              width: 1,
            }),
          }),
          text: new ol.style.Text({
            text: magnitude.toFixed(1),
            font: '10px Arial',
            fill: new ol.style.Fill({ color: 'white' }),
            stroke: new ol.style.Stroke({ color: 'black', width: 1 }),
          }),
        });

        feature.setStyle(style);
        return feature;
      });

      const seismicLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: earthquakeFeatures,
        }),
        name: 'seismicData',
      });

      map.addLayer(seismicLayer);
    }
  }, [map, seismicData, overlayLayers.seismicData]);

  // Update real-time events overlay
  useEffect(() => {
    if (!map || !realTimeEvents || !overlayLayers.realTimeEvents) {
      return;
    }

    // Remove existing event layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'realTimeEvents') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add event markers
    if (realTimeEvents.length > 0) {
      const eventFeatures = realTimeEvents
        .filter(event => event.latitude && event.longitude)
        .map(event => {
          const feature = new ol.Feature({
            geometry: new ol.geom.Point(
              ol.proj.fromLonLat([event.longitude, event.latitude])
            ),
            eventType: event.type,
            description: event.description,
            severity: event.severity,
            timestamp: event.timestamp,
          });

          // Style based on event type
          let color = 'rgba(0, 150, 255, 0.7)'; // Blue default
          let symbol = '●';

          switch (event.type) {
            case 'space_weather':
              color = 'rgba(255, 100, 255, 0.8)';
              symbol = '☀';
              break;
            case 'satellite_alert':
              color = 'rgba(255, 200, 0, 0.8)';
              symbol = '🛰';
              break;
            case 'atmospheric':
              color = 'rgba(100, 255, 100, 0.8)';
              symbol = '🌪';
              break;
            case 'nasa_asteroid':
              color = event.severity === 'high' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(100, 150, 255, 0.8)';
              symbol = event.asteroidData?.isPotentiallyHazardous ? '☄️' : '🌑';
              break;
            default:
              symbol = '●';
          }

          const style = new ol.style.Style({
            text: new ol.style.Text({
              text: symbol,
              font: '16px Arial',
              fill: new ol.style.Fill({ color: color }),
              stroke: new ol.style.Stroke({ color: 'white', width: 1 }),
            }),
          });

          feature.setStyle(style);
          return feature;
        });

      if (eventFeatures.length > 0) {
        const eventsLayer = new ol.layer.Vector({
          source: new ol.source.Vector({
            features: eventFeatures,
          }),
          name: 'realTimeEvents',
        });

        map.addLayer(eventsLayer);
      }
    }
  }, [map, realTimeEvents, overlayLayers.realTimeEvents]);

  // Enhanced thermal effects management
  useEffect(() => {
    if (!map || !overlayLayers.thermalEffects) {
      return;
    }

    // Remove existing thermal layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'thermalEffects') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add thermal effects layer
    const thermalLayer = createThermalEffectsLayer();
    if (thermalLayer) {
      map.addLayer(thermalLayer);
    }
  }, [map, overlayLayers.thermalEffects, impactLocation, simulationResults]);

  // Enhanced debris field management
  useEffect(() => {
    if (!map || !overlayLayers.debrisField) {
      return;
    }

    // Remove existing debris layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'debrisField') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add debris field layer
    const debrisLayer = createDebrisFieldLayer();
    if (debrisLayer) {
      map.addLayer(debrisLayer);
    }
  }, [map, overlayLayers.debrisField, impactLocation, simulationResults]);

  // Enhanced energy visualization management
  useEffect(() => {
    if (!map || !overlayLayers.energyVisualization) {
      return;
    }

    // Remove existing energy layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'energyVisualization') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add energy visualization layer
    const energyLayer = createEnergyVisualizationLayer();
    if (energyLayer) {
      map.addLayer(energyLayer);
    }
  }, [map, overlayLayers.energyVisualization, impactLocation, simulationResults]);

  // Particle system initialization and management
  useEffect(() => {
    initializeParticleSystem();
  }, [initializeParticleSystem]);

  // Animation timeline management
  useEffect(() => {
    if (isAnimating && particleSystem) {
      const interval = setInterval(() => {
        setTimelinePosition(prev => {
          const newPos = prev + animationSpeed;
          return newPos > 100 ? 0 : newPos;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isAnimating, particleSystem, animationSpeed]);

  // Population density overlay management
  useEffect(() => {
    if (!map || !overlayLayers.populationDensity) {
      return;
    }

    // Remove existing population layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'populationDensity') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add population density layer
    const populationLayer = createPopulationDensityLayer();
    if (populationLayer) {
      map.addLayer(populationLayer);
    }
  }, [map, overlayLayers.populationDensity, impactLocation]);

  // Infrastructure overlay management
  useEffect(() => {
    if (!map || !overlayLayers.infrastructureData) {
      return;
    }

    // Remove existing infrastructure layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'infrastructureData') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add infrastructure layer
    const infrastructureLayer = createInfrastructureLayer();
    if (infrastructureLayer) {
      map.addLayer(infrastructureLayer);
    }
  }, [map, overlayLayers.infrastructureData, impactLocation]);

  // Weather data overlay management
  useEffect(() => {
    if (!map || !overlayLayers.weatherData) {
      return;
    }

    // Remove existing weather layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'weatherData') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add weather data layer
    const weatherLayer = createWeatherDataLayer();
    if (weatherLayer) {
      map.addLayer(weatherLayer);
    }
  }, [map, overlayLayers.weatherData, impactLocation]);

  // Measurement layer management
  useEffect(() => {
    if (!map) {
      return;
    }

    // Remove existing measurement layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'measurementLayer') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add measurement layer if in measurement mode and data exists
    if (mapInteractionMode === 'measure' && measurementData) {
      const measurementLayer = createMeasurementLayer();
      if (measurementLayer) {
        map.addLayer(measurementLayer);
      }
    }
  }, [map, mapInteractionMode, measurementData]);

  // Crater animation layer management
  useEffect(() => {
    if (!map || !overlayLayers.craterAnimation || !isAnimating) {
      return;
    }

    // Remove existing crater animation layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'craterAnimation') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add crater animation layer
    const craterLayer = createCraterAnimationLayer();
    if (craterLayer) {
      map.addLayer(craterLayer);
    }
  }, [map, overlayLayers.craterAnimation, isAnimating, craterRadius, impactLocation]);

  // Shockwave animation layer management
  useEffect(() => {
    if (!map || !overlayLayers.shockwaveAnimationLayer || !isAnimating) {
      return;
    }

    // Remove existing shockwave animation layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'shockwaveAnimation') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add shockwave animation layer
    const shockwaveLayer = createShockwaveAnimationLayer();
    if (shockwaveLayer) {
      map.addLayer(shockwaveLayer);
    }
  }, [map, overlayLayers.shockwaveAnimationLayer, isAnimating, shockwaveRadius, seismicWaves, impactLocation]);

  // Thermal effects animation layer management
  useEffect(() => {
    if (!map || !overlayLayers.thermalEffectsAnimation || !isAnimating) {
      return;
    }

    // Remove existing thermal effects animation layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'thermalEffects') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add thermal effects animation layer
    const thermalLayer = createThermalEffectsLayer();
    if (thermalLayer) {
      map.addLayer(thermalLayer);
    }
  }, [map, overlayLayers.thermalEffectsAnimation, isAnimating, thermalEffects, impactLocation]);

  // Debris field animation layer management
  useEffect(() => {
    if (!map || !overlayLayers.debrisFieldAnimation || !isAnimating) {
      return;
    }

    // Remove existing debris field animation layers
    const layers = map.getLayers();
    const layersToRemove = [];
    layers.forEach(layer => {
      if (layer.get('name') === 'debrisField') {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Add debris field animation layer
    const debrisLayer = createDebrisFieldLayer();
    if (debrisLayer) {
      map.addLayer(debrisLayer);
    }
  }, [map, overlayLayers.debrisFieldAnimation, isAnimating, debrisField, impactLocation]);

  // Change map mode
  const changeMapMode = mode => {
    setMapMode(mode);
    if (!map) {
      return;
    }

    const baseLayers = map.get('baseLayers');
    if (baseLayers) {
      // Update visibility of all base layers
      Object.keys(baseLayers).forEach(key => {
        const layer = baseLayers[key];
        layer.setVisible(key === mode);
      });
    }
  };

  const toggleOverlay = overlayName => {
    setOverlayLayers(prev => ({
      ...prev,
      [overlayName]: !prev[overlayName],
    }));
  };

  const calculateImpactPrediction = () => {
    if (!impactLocation || !seismicData) {
      return null;
    }

    // Simple impact prediction based on nearby seismic activity
    const nearbyEarthquakes =
      seismicData.earthquakes?.filter(eq => {
        const distance = Math.sqrt(
          Math.pow(eq.latitude - impactLocation.latitude, 2) +
            Math.pow(eq.longitude - impactLocation.longitude, 2)
        );
        return distance < 5; // Within 5 degrees
      }) || [];

    const avgMagnitude =
      nearbyEarthquakes.length > 0
        ? nearbyEarthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) /
          nearbyEarthquakes.length
        : 0;

    return {
      nearbySeismicActivity: nearbyEarthquakes.length,
      averageMagnitude: avgMagnitude,
      riskLevel:
        avgMagnitude > 5 ? 'High' : avgMagnitude > 3 ? 'Moderate' : 'Low',
    };
  };

  const formatImpactEnergy = energy => {
    if (energy < 1e12) {
      return `${(energy / 1e9).toFixed(2)} kilotons TNT`;
    } else if (energy < 1e15) {
      return `${(energy / 1e12).toFixed(2)} megatons TNT`;
    }
    return `${(energy / 1e15).toFixed(2)} gigatons TNT`;
  };

  // Dynamic zoom functionality
  const performDynamicZoom = (zoomType = 'impact') => {
    if (!map || !impactLocation) return;

    const ol = getOpenLayers();
    if (!ol) return;

    const view = map.getView();
    const centerCoord = ol.proj.fromLonLat([impactLocation.longitude, impactLocation.latitude]);

    switch (zoomType) {
      case 'impact':
        // Zoom to impact location with appropriate scale based on simulation results
        const impactZoom = simulationResults?.craterDiameter 
          ? Math.max(8, 15 - Math.log10(simulationResults.craterDiameter / 1000))
          : 10;
        
        view.animate({
          center: centerCoord,
          zoom: impactZoom,
          duration: 1500,
          easing: ol.easing.easeInOut
        });
        break;

      case 'regional':
        // Zoom out to show regional effects
        view.animate({
          center: centerCoord,
          zoom: 6,
          duration: 1500,
          easing: ol.easing.easeInOut
        });
        break;

      case 'global':
        // Global view to show worldwide effects
        view.animate({
          center: centerCoord,
          zoom: 3,
          duration: 2000,
          easing: ol.easing.easeInOut
        });
        break;

      case 'measurement':
        // Zoom to fit measurement area
        if (measurementData && measurementData.startPoint && measurementData.endPoint) {
          const extent = ol.extent.boundingExtent([
            measurementData.startPoint,
            measurementData.endPoint
          ]);
          
          // Add padding around the measurement
          const padding = ol.extent.getWidth(extent) * 0.2;
          const paddedExtent = ol.extent.buffer(extent, padding);
          
          view.fit(paddedExtent, {
            duration: 1000,
            maxZoom: 12
          });
        }
        break;

      case 'auto':
        // Intelligent auto-zoom based on current context
        if (mapInteractionMode === 'measure' && measurementData?.endPoint) {
          performDynamicZoom('measurement');
        } else if (simulationResults) {
          performDynamicZoom('impact');
        } else {
          performDynamicZoom('regional');
        }
        break;

      default:
        // Default zoom to impact location
        view.animate({
          center: centerCoord,
          zoom: 8,
          duration: 1000
        });
    }
  };

  // Auto-zoom when impact location changes
  useEffect(() => {
    if (impactLocation && map) {
      // Delay to allow layers to load
      setTimeout(() => {
        performDynamicZoom('auto');
      }, 300);
    }
  }, [impactLocation, map]);

  // Data integration setup
  useEffect(() => {
    const componentId = 'impactMap2D';

    // Define data types needed for this component
    const dataTypes = [
      {
        type: 'elevation',
        params: {
          bounds: impactLocation
            ? {
                north: impactLocation.latitude + 2,
                south: impactLocation.latitude - 2,
                east: impactLocation.longitude + 2,
                west: impactLocation.longitude - 2,
              }
            : { north: 45, south: 35, east: -110, west: -120 },
        },
      },
      {
        type: 'spaceWeather',
        params: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      },
      {
        type: 'neoData',
        params: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        },
      },
    ];

    // Data update callback
    const handleDataUpdate = data => {
      setDataLoading(false);
      setDownloadedData(data);

      // Process elevation data for enhanced terrain visualization
      if (data.elevation && map) {
        const transformedElevation =
          visualizationDataIntegration.transformElevationDataForImpactMap(
            data.elevation,
            dataTypes[0].params.bounds
          );

        if (transformedElevation) {
          // Create elevation contour layer
          const elevationFeatures = [];
          // Add elevation visualization logic here

          const newElevationLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: elevationFeatures }),
            name: 'elevationData',
            opacity: 0.6,
          });

          // Remove existing elevation layer
          if (elevationLayer) {
            map.removeLayer(elevationLayer);
          }

          map.addLayer(newElevationLayer);
          setElevationLayer(newElevationLayer);
        }
      }

      // Process space weather data for atmospheric effects
      if (data.spaceWeather && map) {
        const transformedSpaceWeather =
          visualizationDataIntegration.transformSpaceWeatherDataForViz(
            data.spaceWeather
          );

        if (transformedSpaceWeather) {
          // Create space weather effects layer
          const spaceWeatherFeatures = [];

          // Add solar flare effects
          transformedSpaceWeather.solarFlares.forEach(flare => {
            if (flare.intensity > 1000) {
              // Only show significant flares
              const feature = new ol.Feature({
                geometry: new ol.geom.Point([0, 0]), // Global effect
                flareClass: flare.classType,
                intensity: flare.intensity,
                time: flare.peakTime,
              });

              const style = new ol.style.Style({
                image: new ol.style.Circle({
                  radius: Math.log10(flare.intensity) * 2,
                  fill: new ol.style.Fill({ color: 'rgba(255, 100, 0, 0.4)' }),
                  stroke: new ol.style.Stroke({ color: 'orange', width: 2 }),
                }),
              });

              feature.setStyle(style);
              spaceWeatherFeatures.push(feature);
            }
          });

          const newSpaceWeatherLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: spaceWeatherFeatures }),
            name: 'spaceWeatherData',
            opacity: 0.7,
          });

          // Remove existing space weather layer
          if (spaceWeatherLayer) {
            map.removeLayer(spaceWeatherLayer);
          }

          map.addLayer(newSpaceWeatherLayer);
          setSpaceWeatherLayer(newSpaceWeatherLayer);
        }
      }
    };

    // Subscribe to data updates
    setDataLoading(true);
    visualizationDataIntegration.subscribeToData(
      componentId,
      dataTypes,
      handleDataUpdate
    );

    // Set up auto-refresh every 5 minutes
    visualizationDataIntegration.setupAutoRefresh(componentId, 300000);

    // Cleanup on unmount
    return () => {
      visualizationDataIntegration.unsubscribeFromData(componentId);
    };
  }, [map, impactLocation, elevationLayer, spaceWeatherLayer]);

  // Show loading state while OpenLayers is loading
  if (!olLoaded) {
    return (
      <div className='impact-map-container' ref={loadingRef}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '24px',
          margin: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 2s infinite' }}>🗺️</div>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>Loading Impact Map</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Initializing map visualization...</p>
            <div style={{
              width: '200px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              margin: '16px auto',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '2px',
                animation: 'loading 2s infinite'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='impact-map-container' ref={mapContainerRef}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '24px',
        margin: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div className='impact-map-header'>
          <h2 className='impact-map-title'>Impact Visualization</h2>
          <div className='connection-status'>
            <div
              className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            />
            <span className='status-text'>
              {isConnected ? 'Live Data' : 'Offline'}
            </span>
          </div>
        </div>

        <div className='map-controls-section'>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 className='controls-title'>Base Layer</h4>
            <div className='control-buttons'>
              <button
                onClick={() => changeMapMode('nasa_satellite')}
                title='Switch to NASA satellite imagery base layer'
                style={{
                  background: mapMode === 'nasa_satellite' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'nasa_satellite') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'nasa_satellite') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                NASA Satellite
              </button>
              <button
                onClick={() => changeMapMode('nasa_blue_marble')}
                title='Switch to NASA Blue Marble Earth imagery'
                style={{
                  background: mapMode === 'nasa_blue_marble' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'nasa_blue_marble') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'nasa_blue_marble') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Blue Marble
              </button>
              <button
                onClick={() => changeMapMode('usgs_terrain')}
                title='Switch to USGS terrain and topographic map'
                style={{
                  background: mapMode === 'usgs_terrain' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'usgs_terrain') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'usgs_terrain') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                USGS Terrain
              </button>
              <button
                onClick={() => changeMapMode('standard')}
                title='Switch to standard OpenStreetMap base layer'
                style={{
                  background: mapMode === 'standard' 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (mapMode === 'standard') {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (mapMode === 'standard') {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Standard
              </button>
            </div>
          </div>

          <div 
            className='overlay-controls'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}
          >
            <h4 className='controls-title'>Data Overlays</h4>
            <div className='control-buttons'>
              <button
                onClick={() => toggleOverlay('seismicData')}
                title='Toggle real-time seismic data'
                style={{
                  background: overlayLayers.seismicData 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.seismicData) {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.seismicData) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🌍 Seismic Data
              </button>
              <button
                onClick={() => toggleOverlay('realTimeEvents')}
                title='Toggle real-time events'
                style={{
                  background: overlayLayers.realTimeEvents 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.realTimeEvents) {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.realTimeEvents) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ⚡ Live Events
              </button>
              <button
                onClick={() => toggleOverlay('impactZone')}
                title='Toggle impact zone'
                style={{
                  background: overlayLayers.impactZone 
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.impactZone) {
                    e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.impactZone) {
                    e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🎯 Impact Zone
              </button>
              <button
                onClick={() => toggleOverlay('thermalEffects')}
                title='Toggle thermal effects visualization'
                style={{
                  background: overlayLayers.thermalEffects 
                    ? 'linear-gradient(135deg, #ef4444, #f97316)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.thermalEffects) {
                    e.target.style.background = 'linear-gradient(135deg, #dc2626, #ea580c)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.thermalEffects) {
                    e.target.style.background = 'linear-gradient(135deg, #ef4444, #f97316)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🔥 Thermal Effects
              </button>
              <button
                onClick={() => toggleOverlay('debrisField')}
                title='Toggle debris field visualization'
                style={{
                  background: overlayLayers.debrisField 
                    ? 'linear-gradient(135deg, #8b5a2b, #a16207)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.debrisField) {
                    e.target.style.background = 'linear-gradient(135deg, #78350f, #92400e)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.debrisField) {
                    e.target.style.background = 'linear-gradient(135deg, #8b5a2b, #a16207)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🪨 Debris Field
              </button>
              <button
                onClick={() => toggleOverlay('energyVisualization')}
                title='Toggle energy heatmap visualization'
                style={{
                  background: overlayLayers.energyVisualization 
                    ? 'linear-gradient(135deg, #7c3aed, #c026d3)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.energyVisualization) {
                    e.target.style.background = 'linear-gradient(135deg, #6d28d9, #a21caf)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.energyVisualization) {
                    e.target.style.background = 'linear-gradient(135deg, #7c3aed, #c026d3)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ⚡ Energy Heatmap
              </button>
              <button
                onClick={() => toggleOverlay('populationDensity')}
                title='Toggle population density visualization'
                style={{
                  background: overlayLayers.populationDensity 
                    ? 'linear-gradient(135deg, #059669, #10b981)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.populationDensity) {
                    e.target.style.background = 'linear-gradient(135deg, #047857, #0d9488)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.populationDensity) {
                    e.target.style.background = 'linear-gradient(135deg, #059669, #10b981)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                👥 Population
              </button>
              <button
                onClick={() => toggleOverlay('infrastructureData')}
                title='Toggle infrastructure visualization'
                style={{
                  background: overlayLayers.infrastructureData 
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.infrastructureData) {
                    e.target.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.infrastructureData) {
                    e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🏢 Infrastructure
              </button>
              <button
                onClick={() => toggleOverlay('weatherData')}
                title='Toggle weather data visualization'
                style={{
                  background: overlayLayers.weatherData 
                    ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.weatherData) {
                    e.target.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.weatherData) {
                    e.target.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🌤️ Weather
              </button>
            </div>
          </div>

          {/* Animation Layers Controls */}
          <div 
            className='animation-layers-controls'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}
          >
            <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }}>
              🎬 Animation Layers
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => toggleOverlay('craterAnimation')}
                title='Toggle crater formation animation'
                style={{
                  background: overlayLayers.craterAnimation 
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.craterAnimation) {
                    e.target.style.background = 'linear-gradient(135deg, #b91c1c, #991b1b)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.craterAnimation) {
                    e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🕳️ Crater
              </button>
              <button
                onClick={() => toggleOverlay('shockwaveAnimationLayer')}
                title='Toggle shockwave propagation animation'
                style={{
                  background: overlayLayers.shockwaveAnimationLayer 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.shockwaveAnimationLayer) {
                    e.target.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.shockwaveAnimationLayer) {
                    e.target.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                💥 Shockwave
              </button>
              <button
                onClick={() => toggleOverlay('thermalEffectsAnimation')}
                title='Toggle thermal effects animation'
                style={{
                  background: overlayLayers.thermalEffectsAnimation 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.thermalEffectsAnimation) {
                    e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.thermalEffectsAnimation) {
                    e.target.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🔥 Thermal
              </button>
              <button
                onClick={() => toggleOverlay('debrisFieldAnimation')}
                title='Toggle debris field animation'
                style={{
                  background: overlayLayers.debrisFieldAnimation 
                    ? 'linear-gradient(135deg, #92400e, #78350f)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (overlayLayers.debrisFieldAnimation) {
                    e.target.style.background = 'linear-gradient(135deg, #78350f, #451a03)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (overlayLayers.debrisFieldAnimation) {
                    e.target.style.background = 'linear-gradient(135deg, #92400e, #78350f)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🪨 Debris
              </button>
            </div>
          </div>

          <div 
            className='animation-controls'
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}
          >
            <h4 className='controls-title'>Animation Controls</h4>
            <div className='control-buttons'>
              <button
                onClick={() => setShowAdvancedEffects(!showAdvancedEffects)}
                title='Toggle advanced visual effects'
                style={{
                  background: showAdvancedEffects 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (showAdvancedEffects) {
                    e.target.style.background = 'linear-gradient(135deg, #047857, #065f46)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (showAdvancedEffects) {
                    e.target.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                  } else {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ✨ Advanced Effects
              </button>
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                title={isAnimating ? 'Pause animation' : 'Start animation'}
                style={{
                  background: isAnimating 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  if (isAnimating) {
                    e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                  } else {
                    e.target.style.background = 'linear-gradient(135deg, #047857, #065f46)';
                  }
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (isAnimating) {
                    e.target.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                  } else {
                    e.target.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                  }
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {isAnimating ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <button
                onClick={() => startTimeBasedAnimation()}
                title='Start time-based impact progression animation'
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '4px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🎬 Start Timeline
              </button>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Animation Speed: {animationSpeed}x
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Timeline Position: {Math.round(timelinePosition * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={timelinePosition}
                onChange={(e) => setTimelinePosition(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        </div>

        {/* Interactive Features Controls */}
        <div 
          className='interactive-controls'
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px'
          }}
        >
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
            🎯 Interactive Features
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Interaction Mode:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['view', 'simulate', 'measure', 'analyze'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapInteractionMode(mode)}
                  style={{
                    background: mapInteractionMode === mode 
                      ? 'linear-gradient(135deg, #10b981, #059669)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'capitalize'
                  }}
                  onMouseEnter={(e) => {
                    if (mapInteractionMode !== mode) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mapInteractionMode !== mode) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {mode === 'view' && '👁️'} 
                  {mode === 'simulate' && '💥'} 
                  {mode === 'measure' && '📏'} 
                  {mode === 'analyze' && '🔍'} 
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => performDynamicZoom('impact')}
              disabled={!impactLocation}
              title='Zoom to impact location'
              style={{
                background: impactLocation 
                  ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                  : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: impactLocation ? 'white' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: impactLocation ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (impactLocation) {
                  e.target.style.background = 'linear-gradient(135deg, #1d4ed8, #1e40af)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (impactLocation) {
                  e.target.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              🎯 Zoom to Impact
            </button>

            <button
              onClick={() => performDynamicZoom('regional')}
              title='Show regional view'
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🌍 Regional View
            </button>

            <button
              onClick={() => performDynamicZoom('global')}
              title='Show global view'
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #0891b2, #0e7490)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #06b6d4, #0891b2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🌐 Global View
            </button>

            {measurementData && (
              <button
                onClick={() => {
                  setMeasurementData(null);
                  setMapInteractionMode('view');
                }}
                title='Clear measurements'
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🗑️ Clear Measurements
              </button>
            )}
          </div>

          {mapInteractionMode === 'simulate' && (
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>
                💡 <strong>Simulate Mode:</strong> Click anywhere on the map to set impact location and trigger simulation
              </p>
            </div>
          )}

          {mapInteractionMode === 'measure' && (
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>
                📏 <strong>Measure Mode:</strong> Click two points on the map to measure distance
                {measurementData && (
                  <span style={{ display: 'block', marginTop: '4px', fontWeight: '600' }}>
                    Distance: {measurementData.distance.toFixed(2)} km
                  </span>
                )}
              </p>
            </div>
          )}

          {mapInteractionMode === 'analyze' && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px'
            }}>
              <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>
                🔍 <strong>Analyze Mode:</strong> Click on features or locations to view detailed information
              </p>
            </div>
          )}
        </div>

        <div 
          className='map-container'
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            position: 'relative'
          }}
        >
          <div
            ref={mapRef}
            className='impact-map'
            style={{ width: '100%', height: '500px', borderRadius: '12px' }}
          />
          <canvas
            ref={particleCanvasRef}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: 'calc(100% - 40px)',
              height: '460px',
              borderRadius: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              opacity: showAdvancedEffects ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
          {loading && (
            <div className='glass-loading-overlay'>
              <div className='glass-spinner' />
              <div className='glass-loading-text'>Calculating Impact...</div>
            </div>
          )}
          {!loading && !impactLocation && !simulationResults && (
            <div 
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                bottom: '20px',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                padding: '40px',
                borderRadius: '12px'
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.6 }}>🗺️</div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: 'white' }}>
                No Impact Data Available
              </h3>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px', maxWidth: '400px' }}>
                Run a simulation to visualize impact zones, crater formation, and environmental effects on the interactive map.
              </p>
              <button
                onClick={() => window.location.href = '/simulation'}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                Run Simulation
              </button>
            </div>
          )}
        </div>

        {simulationResults && (
          <div className='impact-details-grid'>
            <div 
              className='impact-analysis-card'
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
              }}
            >
              <h3 className='card-title'>Impact Analysis</h3>
              <div className='stats-grid'>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {formatImpactEnergy(simulationResults.energy)}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Impact Energy</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕳️</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {`${simulationResults.craterDiameter.toFixed(2)} km`}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Crater Diameter</div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                    {`${Math.abs(impactLocation.latitude).toFixed(2)}°${impactLocation.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(impactLocation.longitude).toFixed(2)}°${impactLocation.longitude >= 0 ? 'E' : 'W'}`}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Impact Location</div>
                </div>
              </div>
            </div>

            {seismicData && (
              <div 
                className='seismic-data-card'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}
              >
                <h3 className='card-title'>Real-time Seismic Activity</h3>
                <div className='stats-grid'>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌍</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                      {seismicData.global_activity_level?.toUpperCase() || 'UNKNOWN'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Global Activity Level</div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                      {`${seismicData.total_events || 0} events`}
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Recent Earthquakes</div>
                  </div>
                  {seismicData.earthquakes &&
                    seismicData.earthquakes.length > 0 && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                          {`M${Math.max(...seismicData.earthquakes.map(eq => eq.magnitude || 0)).toFixed(1)}`}
                        </div>
                        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Largest Recent</div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {calculateImpactPrediction() && (
              <div 
                className='risk-assessment-card'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}
              >
                <h3 className='card-title'>Impact Risk Assessment</h3>
                <div className='stats-grid'>
                  {(() => {
                    const prediction = calculateImpactPrediction();
                    return (
                      <>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            {prediction.riskLevel}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Geological Risk Level</div>
                        </div>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            {`${prediction.nearbySeismicActivity} events`}
                          </div>
                          <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Nearby Seismic Activity</div>
                        </div>
                        {prediction.averageMagnitude > 0 && (
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                              {`M${prediction.averageMagnitude.toFixed(1)}`}
                            </div>
                            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Average Local Magnitude</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {realTimeEvents && realTimeEvents.length > 0 && (
              <div 
                className='real-time-events-card'
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px'
                }}
              >
                <h3 className='card-title'>Real-time Events</h3>
                <div className='events-list'>
                  {realTimeEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className='glass-event-item'>
                      <span className='event-type'>{event.type}</span>
                      <span className='event-description'>
                        {event.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap component with error boundary
const ImpactMap2DWithErrorBoundary = () => (
  <ImpactMapErrorBoundary>
    <ImpactMap2D />
  </ImpactMapErrorBoundary>
);

export default ImpactMap2DWithErrorBoundary;
