import React, { useState, useEffect, useMemo } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { GlassCard, GlassPanel, GlassButton } from './ui/GlassComponents';
import '../styles/glassmorphic.css';
import '../styles/components.css';

const SimulationHistory = () => {
  const {
    simulationHistory,
    clearSimulationHistory,
    setAsteroidParams,
    setImpactLocation,
    setSimulationResults,
  } = useSimulation();

  // State management
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Animation state
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Format utilities
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleString(),
      short: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    };
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatEnergy = (energy) => {
    if (energy >= 1e15) return `${(energy / 1e15).toFixed(2)} PJ`;
    if (energy >= 1e12) return `${(energy / 1e12).toFixed(2)} TJ`;
    if (energy >= 1e9) return `${(energy / 1e9).toFixed(2)} GJ`;
    if (energy >= 1e6) return `${(energy / 1e6).toFixed(2)} MJ`;
    if (energy >= 1e3) return `${(energy / 1e3).toFixed(2)} kJ`;
    return `${energy.toFixed(2)} J`;
  };

  const getImpactLevel = (energy) => {
    if (energy >= 1e15) return { level: 'catastrophic', color: '#ff1744', icon: '💥' };
    if (energy >= 1e12) return { level: 'severe', color: '#ff5722', icon: '🔥' };
    if (energy >= 1e9) return { level: 'major', color: '#ff9800', icon: '⚠️' };
    if (energy >= 1e6) return { level: 'moderate', color: '#ffc107', icon: '⚡' };
    return { level: 'minor', color: '#4caf50', icon: '✨' };
  };

  const getRiskLevel = (simulation) => {
    const energy = simulation.results.energy;
    const diameter = simulation.params.diameter;
    const velocity = simulation.params.velocity || 20;
    
    const riskScore = (energy / 1e12) + (diameter / 100) + (velocity / 30);
    
    if (riskScore >= 10) return { level: 'Extreme', color: '#d32f2f', bg: 'rgba(211, 47, 47, 0.1)' };
    if (riskScore >= 5) return { level: 'High', color: '#f57c00', bg: 'rgba(245, 124, 0, 0.1)' };
    if (riskScore >= 2) return { level: 'Medium', color: '#fbc02d', bg: 'rgba(251, 192, 45, 0.1)' };
    return { level: 'Low', color: '#388e3c', bg: 'rgba(56, 142, 60, 0.1)' };
  };

  // Filtering and sorting logic
  const filteredAndSortedSimulations = useMemo(() => {
    let filtered = simulationHistory.filter(sim => {
      const impactLevel = getImpactLevel(sim.results.energy).level;
      const matchesFilter = filter === 'all' || impactLevel === filter;
      
      const searchable = `${sim.id} ${sim.params?.composition || ''} ${sim.params?.diameter || ''} ${impactLevel}`.toLowerCase();
      const matchesSearch = searchable.includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });

    // Sort simulations
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.results.timestamp);
          bValue = new Date(b.results.timestamp);
          break;
        case 'energy':
          aValue = a.results.energy;
          bValue = b.results.energy;
          break;
        case 'diameter':
          aValue = a.params.diameter;
          bValue = b.params.diameter;
          break;
        case 'crater':
          aValue = a.results.craterDiameter;
          bValue = b.results.craterDiameter;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [simulationHistory, filter, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSimulations.length / itemsPerPage);
  const paginatedSimulations = filteredAndSortedSimulations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const statistics = useMemo(() => {
    if (simulationHistory.length === 0) return null;
    
    const energies = simulationHistory.map(sim => sim.results.energy);
    const diameters = simulationHistory.map(sim => sim.params.diameter);
    const craters = simulationHistory.map(sim => sim.results.craterDiameter);
    
    return {
      total: simulationHistory.length,
      avgEnergy: energies.reduce((a, b) => a + b, 0) / energies.length,
      maxEnergy: Math.max(...energies),
      avgDiameter: diameters.reduce((a, b) => a + b, 0) / diameters.length,
      avgCrater: craters.reduce((a, b) => a + b, 0) / craters.length,
      impactLevels: {
        catastrophic: simulationHistory.filter(sim => getImpactLevel(sim.results.energy).level === 'catastrophic').length,
        severe: simulationHistory.filter(sim => getImpactLevel(sim.results.energy).level === 'severe').length,
        major: simulationHistory.filter(sim => getImpactLevel(sim.results.energy).level === 'major').length,
        moderate: simulationHistory.filter(sim => getImpactLevel(sim.results.energy).level === 'moderate').length,
        minor: simulationHistory.filter(sim => getImpactLevel(sim.results.energy).level === 'minor').length,
      }
    };
  }, [simulationHistory]);

  // Load simulation
  const loadSimulation = (simulation) => {
    setIsLoading(true);
    setTimeout(() => {
      setAsteroidParams(simulation.params);
      setImpactLocation(simulation.results.impactLocation);
      setSimulationResults({
        energy: simulation.results.energy,
        craterDiameter: simulation.results.craterDiameter,
        timestamp: simulation.results.timestamp,
        id: simulation.id,
      });
      setIsLoading(false);
    }, 500);
  };

  // Export functionality
  const exportData = (format) => {
    const data = filteredAndSortedSimulations.map(sim => ({
      id: sim.id,
      timestamp: sim.results.timestamp,
      diameter: sim.params.diameter,
      composition: sim.params.composition,
      velocity: sim.params.velocity,
      angle: sim.params.angle,
      energy: sim.results.energy,
      craterDiameter: sim.results.craterDiameter,
      latitude: sim.results.impactLocation.lat,
      longitude: sim.results.impactLocation.lng,
      impactLevel: getImpactLevel(sim.results.energy).level,
      riskLevel: getRiskLevel(sim).level
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-history-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
    setShowExportModal(false);
  };

  if (simulationHistory.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold font-orbitron mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                📊 Simulation History
              </span>
            </h1>
            <p className="text-xl text-gray-300">Track and analyze your asteroid impact simulations</p>
          </div>

          {/* Empty State */}
          <GlassCard className="text-center py-16">
            <div className="space-y-6">
              <div className="text-8xl">🚀</div>
              <h2 className="text-3xl font-bold text-white">No Simulations Yet</h2>
              <p className="text-gray-300 text-lg max-w-md mx-auto">
                Start running asteroid impact simulations to build your analysis library and track historical data.
              </p>
              <div className="flex gap-4 justify-center mt-8">
                <GlassButton 
                  onClick={() => window.location.href = '/simulation'}
                  className="px-8 py-3 text-lg"
                >
                  🎯 Run First Simulation
                </GlassButton>
                <GlassButton 
                  onClick={() => window.location.href = '/mission-control'}
                  variant="secondary"
                  className="px-8 py-3 text-lg"
                >
                  🛰️ Mission Control
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold font-orbitron mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              📊 Simulation History
            </span>
          </h1>
          <p className="text-xl text-gray-300">Comprehensive analysis of {simulationHistory.length} simulations</p>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{statistics.total}</div>
              <div className="text-gray-300">Total Simulations</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{formatEnergy(statistics.avgEnergy)}</div>
              <div className="text-gray-300">Average Energy</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">{statistics.avgDiameter.toFixed(1)}m</div>
              <div className="text-gray-300">Average Diameter</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{statistics.avgCrater.toFixed(1)}km</div>
              <div className="text-gray-300">Average Crater</div>
            </GlassCard>
          </div>
        )}

        {/* Controls Panel */}
        <GlassPanel className="p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search simulations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
              >
                <option value="all">All Impacts</option>
                <option value="catastrophic">💥 Catastrophic</option>
                <option value="severe">🔥 Severe</option>
                <option value="major">⚠️ Major</option>
                <option value="moderate">⚡ Moderate</option>
                <option value="minor">✨ Minor</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
              >
                <option value="date">📅 Date</option>
                <option value="energy">⚡ Energy</option>
                <option value="diameter">📏 Diameter</option>
                <option value="crater">🕳️ Crater Size</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                ☰
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <GlassButton onClick={() => setShowExportModal(true)} variant="secondary">
                📤 Export
              </GlassButton>
              <GlassButton onClick={clearSimulationHistory} variant="danger">
                🗑️ Clear All
              </GlassButton>
            </div>
          </div>
        </GlassPanel>

        {/* Simulations Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {paginatedSimulations.map((simulation, index) => {
            const impact = getImpactLevel(simulation.results.energy);
            const risk = getRiskLevel(simulation);
            const date = formatDate(simulation.results.timestamp);

            return (
              <GlassCard 
                key={simulation.id} 
                className={`cursor-pointer hover:scale-105 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center gap-6' : ''}`}
                onClick={() => {
                  setSelectedSimulation(simulation);
                  setShowDetailModal(true);
                }}
              >
                {/* Impact Level Indicator */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${viewMode === 'list' ? 'relative top-0 right-0' : ''}`} 
                     style={{ backgroundColor: impact.color + '20', color: impact.color }}>
                  {impact.icon} {impact.level.toUpperCase()}
                </div>

                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">
                      🚀 Simulation #{simulation.id}
                    </h3>
                    <p className="text-gray-400 text-sm">{date.relative} • {date.short}</p>
                  </div>

                  {/* Key Metrics */}
                  <div className={`grid ${viewMode === 'list' ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-4`}>
                    <div>
                      <div className="text-gray-400 text-xs">Diameter</div>
                      <div className="text-white font-bold">{simulation.params.diameter}m</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Energy</div>
                      <div className="text-white font-bold">{formatEnergy(simulation.results.energy)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Crater</div>
                      <div className="text-white font-bold">{simulation.results.craterDiameter.toFixed(1)}km</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Risk Level</div>
                      <div className="font-bold" style={{ color: risk.color }}>{risk.level}</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="text-gray-400 text-sm mb-4">
                    📍 {simulation.results.impactLocation.lat.toFixed(2)}°, {simulation.results.impactLocation.lng.toFixed(2)}°
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <GlassButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        loadSimulation(simulation);
                      }}
                      className="flex-1 text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? '⏳ Loading...' : '🔄 Load Simulation'}
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <GlassButton 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="secondary"
            >
              ← Previous
            </GlassButton>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      currentPage === page 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <GlassButton 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="secondary"
            >
              Next →
            </GlassButton>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSimulation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  🚀 Simulation #{selectedSimulation.id} Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asteroid Parameters */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">🌌 Asteroid Parameters</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Diameter:</span>
                      <span className="text-white font-bold">{selectedSimulation.params.diameter}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Composition:</span>
                      <span className="text-white font-bold">{selectedSimulation.params.composition || 'Rocky'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Velocity:</span>
                      <span className="text-white font-bold">{selectedSimulation.params.velocity || 20} km/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Angle:</span>
                      <span className="text-white font-bold">{selectedSimulation.params.angle || 45}°</span>
                    </div>
                  </div>
                </div>

                {/* Impact Results */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">💥 Impact Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Energy Released:</span>
                      <span className="text-white font-bold">{formatEnergy(selectedSimulation.results.energy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Crater Diameter:</span>
                      <span className="text-white font-bold">{selectedSimulation.results.craterDiameter.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Impact Level:</span>
                      <span className="text-white font-bold">{getImpactLevel(selectedSimulation.results.energy).level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Assessment:</span>
                      <span className="text-white font-bold">{getRiskLevel(selectedSimulation).level}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex gap-4">
                  <GlassButton 
                    onClick={() => {
                      loadSimulation(selectedSimulation);
                      setShowDetailModal(false);
                    }}
                    className="flex-1"
                  >
                    🔄 Load This Simulation
                  </GlassButton>
                  <GlassButton 
                    onClick={() => setShowDetailModal(false)}
                    variant="secondary"
                  >
                    Close
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <GlassCard className="max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">📤 Export Data</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">Export {filteredAndSortedSimulations.length} simulations</p>
                
                <div className="flex gap-4">
                  <GlassButton 
                    onClick={() => exportData('json')}
                    className="flex-1"
                  >
                    📄 JSON
                  </GlassButton>
                  <GlassButton 
                    onClick={() => exportData('csv')}
                    className="flex-1"
                  >
                    📊 CSV
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationHistory;
