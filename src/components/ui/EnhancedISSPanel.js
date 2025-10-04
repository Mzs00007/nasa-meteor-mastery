/**
 * Enhanced ISS Tracking Panel Component
 * Displays comprehensive ISS data with detailed orbital information
 */

import React, { useState, useEffect } from 'react';
import enhancedISSAPI from '../../services/enhancedISSAPI';

const EnhancedISSPanel = () => {
  const [issData, setIssData] = useState(null);
  const [groundTrack, setGroundTrack] = useState(null);
  const [visibility, setVisibility] = useState(null);
  const [crew, setCrew] = useState(null);
  const [experiments, setExperiments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('position');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchISSData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchISSData, 30 * 1000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchISSData = async () => {
    try {
      setLoading(true);
      const [position, track, vis, crewData, exp] = await Promise.all([
        enhancedISSAPI.getCurrentPosition(),
        enhancedISSAPI.getGroundTrack(),
        enhancedISSAPI.getVisibilityData(),
        enhancedISSAPI.getCrewInformation(),
        enhancedISSAPI.getCurrentExperiments()
      ]);
      
      setIssData(position);
      setGroundTrack(track);
      setVisibility(vis);
      setCrew(crewData);
      setExperiments(exp);
      setError(null);
    } catch (err) {
      setError('Failed to fetch ISS data');
      console.error('ISS fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCoordinate = (coord, type) => {
    const abs = Math.abs(coord);
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${abs.toFixed(4)}° ${direction}`;
  };

  const getVisibilityQuality = (magnitude) => {
    if (magnitude <= -3) return { text: 'Excellent', color: 'text-green-400', icon: '🌟' };
    if (magnitude <= -2) return { text: 'Very Good', color: 'text-blue-400', icon: '✨' };
    if (magnitude <= -1) return { text: 'Good', color: 'text-yellow-400', icon: '⭐' };
    return { text: 'Fair', color: 'text-orange-400', icon: '🔸' };
  };

  if (loading && !issData) {
    return (
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
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
        <h3 className="text-xl font-bold text-red-400 mb-2">🛰️ ISS Tracking Error</h3>
        <p className="text-red-300">{error}</p>
        <button 
          onClick={fetchISSData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🛰️ Enhanced ISS Tracker
          </h3>
          <p className="text-gray-300 text-sm">
            Last updated: {issData ? new Date(issData.timestamp).toLocaleTimeString() : 'Unknown'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-600/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">LIVE</span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
          </button>
          <button
            onClick={fetchISSData}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Current Position Summary */}
      {issData && (
        <div className="bg-white/10 p-4 rounded-xl mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatCoordinate(issData.latitude, 'lat')}
              </div>
              <div className="text-xs text-gray-300">Latitude</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {formatCoordinate(issData.longitude, 'lng')}
              </div>
              <div className="text-xs text-gray-300">Longitude</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {issData.altitude.toFixed(1)} km
              </div>
              <div className="text-xs text-gray-300">Altitude</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {issData.velocity.toFixed(1)} km/h
              </div>
              <div className="text-xs text-gray-300">Velocity</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['position', 'orbital', 'visibility', 'crew', 'experiments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'position' && issData && groundTrack && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-500/50">
              <h5 className="text-blue-400 font-semibold mb-3">Current Position</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Latitude:</span>
                  <span className="font-mono text-blue-400">{formatCoordinate(issData.latitude, 'lat')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Longitude:</span>
                  <span className="font-mono text-cyan-400">{formatCoordinate(issData.longitude, 'lng')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Altitude:</span>
                  <span className="font-mono text-purple-400">{issData.altitude.toFixed(2)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Velocity:</span>
                  <span className="font-mono text-green-400">{issData.velocity.toFixed(2)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span>Footprint:</span>
                  <span className="font-mono text-yellow-400">{issData.footprint.toFixed(0)} km</span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/50">
              <h5 className="text-purple-400 font-semibold mb-3">Ground Track</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Direction:</span>
                  <span className="font-mono text-purple-400">{groundTrack.direction}</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Equator:</span>
                  <span className="font-mono text-cyan-400">
                    {new Date(groundTrack.nextEquatorCrossing).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Orbit Number:</span>
                  <span className="font-mono text-blue-400">{groundTrack.orbitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daylight:</span>
                  <span className={`font-mono ${groundTrack.daylight ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {groundTrack.daylight ? '☀️ Day' : '🌙 Night'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orbital' && issData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/50">
              <h5 className="text-indigo-400 font-semibold mb-3">Orbital Parameters</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Period:</span>
                  <span className="font-mono text-indigo-400">{issData.orbitalPeriod.toFixed(1)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Inclination:</span>
                  <span className="font-mono text-blue-400">{issData.inclination.toFixed(2)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Eccentricity:</span>
                  <span className="font-mono text-purple-400">{issData.eccentricity.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Apogee:</span>
                  <span className="font-mono text-green-400">{issData.apogee.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Perigee:</span>
                  <span className="font-mono text-yellow-400">{issData.perigee.toFixed(1)} km</span>
                </div>
              </div>
            </div>
            
            <div className="bg-cyan-900/30 p-4 rounded-xl border border-cyan-500/50">
              <h5 className="text-cyan-400 font-semibold mb-3">Mission Status</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Days in Orbit:</span>
                  <span className="font-mono text-cyan-400">{issData.daysInOrbit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Solar Array Angle:</span>
                  <span className="font-mono text-yellow-400">{issData.solarArrayAngle.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Beta Angle:</span>
                  <span className="font-mono text-orange-400">{issData.betaAngle.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Eclipse Duration:</span>
                  <span className="font-mono text-purple-400">{issData.eclipseDuration.toFixed(1)} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visibility' && visibility && (
        <div className="space-y-4">
          <h5 className="font-semibold text-lg mb-4">Visibility Information</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-yellow-900/30 p-4 rounded-xl border border-yellow-500/50">
              <h6 className="text-yellow-400 font-semibold mb-3">Current Visibility</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Visible:</span>
                  <span className={`font-bold ${visibility.isVisible ? 'text-green-400' : 'text-red-400'}`}>
                    {visibility.isVisible ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                {visibility.isVisible && (
                  <>
                    <div className="flex justify-between">
                      <span>Elevation:</span>
                      <span className="font-mono text-blue-400">{visibility.elevation.toFixed(1)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Azimuth:</span>
                      <span className="font-mono text-purple-400">{visibility.azimuth.toFixed(1)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Magnitude:</span>
                      <span className="font-mono text-yellow-400">{visibility.magnitude.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-green-900/30 p-4 rounded-xl border border-green-500/50">
              <h6 className="text-green-400 font-semibold mb-3">Next Pass</h6>
              {visibility.nextPass ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rise Time:</span>
                    <span className="font-mono text-green-400">
                      {new Date(visibility.nextPass.riseTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Elevation:</span>
                    <span className="font-mono text-blue-400">{visibility.nextPass.maxElevation.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-mono text-purple-400">{visibility.nextPass.duration.toFixed(1)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className={`font-bold ${getVisibilityQuality(visibility.nextPass.magnitude).color}`}>
                      {getVisibilityQuality(visibility.nextPass.magnitude).icon} {getVisibilityQuality(visibility.nextPass.magnitude).text}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No visible passes in the next 24 hours</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'crew' && crew && (
        <div className="space-y-4">
          <h5 className="font-semibold text-lg mb-4">Current Crew ({crew.totalCrew} members)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crew.crewMembers.map((member, index) => (
              <div key={index} className="bg-white/5 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{member.country === 'USA' ? '🇺🇸' : member.country === 'Russia' ? '🇷🇺' : '🌍'}</div>
                  <div>
                    <h6 className="font-semibold text-white">{member.name}</h6>
                    <p className="text-sm text-gray-300">{member.role}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Agency:</span>
                    <span className="text-blue-400">{member.agency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Launch:</span>
                    <span className="text-green-400">{member.launchDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days aboard:</span>
                    <span className="text-yellow-400">{member.daysAboard}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'experiments' && experiments && (
        <div className="space-y-4">
          <h5 className="font-semibold text-lg mb-4">Current Experiments ({experiments.totalExperiments})</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.experiments.slice(0, 6).map((exp, index) => (
              <div key={index} className="bg-white/5 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{exp.category === 'Biology' ? '🧬' : exp.category === 'Physics' ? '⚛️' : exp.category === 'Technology' ? '🔬' : '🌍'}</div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-white mb-1">{exp.title}</h6>
                    <p className="text-sm text-gray-300 mb-2">{exp.description}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-400">{exp.category}</span>
                      <span className="text-green-400">{exp.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Principal Investigator: {exp.principalInvestigator}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedISSPanel;