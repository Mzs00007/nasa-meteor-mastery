import React, { useState, useEffect, useCallback } from 'react';

import { liveAsteroidService } from '../services/liveAsteroidService';



const LiveAsteroidData = ({ onAsteroidSelect, selectedAsteroidId }) => {
  const [liveData, setLiveData] = useState({
    asteroids: [],
    closeApproaches: [],
    potentiallyHazardous: [],
    lastUpdate: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, hazardous, close
  const [sortBy, setSortBy] = useState('diameter'); // diameter, velocity, distance
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [dataStatus, setDataStatus] = useState({});
  const [cacheStatus, setCacheStatus] = useState({});
  const [isWarmingCache, setIsWarmingCache] = useState(false);

  // Subscribe to live data updates
  useEffect(() => {
    const unsubscribe = liveAsteroidService.subscribe(data => {
      setLiveData(data);
      setLoading(false);
      setError(null);
    });

    // Get initial status
    setDataStatus(liveAsteroidService.getDataStatus());

    // Update status periodically
    const statusInterval = setInterval(() => {
      setDataStatus(liveAsteroidService.getDataStatus());
      // Get cache status from NASA service
      if (
        liveAsteroidService.nasaService &&
        liveAsteroidService.nasaService.getRateLimitStatus
      ) {
        setCacheStatus(liveAsteroidService.nasaService.getRateLimitStatus());
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  // Handle auto-update toggle
  useEffect(() => {
    liveAsteroidService.autoUpdateEnabled = autoUpdate;
  }, [autoUpdate]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await liveAsteroidService.fetchLiveAsteroidData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cache warming
  const handleWarmCache = useCallback(async () => {
    setIsWarmingCache(true);
    try {
      if (
        liveAsteroidService.nasaService &&
        liveAsteroidService.nasaService.preloadCache
      ) {
        await liveAsteroidService.nasaService.preloadCache();
      }
    } catch (err) {
      console.warn('Error warming cache:', err);
    } finally {
      setIsWarmingCache(false);
    }
  }, []);

  // Filter and sort asteroids
  const getFilteredAsteroids = useCallback(() => {
    let filtered = [...liveData.asteroids];

    // Apply filter
    switch (filter) {
      case 'hazardous':
        filtered = filtered.filter(a => a.isPotentiallyHazardous);
        break;
      case 'close':
        filtered = filtered.filter(
          a => a.missDistance && a.missDistance.au < 0.1
        );
        break;
      default:
        // Show all
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'velocity':
          return b.velocity - a.velocity;
        case 'distance':
          if (!a.missDistance || !b.missDistance) {
            return 0;
          }
          return a.missDistance.au - b.missDistance.au;
        case 'diameter':
        default:
          return b.diameter - a.diameter;
      }
    });

    return filtered;
  }, [liveData.asteroids, filter, sortBy]);

  // Format distance for display
  const formatDistance = missDistance => {
    if (!missDistance) {
      return 'Unknown';
    }

    if (missDistance.au < 0.01) {
      return `${(missDistance.km / 1000).toFixed(0)}k km`;
    } else if (missDistance.au < 1) {
      return `${missDistance.lunar.toFixed(1)} LD`; // Lunar distances
    }
    return `${missDistance.au.toFixed(3)} AU`;
  };

  // Format date for display
  const formatDate = dateString => {
    if (!dateString) {
      return 'Unknown';
    }
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Get risk level color
  const getRiskLevel = asteroid => {
    if (asteroid.isPotentiallyHazardous) {
      if (asteroid.missDistance && asteroid.missDistance.au < 0.05) {
        return 'high';
      }
      return 'medium';
    }
    return 'low';
  };

  const getRiskColor = level => {
    switch (level) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const filteredAsteroids = getFilteredAsteroids();

  if (loading && liveData.asteroids.length === 0) {
    return (
      <div 
        className='p-6'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className='flex items-center justify-center space-x-3'>
          <div 
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid #60a5fa',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span className='text-white/80'>
            Loading live asteroid data from NASA...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with controls */}
      <div 
        className='p-6'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
          <div>
            <h2 className='text-2xl font-bold text-white mb-2'>
              🌌 Live Asteroid Data
            </h2>
            <p className='text-white/70'>
              Real-time data from NASA's Near Earth Object Web Service
            </p>
          </div>

          <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4'>
            <label className='flex items-center space-x-2 cursor-pointer'>
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
                className="sr-only"
              />
              <div 
                style={{
                  width: '44px',
                  height: '24px',
                  background: autoUpdate ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <div 
                  style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '1px',
                    left: autoUpdate ? '22px' : '1px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                  }}
                />
              </div>
              <span className='text-white text-sm'>Auto Update</span>
            </label>

            <button
              onClick={handleWarmCache}
              disabled={isWarmingCache || cacheStatus.remainingRequests <= 0}
              className='flex items-center space-x-2'
              title='Preload commonly used data to improve performance'
              style={{
                padding: '8px 16px',
                background: (isWarmingCache || cacheStatus.remainingRequests <= 0) 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: (isWarmingCache || cacheStatus.remainingRequests <= 0) ? 'rgba(255, 255, 255, 0.5)' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (isWarmingCache || cacheStatus.remainingRequests <= 0) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!isWarmingCache && cacheStatus.remainingRequests > 0) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <span>{isWarmingCache ? '⏳' : '🔥'}</span>
              <span>{isWarmingCache ? 'Warming...' : 'Warm Cache'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className='flex items-center space-x-2'
              title="Refresh asteroid data from NASA's Near Earth Object Web Service"
              style={{
                padding: '8px 16px',
                background: loading 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: loading ? 'rgba(255, 255, 255, 0.5)' : 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
              }}
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6'>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='text-2xl mb-2'>🪨</div>
            <div className='text-white font-bold text-lg'>{liveData.asteroids.length}</div>
            <div className='text-white/70 text-sm'>Total Asteroids</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='text-2xl mb-2'>🎯</div>
            <div className='text-white font-bold text-lg'>{liveData.closeApproaches.length}</div>
            <div className='text-white/70 text-sm'>Close Approaches</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='text-2xl mb-2'>⚠️</div>
            <div className='text-white font-bold text-lg'>{liveData.potentiallyHazardous.length}</div>
            <div className='text-white/70 text-sm'>Potentially Hazardous</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='text-2xl mb-2'>🕒</div>
            <div className='text-white font-bold text-lg'>
              {liveData.lastUpdate
                ? new Date(liveData.lastUpdate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Never'}
            </div>
            <div className='text-white/70 text-sm'>Last Update</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='text-2xl mb-2'>🔢</div>
            <div className='text-white font-bold text-lg'>{cacheStatus.remainingRequests || 'Unknown'}</div>
            <div className='text-white/70 text-sm'>API Requests Left</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className='text-2xl mb-2'>⏳</div>
            <div className='text-white font-bold text-lg'>{cacheStatus.queueLength || 0}</div>
            <div className='text-white/70 text-sm'>Queue Length</div>
          </div>
        </div>

        {error && (
          <div className='mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg'>
            <p className='text-red-300'>⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Filters and sorting */}
      <div 
        className='p-4'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
          <div className='flex flex-wrap gap-2'>
            <span className='text-white/70 text-sm'>Filter:</span>
            {['all', 'hazardous', 'close'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                title={
                  filterType === 'all'
                    ? 'Show all asteroids'
                    : filterType === 'hazardous'
                      ? 'Show only potentially hazardous asteroids'
                      : 'Show only asteroids with close approaches'
                }
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  filter === filterType
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          <div className='flex items-center space-x-2'>
            <span className='text-white/70 text-sm'>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className='bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-blue-500/50'
            >
              <option value='diameter'>Diameter</option>
              <option value='velocity'>Velocity</option>
              <option value='distance'>Distance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asteroid list */}
      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
        {filteredAsteroids.map(asteroid => {
          const riskLevel = getRiskLevel(asteroid);
          const isSelected = selectedAsteroidId === asteroid.id;

          return (
            <div
              key={asteroid.id}
              className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''
              }`}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
              onClick={() => onAsteroidSelect?.(asteroid)}
            >
              <div className='space-y-3'>
                {/* Header */}
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold text-white text-lg truncate'>
                      {asteroid.name}
                    </h3>
                    <p className='text-white/60 text-sm'>ID: {asteroid.id}</p>
                  </div>

                  <div
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      riskLevel === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : riskLevel === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {riskLevel.toUpperCase()}
                  </div>
                </div>

                {/* Key metrics */}
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <span className='text-white/60'>Diameter:</span>
                    <div className='text-white font-medium'>
                      {asteroid.diameter}m
                    </div>
                  </div>

                  <div>
                    <span className='text-white/60'>Velocity:</span>
                    <div className='text-white font-medium'>
                      {asteroid.velocity.toFixed(1)} km/s
                    </div>
                  </div>

                  {asteroid.missDistance && (
                    <>
                      <div>
                        <span className='text-white/60'>Distance:</span>
                        <div className='text-white font-medium'>
                          {formatDistance(asteroid.missDistance)}
                        </div>
                      </div>

                      <div>
                        <span className='text-white/60'>Approach:</span>
                        <div className='text-white font-medium text-xs'>
                          {formatDate(asteroid.approachDate)}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Additional info */}
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-white/60'>
                    {asteroid.orbitClass || 'Unknown Class'}
                  </span>

                  {asteroid.isPotentiallyHazardous && (
                    <span className='text-yellow-400'>⚠️ PHA</span>
                  )}
                </div>

                {/* Action button */}
                <button
                  className='w-full mt-3'
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    onAsteroidSelect?.(asteroid);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  Use for Simulation
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAsteroids.length === 0 && !loading && (
        <div 
          className='p-8 text-center'
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className='text-white/60'>
            <div className='text-4xl mb-4'>🔍</div>
            <h3 className='text-xl font-medium mb-2'>No asteroids found</h3>
            <p>Try adjusting your filters or refresh the data.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAsteroidData;
