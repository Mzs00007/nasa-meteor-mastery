/**
 * Enhanced Space Weather Panel Component
 * Displays comprehensive space weather data with detailed analysis
 */

import React, { useState, useEffect } from 'react';
import enhancedSpaceWeatherAPI from '../../services/enhancedSpaceWeatherAPI';

const EnhancedSpaceWeatherPanel = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchWeatherData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchWeatherData, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const [summary, forecastData] = await Promise.all([
        enhancedSpaceWeatherAPI.getSpaceWeatherSummary(),
        enhancedSpaceWeatherAPI.getSpaceWeatherForecast()
      ]);
      
      setWeatherData(summary);
      setForecast(forecastData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch space weather data');
      console.error('Space weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-900/30 border-red-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      case 'low': return 'text-green-400 bg-green-900/30 border-green-500/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  const getActivityLevelIcon = (level) => {
    switch (level) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      case 'elevated': return '🟠';
      case 'normal': return '🟢';
      default: return '⚪';
    }
  };

  if (loading && !weatherData) {
    return (
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
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
        <h3 className="text-xl font-bold text-red-400 mb-2">⚠️ Space Weather Error</h3>
        <p className="text-red-300">{error}</p>
        <button 
          onClick={fetchWeatherData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ☀️ Enhanced Space Weather
          </h3>
          <p className="text-gray-300 text-sm">
            Last updated: {weatherData ? new Date(weatherData.lastUpdated).toLocaleTimeString() : 'Unknown'}
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
            onClick={fetchWeatherData}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Alert Level */}
      {weatherData && (
        <div className={`p-4 rounded-xl border-2 mb-6 ${getAlertLevelColor(weatherData.alertLevel)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg">
                Current Alert Level: {weatherData.alertLevel.toUpperCase()}
              </h4>
              {weatherData.alertReasons.length > 0 && (
                <ul className="text-sm mt-2 space-y-1">
                  {weatherData.alertReasons.map((reason, index) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-3xl">
              {getActivityLevelIcon(weatherData.alertLevel)}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['summary', 'flares', 'storms', 'forecast'].map((tab) => (
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
      {activeTab === 'summary' && weatherData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-900/30 p-4 rounded-xl border border-orange-500/50">
              <h5 className="text-orange-400 font-semibold mb-2">
                {getActivityLevelIcon(weatherData.overallActivity.solarActivity)} Solar Activity
              </h5>
              <p className="text-lg font-bold capitalize">{weatherData.overallActivity.solarActivity}</p>
              <p className="text-sm text-gray-300">
                {weatherData.solarFlares.summary.total} flares (7 days)
              </p>
            </div>
            
            <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/50">
              <h5 className="text-purple-400 font-semibold mb-2">
                {getActivityLevelIcon(weatherData.overallActivity.geomagneticActivity)} Geomagnetic
              </h5>
              <p className="text-lg font-bold capitalize">{weatherData.overallActivity.geomagneticActivity}</p>
              <p className="text-sm text-gray-300">
                Kp: {weatherData.geomagneticStorms.summary.currentKp || 'N/A'}
              </p>
            </div>
            
            <div className="bg-cyan-900/30 p-4 rounded-xl border border-cyan-500/50">
              <h5 className="text-cyan-400 font-semibold mb-2">
                {getActivityLevelIcon(weatherData.overallActivity.radiationActivity)} Radiation
              </h5>
              <p className="text-lg font-bold capitalize">{weatherData.overallActivity.radiationActivity}</p>
              <p className="text-sm text-gray-300">
                {weatherData.radiationBeltEnhancements.summary.total} events
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'flares' && weatherData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-red-900/30 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-400">
                {weatherData.solarFlares.summary.xClass}
              </div>
              <div className="text-sm text-gray-300">X-Class</div>
            </div>
            <div className="bg-orange-900/30 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-400">
                {weatherData.solarFlares.summary.mClass}
              </div>
              <div className="text-sm text-gray-300">M-Class</div>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {weatherData.solarFlares.summary.cClass}
              </div>
              <div className="text-sm text-gray-300">C-Class</div>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">
                {weatherData.solarFlares.summary.total}
              </div>
              <div className="text-sm text-gray-300">Total</div>
            </div>
          </div>
          
          {weatherData.solarFlares.summary.mostRecent && (
            <div className="bg-white/5 p-4 rounded-xl">
              <h5 className="font-semibold mb-2">Most Recent Flare</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Class: <span className="font-mono text-orange-400">{weatherData.solarFlares.summary.mostRecent.classType}</span></div>
                <div>Peak: <span className="font-mono text-blue-400">{new Date(weatherData.solarFlares.summary.mostRecent.peakTime).toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'storms' && weatherData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-500/50">
              <h5 className="text-purple-400 font-semibold mb-2">Geomagnetic Storms</h5>
              <div className="space-y-2 text-sm">
                <div>Total (7 days): <span className="font-bold">{weatherData.geomagneticStorms.summary.total}</span></div>
                <div>Severe storms: <span className="font-bold text-red-400">{weatherData.geomagneticStorms.summary.severeStorms}</span></div>
                <div>Current Kp: <span className="font-bold text-yellow-400">{weatherData.geomagneticStorms.summary.currentKp || 'N/A'}</span></div>
              </div>
            </div>
            
            <div className="bg-cyan-900/30 p-4 rounded-xl border border-cyan-500/50">
              <h5 className="text-cyan-400 font-semibold mb-2">Coronal Mass Ejections</h5>
              <div className="space-y-2 text-sm">
                <div>Total CMEs: <span className="font-bold">{weatherData.coronalMassEjections.summary.total}</span></div>
                <div>Earth-directed: <span className="font-bold text-orange-400">{weatherData.coronalMassEjections.summary.withEarthImpact}</span></div>
                <div>Avg Speed: <span className="font-bold text-blue-400">{weatherData.coronalMassEjections.summary.averageSpeed.toFixed(0)} km/s</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'forecast' && forecast && (
        <div className="space-y-4">
          <h5 className="font-semibold text-lg mb-4">7-Day Space Weather Forecast</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {forecast.forecast.slice(0, 6).map((day, index) => (
              <div key={index} className="bg-white/5 p-3 rounded-lg">
                <div className="font-semibold text-sm mb-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Solar:</span>
                    <span className={day.solarActivity === 'elevated' ? 'text-orange-400' : 'text-green-400'}>
                      {getActivityLevelIcon(day.solarActivity)} {day.solarActivity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geomagnetic:</span>
                    <span className={day.geomagneticActivity === 'elevated' ? 'text-purple-400' : 'text-green-400'}>
                      {getActivityLevelIcon(day.geomagneticActivity)} {day.geomagneticActivity}
                    </span>
                  </div>
                  {day.auroraVisibility.latitude && (
                    <div className="text-cyan-400">
                      Aurora: {day.auroraVisibility.latitude.toFixed(0)}°N
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-4">
            Confidence: {forecast.confidence} | Source: {forecast.source}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSpaceWeatherPanel;