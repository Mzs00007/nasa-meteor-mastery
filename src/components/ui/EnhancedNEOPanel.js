/**
 * Enhanced NEO (Near Earth Objects) Panel Component
 * Displays comprehensive asteroid data with impact assessments and risk analysis
 */

import React, { useState, useEffect } from 'react';
import enhancedNEOAPI from '../../services/enhancedNEOAPI';

const EnhancedNEOPanel = () => {
  const [neoData, setNeoData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNEO, setSelectedNEO] = useState(null);

  useEffect(() => {
    fetchNEOData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchNEOData, 10 * 60 * 1000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchNEOData = async () => {
    try {
      setLoading(true);
      const [neos, stats] = await Promise.all([
        enhancedNEOAPI.getTodaysNEOs(),
        enhancedNEOAPI.getNEOStatistics()
      ]);
      
      setNeoData(neos);
      setStatistics(stats);
      setError(null);
    } catch (err) {
      // Handle rate limit errors more gracefully
      if (err.response?.status === 429) {
        setError('NASA API rate limit reached - using cached data');
        console.debug('NEO API rate limit reached, using fallback data');
      } else {
        setError('Failed to fetch NEO data');
        console.error('NEO fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'medium': return 'text-orange-400 bg-orange-900/30 border-orange-500/50';
      case 'low': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      case 'minimal': return 'text-green-400 bg-green-900/30 border-green-500/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟡';
      case 'minimal': return '🟢';
      default: return '⚪';
    }
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} thousand km`;
    }
    return `${distance.toFixed(2)} million km`;
  };

  const formatDiameter = (diameter) => {
    if (diameter < 1000) {
      return `${diameter.toFixed(0)} m`;
    }
    return `${(diameter / 1000).toFixed(2)} km`;
  };

  if (loading && !neoData) {
    return (
      <div className="bg-gradient-to-br from-orange-900 via-red-900 to-purple-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
            <div className="h-4 bg-white/20 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-red-500/50 shadow-2xl">
        <h3 className="text-xl font-bold text-red-400 mb-2">☄️ NEO Tracking Error</h3>
        <p className="text-red-300">{error}</p>
        <button 
          onClick={fetchNEOData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-900 via-red-900 to-purple-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
            ☄️ Enhanced NEO Tracker
          </h3>
          <p className="text-gray-300 text-sm">
            Last updated: {neoData ? new Date(neoData.lastUpdated).toLocaleTimeString() : 'Unknown'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </button>
          <button
            onClick={fetchNEOData}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded-lg text-xs transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-orange-900/30 p-3 rounded-xl text-center border border-orange-500/50">
            <div className="text-2xl font-bold text-orange-400">{statistics.totalDiscovered.toLocaleString()}</div>
            <div className="text-xs text-gray-300">Total Discovered</div>
          </div>
          <div className="bg-red-900/30 p-3 rounded-xl text-center border border-red-500/50">
            <div className="text-2xl font-bold text-red-400">{statistics.potentiallyHazardous.toLocaleString()}</div>
            <div className="text-xs text-gray-300">Potentially Hazardous</div>
          </div>
          <div className="bg-yellow-900/30 p-3 rounded-xl text-center border border-yellow-500/50">
            <div className="text-2xl font-bold text-yellow-400">{statistics.todaysApproaches}</div>
            <div className="text-xs text-gray-300">Today's Approaches</div>
          </div>
          <div className="bg-purple-900/30 p-3 rounded-xl text-center border border-purple-500/50">
            <div className="text-2xl font-bold text-purple-400">{statistics.weeklyApproaches}</div>
            <div className="text-xs text-gray-300">This Week</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['overview', 'today', 'hazardous', 'details'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? 'bg-orange-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && neoData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-900/30 p-4 rounded-xl border border-orange-500/50">
              <h5 className="text-orange-400 font-semibold mb-3">Today's Summary</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total NEOs:</span>
                  <span className="font-bold text-orange-400">{neoData.nearEarthObjects.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hazardous:</span>
                  <span className="font-bold text-red-400">
                    {neoData.nearEarthObjects.filter(neo => neo.isPotentiallyHazardousAsteroid).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Closest Approach:</span>
                  <span className="font-bold text-yellow-400">
                    {Math.min(...neoData.nearEarthObjects.map(neo => 
                      parseFloat(neo.closeApproachData[0]?.missDistance?.kilometers || Infinity)
                    )).toFixed(0)} km
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-red-900/30 p-4 rounded-xl border border-red-500/50">
              <h5 className="text-red-400 font-semibold mb-3">Risk Assessment</h5>
              <div className="space-y-2 text-sm">
                {neoData.nearEarthObjects.slice(0, 3).map((neo, index) => {
                  const riskLevel = neo.isPotentiallyHazardousAsteroid ? 'high' : 'low';
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="truncate flex-1 mr-2">{neo.name.replace(/[()]/g, '')}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getRiskLevelColor(riskLevel)}`}>
                        {getRiskIcon(riskLevel)} {riskLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'today' && neoData && (
        <div className="space-y-4">
          <h5 className="font-semibold text-lg mb-4">Today's Close Approaches ({neoData.nearEarthObjects.length})</h5>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {neoData.nearEarthObjects.map((neo, index) => (
              <div 
                key={index} 
                className="bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setSelectedNEO(neo)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h6 className="font-semibold text-white truncate">
                      {neo.name.replace(/[()]/g, '')}
                    </h6>
                    <p className="text-sm text-gray-300">
                      Diameter: {formatDiameter(neo.estimatedDiameter?.meters?.estimatedDiameterMax || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {neo.isPotentiallyHazardousAsteroid && (
                      <span className="text-red-400 text-xs bg-red-900/30 px-2 py-1 rounded">
                        ⚠️ PHA
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {neo.closeApproachData[0]?.closeApproachDate}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Miss Distance:</span>
                    <div className="font-mono text-yellow-400">
                      {formatDistance(parseFloat(neo.closeApproachData[0]?.missDistance?.kilometers || 0) / 1000000)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Velocity:</span>
                    <div className="font-mono text-blue-400">
                      {parseFloat(neo.closeApproachData[0]?.relativeVelocity?.kilometersPerHour || 0).toFixed(0)} km/h
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'hazardous' && neoData && (
        <div className="space-y-4">
          <h5 className="font-semibold text-lg mb-4">Potentially Hazardous Asteroids</h5>
          {neoData.nearEarthObjects.filter(neo => neo.isPotentiallyHazardousAsteroid).length === 0 ? (
            <div className="bg-green-900/30 p-6 rounded-xl border border-green-500/50 text-center">
              <div className="text-4xl mb-2">🟢</div>
              <h6 className="text-green-400 font-semibold mb-2">All Clear Today!</h6>
              <p className="text-green-300 text-sm">No potentially hazardous asteroids approaching today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {neoData.nearEarthObjects
                .filter(neo => neo.isPotentiallyHazardousAsteroid)
                .map((neo, index) => (
                  <div key={index} className="bg-red-900/30 p-4 rounded-xl border border-red-500/50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h6 className="font-semibold text-red-400 mb-1">
                          ⚠️ {neo.name.replace(/[()]/g, '')}
                        </h6>
                        <p className="text-sm text-gray-300">
                          Potentially Hazardous Asteroid
                        </p>
                      </div>
                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                        HIGH RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400">Diameter:</span>
                        <div className="font-mono text-red-400">
                          {formatDiameter(neo.estimatedDiameter?.meters?.estimatedDiameterMax || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Miss Distance:</span>
                        <div className="font-mono text-yellow-400">
                          {formatDistance(parseFloat(neo.closeApproachData[0]?.missDistance?.kilometers || 0) / 1000000)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Velocity:</span>
                        <div className="font-mono text-orange-400">
                          {parseFloat(neo.closeApproachData[0]?.relativeVelocity?.kilometersPerHour || 0).toFixed(0)} km/h
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Approach:</span>
                        <div className="font-mono text-purple-400">
                          {neo.closeApproachData[0]?.closeApproachDate}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && selectedNEO && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-semibold text-lg">
              {selectedNEO.name.replace(/[()]/g, '')}
            </h5>
            <button
              onClick={() => setSelectedNEO(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <h6 className="font-semibold mb-3 text-orange-400">Physical Characteristics</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Min Diameter:</span>
                  <span className="font-mono text-blue-400">
                    {formatDiameter(selectedNEO.estimatedDiameter?.meters?.estimatedDiameterMin || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Diameter:</span>
                  <span className="font-mono text-purple-400">
                    {formatDiameter(selectedNEO.estimatedDiameter?.meters?.estimatedDiameterMax || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Absolute Magnitude:</span>
                  <span className="font-mono text-yellow-400">{selectedNEO.absoluteMagnitudeH}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hazardous:</span>
                  <span className={`font-bold ${selectedNEO.isPotentiallyHazardousAsteroid ? 'text-red-400' : 'text-green-400'}`}>
                    {selectedNEO.isPotentiallyHazardousAsteroid ? '⚠️ Yes' : '✅ No'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl">
              <h6 className="font-semibold mb-3 text-cyan-400">Approach Data</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-mono text-cyan-400">
                    {selectedNEO.closeApproachData[0]?.closeApproachDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Miss Distance:</span>
                  <span className="font-mono text-yellow-400">
                    {formatDistance(parseFloat(selectedNEO.closeApproachData[0]?.missDistance?.kilometers || 0) / 1000000)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Velocity:</span>
                  <span className="font-mono text-orange-400">
                    {parseFloat(selectedNEO.closeApproachData[0]?.relativeVelocity?.kilometersPerHour || 0).toFixed(0)} km/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Orbiting Body:</span>
                  <span className="font-mono text-green-400">
                    {selectedNEO.closeApproachData[0]?.orbitingBody}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'details' && !selectedNEO && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">☄️</div>
          <h5 className="text-xl font-semibold mb-2">Select an Asteroid</h5>
          <p className="text-gray-400">Click on any asteroid from the "Today" tab to view detailed information.</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedNEOPanel;