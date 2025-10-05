import React, { useEffect, useState } from 'react';
import { SolarSystemCalculator } from '../utils/SolarSystemCalculator';
import { AstronomicalDataService } from '../services/AstronomicalDataService';
import './SolarSystemPanel.css';

// TEMPORARILY DISABLED FOR MAINTENANCE - Solar System functionality is under maintenance
/*
const SolarSystemPanelServiceTest = () => {
  console.log('🌌 SolarSystemPanelServiceTest: Component initializing...');
  
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState({});
  
  useEffect(() => {
    console.log('🌌 SolarSystemPanelServiceTest: useEffect running...');
    
    const runTests = async () => {
      try {
        console.log('🌌 Testing SolarSystemCalculator...');
        const calculator = new SolarSystemCalculator();
        console.log('🌌 SolarSystemCalculator created successfully');
        
        console.log('🌌 Testing AstronomicalDataService...');
        const dataService = new AstronomicalDataService();
        console.log('🌌 AstronomicalDataService created successfully');
        
        // Test basic calculation
        const testDate = new Date();
        const earthPosition = calculator.calculateHeliocentricPosition('earth', testDate);
        console.log('🌌 Earth position calculated:', earthPosition);
        
        setTestResults({
          calculator: 'SUCCESS',
          dataService: 'SUCCESS',
          earthPosition: earthPosition
        });
        
        setIsLoading(false);
        console.log('🌌 All tests completed successfully');
        
      } catch (error) {
        console.error('🌌 Error in service tests:', error);
        setTestResults({
          error: error.message
        });
        setIsLoading(false);
      }
    };
    
    runTests();
  }, []);
  
  return (
    <div className="solar-system-panel">
      <div className="solar-system-header">
        <h1>🌌 Solar System Panel (Service Test)</h1>
        <p>Testing astronomical services imports and functionality.</p>
        <p>Status: {isLoading ? 'Loading...' : 'Ready'}</p>
      </div>
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        fontSize: '16px',
        background: 'rgba(0,0,0,0.8)',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '600px'
      }}>
        <h3>Service Test Results</h3>
        <div style={{ textAlign: 'left', marginTop: '20px' }}>
          <p><strong>Calculator:</strong> {testResults.calculator || 'Testing...'}</p>
          <p><strong>Data Service:</strong> {testResults.dataService || 'Testing...'}</p>
          {testResults.earthPosition && (
            <p><strong>Earth Position:</strong> x: {testResults.earthPosition.x?.toFixed(4)}, y: {testResults.earthPosition.y?.toFixed(4)}, z: {testResults.earthPosition.z?.toFixed(4)}</p>
          )}
          {testResults.error && (
            <p style={{ color: '#ff6b6b' }}><strong>Error:</strong> {testResults.error}</p>
          )}
        </div>
        <p style={{ marginTop: '20px', fontSize: '14px', opacity: '0.8' }}>
          Check console for detailed logs
        </p>
      </div>
    </div>
  );
};
*/

// Placeholder component during maintenance
const SolarSystemPanelServiceTest = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>🔧 Solar System Panel Service Test</h3>
      <p>This component is temporarily disabled for maintenance.</p>
      <p>Please check back later.</p>
    </div>
  );
};

export default SolarSystemPanelServiceTest;