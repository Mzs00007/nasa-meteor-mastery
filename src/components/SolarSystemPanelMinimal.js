import React from 'react';
import './SolarSystemPanel.css';

const SolarSystemPanelMinimal = () => {
  console.log('🌌 SolarSystemPanelMinimal: Component rendering...');
  
  return (
    <div className="solar-system-panel">
      <div className="solar-system-header">
        <h1>🌌 Solar System Panel (Minimal)</h1>
        <p>This is a minimal version to test basic rendering.</p>
      </div>
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        fontSize: '24px'
      }}>
        <p>Solar System Panel is loading...</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SolarSystemPanelMinimal;