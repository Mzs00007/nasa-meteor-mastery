import React, { useState, useEffect, useRef } from 'react';

import CesiumEarthMap from './impact-map/CesiumEarthMap';
import ExportShareManager from './impact-map/ExportShareManager';
import InteractiveControlPanel from './impact-map/InteractiveControlPanel';
import MeteorPhysicsEngine from './impact-map/MeteorPhysicsEngine';
import StatisticsPanel from './impact-map/StatisticsPanel';
import {
  CleanCard,
  CleanButton,
  CleanSection,
} from './ui/cleanmoderncomponents';
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import '../styles/clean-theme.css';
import './ui/CleanModernComponents.css';
import '../styles/glassmorphic.css';
import '../styles/impact-map.css';

const ImpactMapPage = () => {
  // Core state management
  const [meteorParams, setMeteorParams] = useState({
    diameter: 100, // meters
    velocity: 20000, // m/s
    angle: 45, // degrees
    density: 3000, // kg/m³
    composition: 'stone', // stone, iron, stony-iron
    latitude: 40.7128,
    longitude: -74.006,
    altitude: 100000, // meters above surface
  });

  const [simulationState, setSimulationState] = useState({
    isRunning: false,
    isComplete: false,
    currentTime: 0,
    totalTime: 10, // seconds
    phase: 'approach', // approach, impact, explosion, aftermath
  });

  const [impactResults, setImpactResults] = useState({
    energy: 0, // TNT equivalent in tons
    craterDiameter: 0, // meters
    blastRadius: 0, // meters
    seismicMagnitude: 0,
    casualties: 0,
    temperature: 0, // Kelvin
    shockwaveSpeed: 0, // m/s
    debrisField: [],
    atmosphericEffects: {},
  });

  const [mapSettings, setMapSettings] = useState({
    viewMode: '3d', // 3d, satellite, terrain
    showTrajectory: true,
    showBlastRadius: true,
    showSeismicRings: true,
    showHeatMap: false,
    showPopulationDensity: false,
    showTectonicPlates: false,
    timeOfDay: 'current', // current, day, night, custom
    weatherConditions: 'clear',
  });

  const [simulationHistory, setSimulationHistory] = useState([]);

  // Refs for component communication
  const cesiumMapRef = useRef(null);
  const physicsEngineRef = useRef(null);

  // Initialize physics engine
  useEffect(() => {
    if (physicsEngineRef.current) {
      physicsEngineRef.current.updateParameters(meteorParams);
    }
  }, [meteorParams]);

  // Handle simulation control
  const handleRunSimulation = async () => {
    if (!physicsEngineRef.current || !cesiumMapRef.current) {
      return;
    }

    setSimulationState(prev => ({
      ...prev,
      isRunning: true,
      isComplete: false,
      currentTime: 0,
    }));

    try {
      // Calculate impact physics
      const results =
        await physicsEngineRef.current.calculateImpact(meteorParams);
      setImpactResults(results);

      // Add to simulation history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        meteorParams: { ...meteorParams },
        results: { ...results },
        mapSettings: { ...mapSettings },
      };
      setSimulationHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 simulations

      // Animate on map
      await cesiumMapRef.current.animateImpact(meteorParams, results);

      setSimulationState(prev => ({
        ...prev,
        isRunning: false,
        isComplete: true,
        phase: 'aftermath',
      }));
    } catch (error) {
      console.error('Simulation error:', error);
      setSimulationState(prev => ({ ...prev, isRunning: false }));
    }
  };

  const handleResetSimulation = () => {
    setSimulationState({
      isRunning: false,
      isComplete: false,
      currentTime: 0,
      totalTime: 10,
      phase: 'approach',
    });
    setImpactResults({
      energy: 0,
      craterDiameter: 0,
      blastRadius: 0,
      seismicMagnitude: 0,
      casualties: 0,
      temperature: 0,
      shockwaveSpeed: 0,
      debrisField: [],
      atmosphericEffects: {},
    });
    if (cesiumMapRef.current) {
      cesiumMapRef.current.resetVisualization();
    }
  };

  const handleLocationSelect = (latitude, longitude) => {
    setMeteorParams(prev => ({
      ...prev,
      latitude,
      longitude,
    }));
  };

  return (
    <div className='clean-container clean-h-screen clean-bg-surface-primary'>
      <EnhancedMeteorBackground />

      <div className='clean-grid clean-grid--canvas-layout clean-gap-4 clean-h-full clean-p-4'>
        {/* Main Content Area - Canvas takes 3/4 of the width */}
        <div className='clean-flex clean-flex-col clean-gap-4'>
          <CleanSection title='Impact Simulation Map' className='clean-flex-1'>
            <CesiumEarthMap
              ref={cesiumMapRef}
              meteorParams={meteorParams}
              simulationState={simulationState}
              impactResults={impactResults}
              mapSettings={mapSettings}
              onLocationSelect={handleLocationSelect}
            />

            {/* Map overlay controls */}
            <div className='clean-absolute clean-top-4 clean-right-4 clean-z-10'>
              <CleanCard variant='transparent' className='clean-p-3'>
                <div className='clean-flex clean-gap-2'>
                  <CleanButton
                    variant={
                      mapSettings.viewMode === '3d' ? 'primary' : 'secondary'
                    }
                    size='small'
                    onClick={() =>
                      setMapSettings(prev => ({ ...prev, viewMode: '3d' }))
                    }
                  >
                    🌍 3D Globe
                  </CleanButton>
                  <CleanButton
                    variant={
                      mapSettings.viewMode === 'satellite'
                        ? 'primary'
                        : 'secondary'
                    }
                    size='small'
                    onClick={() =>
                      setMapSettings(prev => ({
                        ...prev,
                        viewMode: 'satellite',
                      }))
                    }
                  >
                    🛰️ Satellite
                  </CleanButton>
                  <CleanButton
                    variant={
                      mapSettings.viewMode === 'terrain'
                        ? 'primary'
                        : 'secondary'
                    }
                    size='small'
                    onClick={() =>
                      setMapSettings(prev => ({ ...prev, viewMode: 'terrain' }))
                    }
                  >
                    🏔️ Terrain
                  </CleanButton>
                </div>
              </CleanCard>
            </div>

            {/* Simulation timeline controls */}
            {simulationState.isRunning && (
              <div className='clean-absolute clean-bottom-4 clean-left-4 clean-right-4 clean-z-10'>
                <CleanCard variant='transparent' className='clean-p-4'>
                  <div className='clean-flex clean-flex-col clean-gap-3'>
                    <div className='clean-w-full clean-h-2 clean-bg-surface-secondary clean-rounded-full clean-overflow-hidden'>
                      <div
                        className='clean-h-full clean-bg-primary clean-transition-all'
                        style={{
                          width: `${(simulationState.currentTime / simulationState.totalTime) * 100}%`,
                        }}
                      />
                    </div>
                    <div className='clean-flex clean-justify-between clean-text-sm clean-text-secondary'>
                      <span>Phase: {simulationState.phase}</span>
                      <span>T+{simulationState.currentTime.toFixed(1)}s</span>
                    </div>
                  </div>
                </CleanCard>
              </div>
            )}
          </CleanSection>
        </div>

        {/* Sidebar with Controls and Results - Takes 1/4 of the width */}
        <div className='clean-flex clean-flex-col clean-gap-4'>
          {/* Interactive Control Panel */}
          <InteractiveControlPanel
            meteorParams={meteorParams}
            onParamsChange={setMeteorParams}
            mapSettings={mapSettings}
            onMapSettingsChange={setMapSettings}
            simulationState={simulationState}
            onRunSimulation={handleRunSimulation}
            onResetSimulation={handleResetSimulation}
          />

          {/* Statistics and Results Panel */}
          <CleanSection title='Impact Analysis' collapsible>
            <StatisticsPanel
              impactResults={impactResults}
              meteorParams={meteorParams}
              simulationState={simulationState}
            />
          </CleanSection>

          {/* Export and Share Panel */}
          <CleanSection title='Export & Share' collapsible>
            <ExportShareManager
              meteorParams={meteorParams}
              impactResults={impactResults}
              simulationHistory={simulationHistory}
              onClose={() => setShowExportShare(false)}
            />
          </CleanSection>
        </div>
      </div>

      {/* Timeline Section for Mobile */}
      {simulationState.isRunning && (
        <CleanSection className='clean-fixed clean-bottom-0 clean-left-0 clean-right-0 clean-z-20'>
          <div className='clean-flex clean-flex-col clean-gap-3 clean-p-4'>
            <div className='clean-w-full clean-h-2 clean-bg-surface-secondary clean-rounded-full clean-overflow-hidden'>
              <div
                className='clean-h-full clean-bg-primary clean-transition-all'
                style={{
                  width: `${(simulationState.currentTime / simulationState.totalTime) * 100}%`,
                }}
              />
            </div>
            <div className='clean-flex clean-justify-between clean-text-sm clean-text-secondary'>
              <span>Phase: {simulationState.phase}</span>
              <span>T+{simulationState.currentTime.toFixed(1)}s</span>
            </div>
          </div>
        </CleanSection>
      )}

      {/* Physics Engine (hidden component for calculations) */}
      <MeteorPhysicsEngine
        ref={physicsEngineRef}
        meteorParams={meteorParams}
        onResultsUpdate={setImpactResults}
      />
    </div>
  );
};

export default ImpactMapPage;
