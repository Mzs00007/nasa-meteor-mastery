import React, { useState, useEffect } from 'react';

import { useSimulation } from '../context/SimulationContext';
import '../styles/theme.css';
import '../styles/components.css';

const AsteroidInput = () => {
  const { asteroidParams, setAsteroidParams, runSimulation, loading, error } =
    useSimulation();
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);

  // Sample presets
  useEffect(() => {
    setPresets([
      {
        id: 1,
        name: 'Chelyabinsk',
        diameter: 20,
        velocity: 19,
        angle: 18,
        composition: 'stone',
      },
      {
        id: 2,
        name: 'Tunguska',
        diameter: 60,
        velocity: 20,
        angle: 45,
        composition: 'ice',
      },
      {
        id: 3,
        name: 'Chicxulub',
        diameter: 500,
        velocity: 20,
        angle: 60,
        composition: 'iron',
      },
    ]);
  }, []);

  const handlePresetSelect = preset => {
    setAsteroidParams({
      diameter: preset.diameter,
      velocity: preset.velocity,
      angle: preset.angle,
      composition: preset.composition,
    });
    setActivePreset(preset.id);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setAsteroidParams(prev => ({
      ...prev,
      [name]: name === 'composition' ? value : Number(value),
    }));
    setActivePreset(null); // Clear active preset when user changes parameters
  };

  const handleSubmit = e => {
    e.preventDefault();
    runSimulation();
  };

  const calculateImpactEnergy = () => {
    // Simplified calculation based on diameter and velocity
    const radius = asteroidParams.diameter / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    let density = 3000; // Default density in kg/m³

    if (asteroidParams.composition === 'iron') {
      density = 8000;
    } else if (asteroidParams.composition === 'stone') {
      density = 3500;
    } else if (asteroidParams.composition === 'ice') {
      density = 1000;
    }

    const mass = density * volume;
    const velocityInMeters = asteroidParams.velocity * 1000; // Convert km/s to m/s
    return (0.5 * mass * Math.pow(velocityInMeters, 2)) / 1e12; // Convert to terajoules
  };

  const impactEnergy = calculateImpactEnergy().toFixed(2);
  const tntEquivalent = (impactEnergy / 4.184).toFixed(2); // 1 kt TNT = 4.184 TJ

  return (
    <div className='card shadow-sm'>
      <div className='card-header bg-primary text-white'>
        <h3 className='card-title mb-0'>Asteroid Parameters</h3>
        <div className='preset-container mt-2'>
          <span className='text-light me-2'>Presets:</span>
          {presets.map(preset => (
            <button
              key={preset.id}
              type='button'
              className={`btn btn-sm ${activePreset === preset.id ? 'btn-light' : 'btn-outline-light'} me-2`}
              onClick={() => handlePresetSelect(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
      <div className='card-body'>
        <form onSubmit={handleSubmit}>
          <div className='mb-3'>
            <label htmlFor='diameter' className='form-label'>
              Diameter (meters): {asteroidParams.diameter}m
            </label>
            <input
              type='range'
              className='form-range'
              id='diameter'
              name='diameter'
              min='1'
              max='1000'
              value={asteroidParams.diameter}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className='mb-3'>
            <label htmlFor='velocity' className='form-label'>
              Velocity (km/s): {asteroidParams.velocity}km/s
            </label>
            <input
              type='range'
              className='form-range'
              id='velocity'
              name='velocity'
              min='11'
              max='72'
              value={asteroidParams.velocity}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className='mb-3'>
            <label htmlFor='angle' className='form-label'>
              Entry Angle (degrees): {asteroidParams.angle}°
            </label>
            <input
              type='range'
              className='form-range'
              id='angle'
              name='angle'
              min='0'
              max='90'
              value={asteroidParams.angle}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className='mb-3'>
            <label htmlFor='composition' className='form-label'>
              Composition
            </label>
            <select
              className='form-select'
              id='composition'
              name='composition'
              value={asteroidParams.composition}
              onChange={handleChange}
              disabled={loading}
            >
              <option value='iron'>Iron</option>
              <option value='stone'>Stone</option>
              <option value='ice'>Ice</option>
            </select>
          </div>

          <div className='impact-stats mb-3 p-3 bg-light rounded'>
            <div className='row'>
              <div className='col-6'>
                <span className='fw-bold'>Impact Energy:</span>
                <span className='ms-2'>{impactEnergy} TJ</span>
              </div>
              <div className='col-6'>
                <span className='fw-bold'>TNT Equivalent:</span>
                <span className='ms-2'>{tntEquivalent} kt</span>
              </div>
            </div>
          </div>

          {error && (
            <div className='alert alert-danger mb-3' role='alert'>
              {error}
            </div>
          )}

          <button
            type='submit'
            className='btn btn-primary w-100'
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className='spinner-border spinner-border-sm me-2'
                  role='status'
                  aria-hidden={true}
                />
                Running Simulation...
              </>
            ) : (
              'Run Simulation'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AsteroidInput;
