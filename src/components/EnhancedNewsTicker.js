import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SpaceNewsService from '../services/SpaceNewsService';

const EnhancedNewsTicker = () => {
  const [news, setNews] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [displayMode, setDisplayMode] = useState('ticker'); // 'ticker', 'cards', 'list'
  const [selectedSource, setSelectedSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const newsServiceRef = useRef(null);
  const tickerRef = useRef(null);
  const intervalRef = useRef(null);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleConnectionChange = useCallback((status) => {
    setConnectionStatus(status);
  }, []);

  const handleNewsUpdate = useCallback((newsData) => {
    setNews(newsData);
    setLoading(false);
    if (newsData.length === 0) {
      setError('No news available from any source');
    } else {
      setError(null);
    }
    
    // Show notice if using mock data
    if (newsServiceRef.current) {
      const dataMode = newsServiceRef.current.getDataMode();
      if (dataMode && dataMode.useMockData) {
        console.log('📡 Space News: Using demonstration data due to CORS limitations');
      }
    }
  }, []);

  // Initialize news service only once
  useEffect(() => {
    if (!newsServiceRef.current) {
      newsServiceRef.current = new SpaceNewsService();
      
      // Set up event listeners with memoized callbacks
      newsServiceRef.current.onConnectionChange(handleConnectionChange);
      newsServiceRef.current.onNewsUpdate(handleNewsUpdate);
    }

    // Cleanup on unmount
    return () => {
      if (newsServiceRef.current) {
        newsServiceRef.current.destroy();
        newsServiceRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [handleConnectionChange, handleNewsUpdate]);

  // Separate effect for ticker interval management
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up new interval only if conditions are met
    if (isPlaying && news.length > 0 && displayMode === 'ticker') {
      intervalRef.current = setInterval(() => {
        setCurrentNewsIndex((prev) => (prev + 1) % news.length);
      }, 5000); // Change every 5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, news.length, displayMode]);

  const getConnectionIndicator = (apiKey) => {
    const status = connectionStatus[apiKey];
    if (!status) return null;

    const getStatusColor = () => {
      switch (status.status) {
        case 'connected': return 'bg-green-500';
        case 'disconnected': return 'bg-red-500';
        case 'error': return 'bg-yellow-500';
        default: return 'bg-gray-500';
      }
    };

    const getStatusText = () => {
      switch (status.status) {
        case 'connected': return `Connected (${status.responseTime}ms)`;
        case 'disconnected': return 'Disconnected';
        case 'error': return `Error: ${status.error}`;
        default: return 'Unknown';
      }
    };

    return (
      <div className="flex items-center space-x-2 text-xs">
        <div 
          className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}
          title={getStatusText()}
        />
        <span className="text-gray-300">{status.name}</span>
      </div>
    );
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getImportanceBadge = (importance) => {
    if (importance >= 15) return { color: 'bg-red-500', text: 'CRITICAL' };
    if (importance >= 10) return { color: 'bg-orange-500', text: 'HIGH' };
    if (importance >= 5) return { color: 'bg-yellow-500', text: 'MEDIUM' };
    return { color: 'bg-blue-500', text: 'LOW' };
  };

  // Memoized button handlers to prevent lag
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleDisplayModeChange = useCallback((mode) => {
    setDisplayMode(mode);
    setCurrentNewsIndex(0); // Reset to first item when changing modes
  }, []);

  const handleSourceChange = useCallback((event) => {
    setSelectedSource(event.target.value);
    setCurrentNewsIndex(0); // Reset to first item when changing source
  }, []);

  // Memoized filtered news to prevent recalculation on every render
  const filteredNews = useMemo(() => {
    if (selectedSource === 'all') return news;
    return news.filter(item => item.apiSource === selectedSource);
  }, [news, selectedSource]);

  const renderTicker = () => {
    if (filteredNews.length === 0) return null;

    const currentNews = filteredNews[currentNewsIndex % filteredNews.length];
    const badge = getImportanceBadge(currentNews.importance);

    return (
      <div className="relative overflow-hidden bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-bold text-white ${badge.color}`}>
              {badge.text}
            </span>
            <span className="text-orange-400 text-sm font-semibold">
              {currentNews.source}
            </span>
            <span className="text-gray-400 text-xs">
              {formatTimeAgo(currentNews.publishedAt)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayPause}
              className="text-orange-400 hover:text-orange-300 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span className="text-gray-400 text-xs">
              {currentNewsIndex + 1} / {filteredNews.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-white font-semibold text-lg leading-tight">
            {currentNews.title}
          </h3>
          <p className="text-gray-300 text-sm line-clamp-2">
            {currentNews.summary}
          </p>
          {currentNews.url && (
            <a
              href={currentNews.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-orange-400 hover:text-orange-300 text-sm transition-colors"
            >
              Read more →
            </a>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
          <div 
            className="h-full bg-orange-500 transition-all duration-100"
            style={{ 
              width: isPlaying ? '100%' : '0%',
              animation: isPlaying ? 'progress 5s linear infinite' : 'none'
            }}
          />
        </div>
      </div>
    );
  };

  const renderCards = () => {
    const displayNews = filteredNews.slice(0, 6);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayNews.map((item, index) => {
          const badge = getImportanceBadge(item.importance);
          return (
            <div 
              key={item.id}
              className="bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-4 hover:border-orange-400/50 transition-all duration-300"
            >
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-32 object-cover rounded mb-3"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${badge.color}`}>
                  {badge.text}
                </span>
                <span className="text-gray-400 text-xs">
                  {formatTimeAgo(item.publishedAt)}
                </span>
              </div>
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-gray-300 text-xs mb-3 line-clamp-3">
                {item.summary}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-orange-400 text-xs">{item.source}</span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-xs transition-colors"
                  >
                    Read →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderList = () => {
    const displayNews = filteredNews.slice(0, 10);
    
    return (
      <div className="space-y-2">
        {displayNews.map((item, index) => {
          const badge = getImportanceBadge(item.importance);
          return (
            <div 
              key={item.id}
              className="bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-3 hover:border-orange-400/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold text-white ${badge.color}`}>
                      {badge.text}
                    </span>
                    <span className="text-orange-400 text-xs">{item.source}</span>
                    <span className="text-gray-400 text-xs">
                      {formatTimeAgo(item.publishedAt)}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-xs line-clamp-2">
                    {item.summary}
                  </p>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 text-xs ml-3 transition-colors"
                  >
                    Read →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          <span className="text-white">Loading space news...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls and connection status */}
      <div className="bg-black/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Connection Status */}
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-white font-bold text-lg">🚀 Live Space News</h2>
            <div className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full">
              <span className="text-xs text-blue-300">DEMO MODE</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {Object.keys(connectionStatus).map(apiKey => 
                getConnectionIndicator(apiKey)
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedSource}
              onChange={handleSourceChange}
              className="bg-black/50 border border-orange-500/30 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Sources</option>
              <option value="spaceflightNews">Spaceflight News</option>
              <option value="nasa">NASA</option>
              <option value="spacex">SpaceX</option>
            </select>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDisplayModeChange('ticker')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  displayMode === 'ticker' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-black/50 text-gray-300 hover:text-white'
                }`}
              >
                Ticker
              </button>
              <button
                onClick={() => handleDisplayModeChange('cards')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  displayMode === 'cards' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-black/50 text-gray-300 hover:text-white'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => handleDisplayModeChange('list')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  displayMode === 'list' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-black/50 text-gray-300 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* News Display */}
      {error ? (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      ) : (
        <>
          {displayMode === 'ticker' && renderTicker()}
          {displayMode === 'cards' && renderCards()}
          {displayMode === 'list' && renderList()}
        </>
      )}

      {/* Last updated info */}
      <div className="text-center text-gray-400 text-xs">
        Last updated: {new Date().toLocaleTimeString()} • 
        Showing {filteredNews.length} articles • 
        Auto-refresh every 5 minutes
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EnhancedNewsTicker;