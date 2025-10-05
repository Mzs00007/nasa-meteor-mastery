import React from 'react';
import './PlanetInfoPanel.css';

const PlanetInfoPanel = ({ planetData, isVisible, onClose, position }) => {
  if (!isVisible || !planetData) return null;

  const {
    name,
    diameter,
    mass,
    density,
    gravity,
    escapeVelocity,
    rotationPeriod,
    orbitalPeriod,
    meanTemperature,
    atmosphereComposition,
    moons,
    axialTilt,
    eccentricity,
    semiMajorAxis,
    orbitalVelocity
  } = planetData;

  return (
    <div 
      className="planet-info-panel"
      style={{
        left: position?.x || '50%',
        top: position?.y || '50%',
        transform: position ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)'
      }}
    >
      <div className="planet-info-header">
        <h3>{name}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="planet-info-content">
        <div className="info-section">
          <h4>Physical Characteristics</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Diameter:</span>
              <span className="value">{diameter?.toLocaleString()} km</span>
            </div>
            <div className="info-item">
              <span className="label">Mass:</span>
              <span className="value">{mass} × 10²⁴ kg</span>
            </div>
            <div className="info-item">
              <span className="label">Density:</span>
              <span className="value">{density} g/cm³</span>
            </div>
            <div className="info-item">
              <span className="label">Gravity:</span>
              <span className="value">{gravity} m/s²</span>
            </div>
            <div className="info-item">
              <span className="label">Escape Velocity:</span>
              <span className="value">{escapeVelocity} km/s</span>
            </div>
            <div className="info-item">
              <span className="label">Mean Temperature:</span>
              <span className="value">{meanTemperature}°C</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h4>Orbital Characteristics</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Axial Tilt:</span>
              <span className="value">{axialTilt}°</span>
            </div>
            <div className="info-item">
              <span className="label">Orbital Period:</span>
              <span className="value">{orbitalPeriod} Earth days</span>
            </div>
            <div className="info-item">
              <span className="label">Rotation Period:</span>
              <span className="value">{rotationPeriod} hours</span>
            </div>
            <div className="info-item">
              <span className="label">Semi-major Axis:</span>
              <span className="value">{semiMajorAxis} AU</span>
            </div>
            <div className="info-item">
              <span className="label">Eccentricity:</span>
              <span className="value">{eccentricity}</span>
            </div>
            <div className="info-item">
              <span className="label">Orbital Velocity:</span>
              <span className="value">{orbitalVelocity} km/s</span>
            </div>
          </div>
        </div>

        {atmosphereComposition && (
          <div className="info-section">
            <h4>Atmosphere</h4>
            <div className="atmosphere-composition">
              {Object.entries(atmosphereComposition).map(([gas, percentage]) => (
                <div key={gas} className="atmosphere-item">
                  <span className="gas-name">{gas}:</span>
                  <span className="gas-percentage">{percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info-section">
          <h4>Additional Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Number of Moons:</span>
              <span className="value">{moons || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetInfoPanel;