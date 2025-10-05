// TEMPORARILY DISABLED FOR MAINTENANCE - Solar System functionality is under maintenance

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './SolarSystemPanel.css';

const SolarSystemPanelThreeTest = () => {
  console.log('🌌 SolarSystemPanelThreeTest: Component initializing...');
  
  const mountRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log('🌌 SolarSystemPanelThreeTest: useEffect running...');
    
    try {
      // Test Three.js basic functionality
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      
      console.log('🌌 Three.js objects created successfully');
      
      // Test OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      console.log('🌌 OrbitControls created successfully');
      
      setIsLoading(false);
      console.log('🌌 Component loaded successfully');
      
      // Cleanup
      return () => {
        renderer.dispose();
        console.log('🌌 Cleanup completed');
      };
    } catch (error) {
      console.error('🌌 Error in Three.js setup:', error);
      setIsLoading(false);
    }
  }, []);
  
  return (
    <div className="solar-system-panel">
      <div className="solar-system-header">
        <h1>🌌 Solar System Panel (Three.js Test)</h1>
        <p>Testing Three.js imports and basic functionality.</p>
        <p>Status: {isLoading ? 'Loading...' : 'Ready'}</p>
      </div>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        fontSize: '18px',
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '10px'
      }}>
        <p>Three.js Import Test</p>
        <p>Check console for detailed logs</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};


import React from 'react';

// Placeholder component during maintenance
const SolarSystemPanelThreeTest = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>🔧 Solar System Panel Three Test</h3>
      <p>This component is temporarily disabled for maintenance.</p>
      <p>Please check back later.</p>
    </div>
  );
}; 
 export default SolarSystemPanelThreeTest;