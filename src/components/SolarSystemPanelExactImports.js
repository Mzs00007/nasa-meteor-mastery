import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SolarSystemCalculator } from '../utils/SolarSystemCalculator';
import { AstronomicalDataService } from '../services/AstronomicalDataService';
import './SolarSystemPanel.css';

const SolarSystemPanelExactImports = () => {
  console.log('🌌 SolarSystemPanel (Exact Imports): Component initializing...');
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBody, setSelectedBody] = useState(null);
  const mountRef = useRef(null);
  
  // Simple useEffect to test basic functionality
  useEffect(() => {
    console.log('🌌 SolarSystemPanel (Exact Imports): useEffect running...');
    setIsLoading(false);
  }, []);
  
  console.log('🌌 SolarSystemPanel (Exact Imports): Rendering component, isLoading:', isLoading);
  
  return (
    <div className="solar-system-panel">
      <div className="solar-system-header">
        <h1>🌌 Solar System Panel (Exact Imports)</h1>
        <p>Testing with exact same imports as original</p>
      </div>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading Solar System...</p>
        </div>
      )}
      
      <div ref={mountRef} className="three-container" style={{ width: '100%', height: '600px', background: '#000' }}>
        <p style={{ color: 'white', padding: '20px' }}>Three.js container ready</p>
      </div>
      
      <div className="control-panel">
        <p>Control panel ready</p>
      </div>
      
      {selectedBody && (
        <div className="info-panel">
          <h3>Selected: {selectedBody.name}</h3>
        </div>
      )}
    </div>
  );
};

export default SolarSystemPanelExactImports;