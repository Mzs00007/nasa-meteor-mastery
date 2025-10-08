import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Context
import { useSimulation } from '../context/SimulationContext';

// Enhanced Components
import LocationSelector from './LocationSelector';
import CesiumEarthMap from './impact-map/CesiumEarthMap';
import EnhancedPhysicsEngine from './impact-map/EnhancedPhysicsEngine';
import DataAnalysisPanel from './impact-map/DataAnalysisPanel';
import InteractiveControlPanel from './impact-map/InteractiveControlPanel';
import RealTimeDataFeed from './impact-map/RealTimeDataFeed';
import ImpactVisualizationDashboard from './impact-map/ImpactVisualizationDashboard';
import ExportShareManager from './impact-map/ExportShareManager';

// UI Components
import {
  CleanCard,
  CleanButton,
  CleanSection,
} from './ui/cleanmoderncomponents';
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';

// Styles
import '../styles/clean-theme.css';
import './ui/CleanModernComponents.css';
import '../styles/glassmorphic.css';
import '../styles/impact-map-enhanced.css';

const ImpactMapPage = () => {
  // Universal Location Context
  const { impactLocation, setImpactLocation } = useSimulation();

  // Enhanced State Management
  const [meteorParams, setMeteorParams] = useState({
    diameter: 100, // meters
    velocity: 20000, // m/s
    angle: 45, // degrees
    density: 3000, // kg/m³
    composition: 'stone', // stone, iron, stony-iron, carbonaceous
    latitude: 40.7128,
    longitude: -74.006,
    altitude: 100000, // meters above surface
    fragmentationModel: 'progressive',
    atmosphericEntry: {
      angle: 45,
      velocity: 20000,
      mass: 0,
      dragCoefficient: 0.47
    }
  });

  const [simulationState, setSimulationState] = useState({
    isRunning: false,
    isComplete: false,
    currentTime: 0,
    totalTime: 15, // seconds
    phase: 'setup', // setup, approach, entry, impact, explosion, aftermath
    progress: 0,
    realTimeData: true,
    dataQuality: 'high'
  });

  const [impactResults, setImpactResults] = useState({
    // Basic Impact Data
    energy: 0, // Joules
    tntEquivalent: 0, // Megatons
    craterDiameter: 0, // meters
    craterDepth: 0, // meters
    blastRadius: {
      lethal: 0,
      severe: 0,
      moderate: 0,
      light: 0
    },
    
    // Advanced Physics
    seismicMagnitude: 0,
    shockwaveSpeed: 0, // m/s
    temperature: 0, // Kelvin
    pressure: 0, // Pa
    
    // Environmental Effects
    atmosphericEffects: {
      dustCloud: { radius: 0, duration: 0 },
      climateImpact: { temperature: 0, duration: 0 },
      ozoneDepletion: 0
    },
    
    // Casualties and Damage
    casualties: {
      immediate: 0,
      shortTerm: 0,
      longTerm: 0,
      total: 0
    },
    
    // Economic Impact
    economicDamage: {
      direct: 0,
      indirect: 0,
      total: 0
    },
    
    // Debris and Secondary Effects
    debrisField: [],
    secondaryImpacts: [],
    tsunamiRisk: false,
    
    // Data Analysis
    confidence: 0.95,
    uncertaintyRange: { min: 0, max: 0 },
    historicalComparison: null
  });

  const [mapSettings, setMapSettings] = useState({
    viewMode: '3d', // 3d, satellite, terrain, hybrid
    showTrajectory: true,
    showBlastRadius: true,
    showSeismicRings: true,
    showHeatMap: true,
    showPopulationDensity: true,
    showTectonicPlates: false,
    showInfrastructure: true,
    timeOfDay: 'current',
    weatherConditions: 'clear',
    dataLayers: {
      population: true,
      infrastructure: true,
      geological: false,
      environmental: true
    }
  });

  const [dataAnalysis, setDataAnalysis] = useState({
    historicalEvents: [],
    statisticalAnalysis: null,
    riskAssessment: null,
    uncertaintyAnalysis: null,
    sensitivityAnalysis: null
  });

  const [nasaData, setNasaData] = useState({
    nearEarthObjects: [],
    lastUpdate: null,
    isLoading: false,
    error: null
  });

  const [activePanel, setActivePanel] = useState('controls'); // controls, analysis, visualization, data
  const [simulationHistory, setSimulationHistory] = useState([]);

  // Sync universal location with local meteorParams
  useEffect(() => {
    if (impactLocation?.latitude && impactLocation?.longitude) {
      setMeteorParams(prev => ({
        ...prev,
        latitude: impactLocation.latitude,
        longitude: impactLocation.longitude
      }));
    }
  }, [impactLocation]);

  // Update universal location when meteorParams location changes
  const handleLocationChange = useCallback((lat, lng) => {
    setMeteorParams(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    setImpactLocation({ latitude: lat, longitude: lng });
  }, [setImpactLocation]);

  // Refs for component communication
  const cesiumMapRef = useRef(null);
  const physicsEngineRef = useRef(null);
  const dataAnalysisRef = useRef(null);

  // Enhanced simulation control
  const handleRunSimulation = useCallback(async () => {
    if (!physicsEngineRef.current || !cesiumMapRef.current) {
      console.error('Required components not initialized');
      return;
    }

    setSimulationState(prev => ({
      ...prev,
      isRunning: true,
      isComplete: false,
      currentTime: 0,
      phase: 'approach',
      progress: 0
    }));

    try {
      // Enhanced physics calculation with real-time updates
      const results = await physicsEngineRef.current.calculateEnhancedImpact(
        meteorParams,
        (progress, phase) => {
          setSimulationState(prev => ({
            ...prev,
            progress,
            phase,
            currentTime: (progress / 100) * prev.totalTime
          }));
        }
      );

      setImpactResults(results);

      // Perform data analysis
      if (dataAnalysisRef.current) {
        const analysis = await dataAnalysisRef.current.analyzeResults(results, meteorParams);
        setDataAnalysis(analysis);
      }

      // Add to simulation history with enhanced metadata
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        meteorParams: { ...meteorParams },
        results: { ...results },
        mapSettings: { ...mapSettings },
        dataQuality: simulationState.dataQuality,
        confidence: results.confidence,
        tags: generateSimulationTags(meteorParams, results)
      };

      setSimulationHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 simulations

      // Animate on map with enhanced visualization
      await cesiumMapRef.current.animateEnhancedImpact(meteorParams, results);

      setSimulationState(prev => ({
        ...prev,
        isRunning: false,
        isComplete: true,
        phase: 'aftermath',
        progress: 100
      }));

    } catch (error) {
      console.error('Enhanced simulation error:', error);
      setSimulationState(prev => ({ 
        ...prev, 
        isRunning: false,
        phase: 'error'
      }));
    }
  }, [meteorParams, mapSettings, simulationState.dataQuality]);

  // Generate simulation tags for categorization
  const generateSimulationTags = (params, results) => {
    const tags = [];
    
    // Size category
    if (params.diameter < 50) tags.push('small');
    else if (params.diameter < 200) tags.push('medium');
    else if (params.diameter < 1000) tags.push('large');
    else tags.push('catastrophic');
    
    // Impact severity
    if (results.tntEquivalent < 1) tags.push('minor');
    else if (results.tntEquivalent < 100) tags.push('moderate');
    else if (results.tntEquivalent < 10000) tags.push('severe');
    else tags.push('extinction-level');
    
    // Composition
    tags.push(params.composition);
    
    // Location type
    if (Math.abs(params.latitude) > 60) tags.push('polar');
    else if (Math.abs(params.latitude) < 30) tags.push('tropical');
    else tags.push('temperate');
    
    return tags;
  };

  const handleResetSimulation = useCallback(() => {
    setSimulationState({
      isRunning: false,
      isComplete: false,
      currentTime: 0,
      totalTime: 15,
      phase: 'setup',
      progress: 0,
      realTimeData: true,
      dataQuality: 'high'
    });
    
    setImpactResults({
      energy: 0,
      tntEquivalent: 0,
      craterDiameter: 0,
      craterDepth: 0,
      blastRadius: { lethal: 0, severe: 0, moderate: 0, light: 0 },
      seismicMagnitude: 0,
      shockwaveSpeed: 0,
      temperature: 0,
      pressure: 0,
      atmosphericEffects: {
        dustCloud: { radius: 0, duration: 0 },
        climateImpact: { temperature: 0, duration: 0 },
        ozoneDepletion: 0
      },
      casualties: { immediate: 0, shortTerm: 0, longTerm: 0, total: 0 },
      economicDamage: { direct: 0, indirect: 0, total: 0 },
      debrisField: [],
      secondaryImpacts: [],
      tsunamiRisk: false,
      confidence: 0.95,
      uncertaintyRange: { min: 0, max: 0 },
      historicalComparison: null
    });

    if (cesiumMapRef.current) {
      cesiumMapRef.current.clearVisualization();
    }
  }, []);

  // Load NASA data on component mount
  useEffect(() => {
    const loadNasaData = async () => {
      setNasaData(prev => ({ ...prev, isLoading: true }));
      try {
        // This would connect to actual NASA APIs
        const response = await fetch('/api/nasa/neo-data');
        const data = await response.json();
        setNasaData({
          nearEarthObjects: data.nearEarthObjects || [],
          lastUpdate: new Date().toISOString(),
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Failed to load NASA data:', error);
        setNasaData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    };

    loadNasaData();
  }, []);

  return (
    <div className="impact-map-page">
      <EnhancedMeteorBackground />
      
      {/* Enhanced Header with Real-time Status */}
      <motion.header 
        className="impact-map-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="header-title">
            <h1>🌍 Impact Simulation Map</h1>
            <div className="header-subtitle">
              Advanced Meteor Impact Analysis & Visualization
            </div>
          </div>
          
          <div className="header-status">
            <div className={`status-indicator ${simulationState.realTimeData ? 'active' : 'inactive'}`}>
              <span className="status-dot"></span>
              LIVE NASA DATA
            </div>
            <div className="data-quality">
              Quality: {simulationState.dataQuality.toUpperCase()}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Grid */}
      <div className="impact-map-container">
        
        {/* Left Panel - Controls and Data */}
        <motion.div 
          className="left-panel"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Panel Navigation */}
          <div className="panel-nav">
            {[
              { id: 'controls', icon: '🎮', label: 'Controls' },
              { id: 'analysis', icon: '📊', label: 'Analysis' },
              { id: 'data', icon: '🛰️', label: 'NASA Data' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activePanel === tab.id ? 'active' : ''}`}
                onClick={() => setActivePanel(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="panel-content">
            <AnimatePresence mode="wait">
              {activePanel === 'controls' && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <InteractiveControlPanel
                    meteorParams={meteorParams}
                    onParamsChange={setMeteorParams}
                    mapSettings={mapSettings}
                    onMapSettingsChange={setMapSettings}
                    simulationState={simulationState}
                    onRunSimulation={handleRunSimulation}
                    onResetSimulation={handleResetSimulation}
                  />
                  
                  {/* Universal Location Selector */}
                  <CleanCard className="location-selector-card">
                    <h3>🎯 Impact Location</h3>
                    <LocationSelector
                      value={impactLocation}
                      onChange={setImpactLocation}
                      mode="compact"
                      placeholder="Select impact location..."
                    />
                  </CleanCard>
                </motion.div>
              )}

              {activePanel === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DataAnalysisPanel
                    ref={dataAnalysisRef}
                    impactResults={impactResults}
                    meteorParams={meteorParams}
                    dataAnalysis={dataAnalysis}
                    simulationHistory={simulationHistory}
                  />
                </motion.div>
              )}

              {activePanel === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RealTimeDataFeed
                    nasaData={nasaData}
                    onDataUpdate={setNasaData}
                    meteorParams={meteorParams}
                    onParamsUpdate={setMeteorParams}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Center Panel - 3D Map Visualization */}
        <motion.div 
          className="center-panel"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="map-container">
            <CesiumEarthMap
              ref={cesiumMapRef}
              meteorParams={meteorParams}
              impactResults={impactResults}
              mapSettings={mapSettings}
              simulationState={simulationState}
              onLocationChange={(lat, lng) => 
                setMeteorParams(prev => ({ ...prev, latitude: lat, longitude: lng }))
              }
            />
            
            {/* Map Overlay Controls */}
            <div className="map-overlay-controls">
              <div className="view-mode-selector">
                {['3d', 'satellite', 'terrain', 'hybrid'].map(mode => (
                  <button
                    key={mode}
                    className={`view-mode-btn ${mapSettings.viewMode === mode ? 'active' : ''}`}
                    onClick={() => setMapSettings(prev => ({ ...prev, viewMode: mode }))}
                  >
                    {mode === '3d' && '🌍'}
                    {mode === 'satellite' && '🛰️'}
                    {mode === 'terrain' && '🏔️'}
                    {mode === 'hybrid' && '🗺️'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Visualization Dashboard */}
        <motion.div 
          className="right-panel"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <ImpactVisualizationDashboard
            impactResults={impactResults}
            meteorParams={meteorParams}
            simulationState={simulationState}
            dataAnalysis={dataAnalysis}
          />
        </motion.div>
      </div>

      {/* Bottom Panel - Timeline and Export */}
      {(simulationState.isRunning || simulationState.isComplete) && (
        <motion.div 
          className="bottom-panel"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="timeline-container">
            <div className="timeline-header">
              <span className="timeline-phase">Phase: {simulationState.phase}</span>
              <span className="timeline-time">T+{simulationState.currentTime.toFixed(1)}s</span>
              <span className="timeline-progress">{simulationState.progress.toFixed(0)}%</span>
            </div>
            
            <div className="timeline-bar">
              <div 
                className="timeline-progress-fill"
                style={{ width: `${simulationState.progress}%` }}
              />
            </div>
          </div>

          {simulationState.isComplete && (
            <div className="export-controls">
              <ExportShareManager
                meteorParams={meteorParams}
                impactResults={impactResults}
                simulationHistory={simulationHistory}
                dataAnalysis={dataAnalysis}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Enhanced Physics Engine */}
      <EnhancedPhysicsEngine
        ref={physicsEngineRef}
        meteorParams={meteorParams}
        onResultsUpdate={setImpactResults}
        realTimeData={simulationState.realTimeData}
      />
    </div>
  );
};

export default ImpactMapPage;
