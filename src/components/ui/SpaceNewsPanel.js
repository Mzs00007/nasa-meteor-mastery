// Space News Panel Component
// Displays live space-related news with responsive design

import React, { useState, useEffect } from 'react';
import spaceNewsAPI from '../../services/spaceNewsAPI';

const SpaceNewsPanel = ({ 
  maxItems = 10, 
  showBreakingOnly = false, 
  autoRefresh = true,
  refreshInterval = 300000 // 5 minutes
}) => {
  const [news, setNews] = useState([]);
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch news data
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allNews, breaking] = await Promise.all([
        spaceNewsAPI.getCombinedNewsFeed(maxItems),
        spaceNewsAPI.getBreakingNews()
      ]);

      setNews(allNews);
      setBreakingNews(breaking);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch space news');
      console.error('Space news fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchNews();

    if (autoRefresh) {
      const interval = setInterval(fetchNews, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [maxItems, autoRefresh, refreshInterval]);

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  // Render news item
  const renderNewsItem = (item, index) => (
    <div
      key={item.id || index}
      className='group bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-cyan-500/50 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10'
    >
      <div className='flex flex-col sm:flex-row gap-3'>
        {/* Image */}
        {item.imageUrl && (
          <div className='flex-shrink-0'>
            <img
              src={item.imageUrl}
              alt={item.title}
              className='w-full sm:w-16 sm:h-16 object-cover rounded-lg bg-gray-700'
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-start justify-between gap-2 mb-2'>
            <h4 className='text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2'>
              {item.title}
            </h4>
            
            {/* Priority badge */}
            {item.priority && item.priority !== 'normal' && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(item.priority)}`}>
                {item.priority.toUpperCase()}
              </span>
            )}
          </div>

          {/* Summary */}
          <p className='text-xs text-gray-300 mb-3 line-clamp-2'>
            {item.summary}
          </p>

          {/* Meta information */}
          <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400'>
            <div className='flex items-center gap-3'>
              <span className='font-medium text-cyan-400'>{item.source}</span>
              {item.category && (
                <span className='px-2 py-1 bg-gray-700/50 rounded-full'>
                  {item.category}
                </span>
              )}
            </div>
            <span>{formatTimeAgo(item.publishedAt)}</span>
          </div>

          {/* Read more link */}
          <a
            href={item.url}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors'
          >
            Read more
            <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  const displayNews = activeTab === 'breaking' ? breakingNews : news;

  return (
    <div className='bg-gray-900/50 backdrop-blur-sm border border-gray-600/50 rounded-xl p-4 sm:p-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
        <div>
          <h3 className='text-lg font-bold text-white flex items-center gap-2'>
            <span className='text-2xl'>🚀</span>
            Live Space News
          </h3>
          {lastUpdated && (
            <p className='text-xs text-gray-400 mt-1'>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Tab controls */}
        <div className='flex bg-gray-800/50 rounded-lg p-1'>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-black shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            All News ({news.length})
          </button>
          <button
            onClick={() => setActiveTab('breaking')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'breaking'
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Breaking ({breakingNews.length})
          </button>
        </div>
      </div>

      {/* Refresh button */}
      <div className='flex justify-between items-center mb-4'>
        <div className='flex items-center gap-2'>
          {autoRefresh && (
            <div className='flex items-center gap-1 text-xs text-green-400'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              Auto-refresh enabled
            </div>
          )}
        </div>
        
        <button
          onClick={fetchNews}
          disabled={loading}
          className='px-3 py-1.5 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className='space-y-4'>
        {loading && news.length === 0 ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500'></div>
            <span className='ml-3 text-gray-400'>Loading space news...</span>
          </div>
        ) : error ? (
          <div className='text-center py-8'>
            <div className='text-red-400 mb-2'>⚠️ {error}</div>
            <button
              onClick={fetchNews}
              className='px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded-lg transition-all'
            >
              Try Again
            </button>
          </div>
        ) : displayNews.length === 0 ? (
          <div className='text-center py-8 text-gray-400'>
            <div className='text-4xl mb-2'>📡</div>
            <p>No {activeTab === 'breaking' ? 'breaking ' : ''}news available</p>
          </div>
        ) : (
          <div className='max-h-96 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800'>
            {displayNews.map(renderNewsItem)}
          </div>
        )}
      </div>

      {/* Footer */}
      {displayNews.length > 0 && (
        <div className='mt-4 pt-4 border-t border-gray-600/50 text-center'>
          <p className='text-xs text-gray-400'>
            Powered by Spaceflight News API & NASA Official Sources
          </p>
        </div>
      )}
    </div>
  );
};

export default SpaceNewsPanel;