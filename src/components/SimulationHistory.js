import React, { useState } from 'react';

import { useSimulation } from '../context/SimulationContext';
import '../styles/components.css';
import '../styles/design-guide.css';

const SimulationHistory = () => {
  const {
    simulationHistory,
    clearSimulationHistory,
    setAsteroidParams,
    setImpactLocation,
    setSimulationResults,
  } = useSimulation();
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [theme, setTheme] = useState('dark');
  const [searchQuery, setSearchQuery] = useState('');

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format energy value with appropriate units
  const formatEnergy = energy => {
    if (energy >= 1e15) {
      return `${(energy / 1e15).toFixed(2)} PJ`;
    } else if (energy >= 1e12) {
      return `${(energy / 1e12).toFixed(2)} TJ`;
    } else if (energy >= 1e9) {
      return `${(energy / 1e9).toFixed(2)} GJ`;
    } else if (energy >= 1e6) {
      return `${(energy / 1e6).toFixed(2)} MJ`;
    } else if (energy >= 1e3) {
      return `${(energy / 1e3).toFixed(2)} kJ`;
    }
    return `${energy.toFixed(2)} J`;
  };

  const getImpactLevel = energy => {
    if (energy >= 1e15) return 'high';
    if (energy >= 1e12) return 'medium';
    return 'low';
  };

  // Load a previous simulation
  const loadSimulation = simulation => {
    setAsteroidParams(simulation.params);
    setImpactLocation(simulation.results.impactLocation);
    setSimulationResults({
      energy: simulation.results.energy,
      craterDiameter: simulation.results.craterDiameter,
      timestamp: simulation.results.timestamp,
      id: simulation.id,
    });
  };

  const filteredSimulations = simulationHistory.filter(sim => {
    const matchesFilter =
      filter === 'all' || getImpactLevel(sim.results.energy) === filter;
    const searchable = `${sim.id} ${sim.params?.composition || ''} ${
      sim.params?.diameter || ''
    }`.toLowerCase();
    const matchesSearch = searchable.includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (simulationHistory.length === 0) {
    return (
      <div className='history-container' data-testid='simulation-history-container'>
        <h1 className='w3-xxlarge w3-margin'>Simulation History</h1>
        <div className='filter-bar'>
          <div className='view-toggle'>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>

          <div className='filter-dropdown'>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className='filter-select'
            >
              <option value='all'>All Simulations</option>
              <option value='low'>Low Impact</option>
              <option value='medium'>Medium Impact</option>
              <option value='high'>High Impact</option>
            </select>

            <input
              type='text'
              placeholder='Search simulations...'
              className='search-input'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className='card-body'>
          <p className='text-center'>No simulation history yet</p>
          <p className='text-center'>Run your first simulation to see results here!</p>

          <div className='settings-section'>
            <h2>Settings</h2>

            <div className='theme-toggles'>
              <h3>Theme</h3>
              <div className='theme-buttons'>
                <button
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                  style={{ backgroundColor: '#f5f5f5' }}
                />
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                  style={{ backgroundColor: '#333' }}
                />
                <button
                  className={`theme-btn ${theme === 'blue' ? 'active' : ''}`}
                  onClick={() => setTheme('blue')}
                  style={{ backgroundColor: '#1a3a5c' }}
                />
              </div>
            </div>

            <div className='language-selector'>
              <h3>Language</h3>
              <div className='language-buttons'>
                <button className='language-btn'>🇺🇸</button>
                <button className='language-btn'>🇪🇸</button>
                <button className='language-btn'>🇫🇷</button>
                <button className='language-btn'>🇩🇪</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='history-container' data-testid='simulation-history-container'>
      <h1 className='w3-xxlarge w3-margin'>Simulation History</h1>
      <div className='filter-bar'>
        <div className='view-toggle'>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
        </div>

        <div className='filter-dropdown'>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className='filter-select'
          >
            <option value='all'>All Simulations</option>
            <option value='low'>Low Impact</option>
            <option value='medium'>Medium Impact</option>
            <option value='high'>High Impact</option>
          </select>

          <input
            type='text'
            placeholder='Search simulations...'
            className='search-input'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <button
            className='btn btn-sm btn-danger'
            onClick={clearSimulationHistory}
          >
            Clear History
          </button>
        </div>
      </div>

      <div className={`simulations-${viewMode}`}>
        {filteredSimulations.map(simulation => (
          <div
            key={simulation.id}
            className='simulation-card'
            onClick={() => loadSimulation(simulation)}
            data-testid='simulation-history-item'
          >
            <h3>Simulation {simulation.id}</h3>
            <p>Date: {formatDate(simulation.results.timestamp)}</p>
            <p>Size: {simulation.params.diameter}m</p>
            <p>Energy: {formatEnergy(simulation.results.energy)}</p>
            <p>Crater: {simulation.results.craterDiameter.toFixed(2)} km</p>
            <p>
              Location: {simulation.results.impactLocation.lat.toFixed(2)},{' '}
              {simulation.results.impactLocation.lng.toFixed(2)}
            </p>
            <button className='w3-button w3-small w3-blue' onClick={() => loadSimulation(simulation)}>
              Load This Simulation
            </button>
          </div>
        ))}
      </div>

      <div className='settings-section'>
        <h2>Settings</h2>

        <div className='theme-toggles'>
          <h3>Theme</h3>
          <div className='theme-buttons'>
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              style={{ backgroundColor: '#f5f5f5' }}
            />
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              style={{ backgroundColor: '#333' }}
            />
            <button
              className={`theme-btn ${theme === 'blue' ? 'active' : ''}`}
              onClick={() => setTheme('blue')}
              style={{ backgroundColor: '#1a3a5c' }}
            />
          </div>
        </div>

        <div className='language-selector'>
          <h3>Language</h3>
          <div className='language-buttons'>
            <button className='language-btn'>🇺🇸</button>
            <button className='language-btn'>🇪🇸</button>
            <button className='language-btn'>🇫🇷</button>
            <button className='language-btn'>🇩🇪</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationHistory;
