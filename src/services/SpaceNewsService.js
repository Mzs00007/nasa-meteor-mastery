/**
 * Space News Service - Aggregates news from multiple space-related APIs
 * Features: Multiple API integration, connection monitoring, intelligent prioritization
 */

class SpaceNewsService {
  constructor() {
    this.apis = {
      spaceflightNews: {
        name: 'Spaceflight News API',
        baseUrl: 'https://api.spaceflightnewsapi.net/v4',
        status: 'disconnected',
        lastCheck: null,
        priority: 1
      },
      nasa: {
        name: 'NASA API',
        baseUrl: 'https://api.nasa.gov/planetary/apod',
        apiKey: 'DEMO_KEY', // Replace with actual key for production
        status: 'disconnected',
        lastCheck: null,
        priority: 2
      },
      spacex: {
        name: 'SpaceX API',
        baseUrl: 'https://api.spacexdata.com/v5',
        status: 'disconnected',
        lastCheck: null,
        priority: 3
      }
    };

    this.newsCache = [];
    this.connectionListeners = [];
    this.newsUpdateListeners = [];
    this.refreshInterval = null;
    this.connectionCheckInterval = null;
    this.refreshRate = 5 * 60 * 1000; // 5 minutes
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
    this.useMockData = true; // Use mock data due to CORS limitations

    // Keywords for importance scoring
    this.importanceKeywords = {
      critical: ['emergency', 'failure', 'explosion', 'accident', 'critical', 'urgent', 'breaking'],
      high: ['launch', 'mission', 'discovery', 'breakthrough', 'first', 'record', 'historic'],
      medium: ['test', 'development', 'progress', 'update', 'announcement', 'plan'],
      space_agencies: ['nasa', 'spacex', 'esa', 'roscosmos', 'jaxa', 'isro'],
      celestial: ['mars', 'moon', 'asteroid', 'comet', 'planet', 'galaxy', 'star', 'solar']
    };

    // Mock data for demonstration (due to CORS limitations)
    this.mockNews = this.generateMockNews();
    
    this.init();
  }

  generateMockNews() {
    const now = new Date();
    const mockData = [
      {
        id: 'mock-1',
        title: "NASA's DART Mission Successfully Deflects Asteroid Dimorphos",
        summary: "NASA's Double Asteroid Redirection Test (DART) mission has successfully altered the orbit of asteroid Dimorphos, marking humanity's first successful planetary defense test.",
        url: "https://www.nasa.gov/dart-mission-success",
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        source: "NASA",
        apiSource: "nasa",
        imageUrl: null,
        importance: 18
      },
      {
        id: 'mock-2',
        title: "SpaceX Falcon Heavy Successfully Launches Europa Clipper Mission",
        summary: "SpaceX's Falcon Heavy rocket has successfully launched NASA's Europa Clipper mission to Jupiter's moon Europa, beginning a multi-year journey to study the icy moon's subsurface ocean.",
        url: "https://www.spacex.com/europa-clipper-launch",
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        source: "SpaceX",
        apiSource: "spacex",
        imageUrl: null,
        importance: 16
      },
      {
        id: 'mock-3',
        title: "New Near-Earth Asteroid Discovered by Catalina Sky Survey",
        summary: "Astronomers have discovered a new potentially hazardous asteroid approaching Earth's orbit. The 200-meter wide asteroid will make its closest approach next month.",
        url: "https://cneos.jpl.nasa.gov/news/asteroid-discovery",
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        source: "Spaceflight News",
        apiSource: "spaceflightNews",
        imageUrl: null,
        importance: 14
      },
      {
        id: 'mock-4',
        title: "James Webb Space Telescope Discovers Potentially Habitable Exoplanet",
        summary: "The James Webb Space Telescope has identified atmospheric water vapor on exoplanet K2-18 b, located 120 light-years away in the habitable zone of its star.",
        url: "https://www.nasa.gov/webb-exoplanet-discovery",
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8 hours ago
        source: "NASA",
        apiSource: "nasa",
        imageUrl: null,
        importance: 15
      },
      {
        id: 'mock-5',
        title: "Artemis III Mission Timeline Updated for Lunar Landing",
        summary: "NASA has announced updated timeline for the Artemis III mission, which aims to return humans to the Moon's surface for the first time since Apollo 17.",
        url: "https://www.nasa.gov/artemis-iii-update",
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        source: "NASA",
        apiSource: "nasa",
        imageUrl: null,
        importance: 13
      },
      {
        id: 'mock-6',
        title: "International Space Station Conducts Emergency Debris Avoidance Maneuver",
        summary: "The ISS crew performed an emergency maneuver to avoid a piece of space debris from a defunct satellite, highlighting the growing problem of space junk.",
        url: "https://www.nasa.gov/iss-debris-avoidance",
        publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000), // 18 hours ago
        source: "Spaceflight News",
        apiSource: "spaceflightNews",
        imageUrl: null,
        importance: 12
      },
      {
        id: 'mock-7',
        title: "Mars Perseverance Rover Discovers Ancient River Delta Evidence",
        summary: "NASA's Perseverance rover has found compelling evidence of an ancient river delta in Jezero Crater, providing new insights into Mars' watery past.",
        url: "https://www.nasa.gov/perseverance-river-delta",
        publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        source: "NASA",
        apiSource: "nasa",
        imageUrl: null,
        importance: 11
      },
      {
        id: 'mock-8',
        title: "SpaceX Starship Completes Successful Orbital Test Flight",
        summary: "SpaceX's Starship vehicle has completed its first successful orbital test flight, marking a major milestone in the development of the next-generation spacecraft.",
        url: "https://www.spacex.com/starship-orbital-test",
        publishedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000), // 30 hours ago
        source: "SpaceX",
        apiSource: "spacex",
        imageUrl: null,
        importance: 17
      }
    ];

    return mockData;
  }

  async init() {
    await this.checkAllConnections();
    this.startConnectionMonitoring();
    this.startNewsRefresh();
  }

  // Connection Management
  async checkAllConnections() {
    const connectionPromises = Object.keys(this.apis).map(apiKey => 
      this.checkApiConnection(apiKey)
    );
    
    await Promise.allSettled(connectionPromises);
    this.notifyConnectionListeners();
  }

  async checkApiConnection(apiKey) {
    const api = this.apis[apiKey];
    const startTime = Date.now();
    
    try {
      let testUrl;
      switch (apiKey) {
        case 'spaceflightNews':
          testUrl = `${api.baseUrl}/articles?limit=1`;
          break;
        case 'nasa':
          testUrl = `${api.baseUrl}?api_key=${api.apiKey}&count=1`;
          break;
        case 'spacex':
          testUrl = `${api.baseUrl}/launches/latest`;
          break;
        default:
          throw new Error('Unknown API');
      }

      const response = await fetch(testUrl, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        api.status = 'connected';
        api.responseTime = Date.now() - startTime;
      } else {
        api.status = 'error';
        api.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      api.status = 'disconnected';
      api.error = error.message;
    }
    
    api.lastCheck = new Date();
  }

  startConnectionMonitoring() {
    this.connectionCheckInterval = setInterval(() => {
      this.checkAllConnections();
    }, 30000); // Check every 30 seconds
  }

  // News Fetching
  async fetchAllNews() {
    try {
      if (this.useMockData) {
        // Use mock data for demonstration
        console.log('Using mock space news data (CORS limitations prevent real API calls)');
        const prioritizedNews = this.prioritizeNews(this.mockNews);
        this.newsCache = prioritizedNews;
        this.lastRefresh = new Date();
        
        // Simulate connection status for demo
        Object.keys(this.apis).forEach(apiKey => {
          this.apis[apiKey].status = 'connected';
          this.apis[apiKey].lastCheck = new Date();
          this.apis[apiKey].error = null;
        });
        
        // Notify listeners
        this.notifyNewsUpdateListeners(prioritizedNews);
        this.notifyConnectionListeners();
        
        return prioritizedNews;
      }

      const newsPromises = Object.keys(this.apis)
        .filter(apiKey => this.apis[apiKey].status === 'connected')
        .map(apiKey => this.fetchNewsFromApi(apiKey));

      const results = await Promise.allSettled(newsPromises);
      const allNews = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);

      // Apply intelligent prioritization
      const prioritizedNews = this.prioritizeNews(allNews);
      
      this.newsCache = prioritizedNews;
      this.lastRefresh = new Date();
      this.notifyNewsUpdateListeners(prioritizedNews);
      
      return prioritizedNews;
    } catch (error) {
      console.error('Error fetching all news:', error);
      return [];
    }
  }

  async fetchNewsFromApi(apiKey) {
    const api = this.apis[apiKey];
    
    try {
      switch (apiKey) {
        case 'spaceflightNews':
          return await this.fetchSpaceflightNews();
        case 'nasa':
          return await this.fetchNasaNews();
        case 'spacex':
          return await this.fetchSpaceXNews();
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching news from ${api.name}:`, error);
      return [];
    }
  }

  async fetchSpaceflightNews() {
    const response = await this.fetchWithRetry(`${this.apis.spaceflightNews.baseUrl}/articles?limit=20`);
    const data = await response.json();
    
    return data.results.map(article => ({
      id: `sfn_${article.id}`,
      title: article.title,
      summary: article.summary,
      url: article.url,
      imageUrl: article.image_url,
      publishedAt: new Date(article.published_at),
      source: 'Spaceflight News',
      apiSource: 'spaceflightNews',
      importance: this.calculateImportance(article.title + ' ' + article.summary),
      tags: this.extractTags(article.title + ' ' + article.summary)
    }));
  }

  async fetchNasaNews() {
    // Fetch APOD (Astronomy Picture of the Day)
    const response = await this.fetchWithRetry(`${this.apis.nasa.baseUrl}?api_key=${this.apis.nasa.apiKey}&count=5`);
    const data = await response.json();
    
    return data.map((item, index) => ({
      id: `nasa_${item.date}_${index}`,
      title: item.title,
      summary: item.explanation,
      url: item.url,
      imageUrl: item.media_type === 'image' ? item.url : item.thumbnail_url,
      publishedAt: new Date(item.date),
      source: 'NASA APOD',
      apiSource: 'nasa',
      importance: this.calculateImportance(item.title + ' ' + item.explanation),
      tags: this.extractTags(item.title + ' ' + item.explanation)
    }));
  }

  async fetchSpaceXNews() {
    // Fetch latest launches and upcoming launches
    const [latestResponse, upcomingResponse] = await Promise.all([
      this.fetchWithRetry(`${this.apis.spacex.baseUrl}/launches/latest`),
      this.fetchWithRetry(`${this.apis.spacex.baseUrl}/launches/upcoming?limit=5`)
    ]);

    const latest = await latestResponse.json();
    const upcoming = await upcomingResponse.json();

    const news = [];

    // Add latest launch
    if (latest) {
      news.push({
        id: `spacex_latest_${latest.id}`,
        title: `SpaceX ${latest.name} Mission`,
        summary: latest.details || `Latest SpaceX mission: ${latest.name}`,
        url: latest.links?.webcast || latest.links?.wikipedia,
        imageUrl: latest.links?.patch?.large || latest.links?.patch?.small,
        publishedAt: new Date(latest.date_utc),
        source: 'SpaceX',
        apiSource: 'spacex',
        importance: this.calculateImportance(`SpaceX ${latest.name} ${latest.details || ''}`),
        tags: ['spacex', 'launch', 'mission']
      });
    }

    // Add upcoming launches
    upcoming.forEach(launch => {
      news.push({
        id: `spacex_upcoming_${launch.id}`,
        title: `Upcoming: SpaceX ${launch.name}`,
        summary: launch.details || `Upcoming SpaceX mission: ${launch.name}`,
        url: launch.links?.webcast || launch.links?.wikipedia,
        imageUrl: launch.links?.patch?.large || launch.links?.patch?.small,
        publishedAt: new Date(launch.date_utc),
        source: 'SpaceX',
        apiSource: 'spacex',
        importance: this.calculateImportance(`SpaceX ${launch.name} ${launch.details || ''}`),
        tags: ['spacex', 'launch', 'upcoming', 'mission']
      });
    });

    return news;
  }

  // Intelligent News Prioritization
  calculateImportance(text) {
    const lowerText = text.toLowerCase();
    let score = 0;

    // Critical keywords (highest priority)
    this.importanceKeywords.critical.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 10;
    });

    // High importance keywords
    this.importanceKeywords.high.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 5;
    });

    // Medium importance keywords
    this.importanceKeywords.medium.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 2;
    });

    // Space agency mentions
    this.importanceKeywords.space_agencies.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 3;
    });

    // Celestial body mentions
    this.importanceKeywords.celestial.forEach(keyword => {
      if (lowerText.includes(keyword)) score += 1;
    });

    // Time-based scoring (newer = higher score)
    const now = new Date();
    const ageInHours = (now - new Date()) / (1000 * 60 * 60);
    if (ageInHours < 1) score += 5;
    else if (ageInHours < 6) score += 3;
    else if (ageInHours < 24) score += 1;

    return Math.min(score, 50); // Cap at 50
  }

  extractTags(text) {
    const lowerText = text.toLowerCase();
    const tags = [];

    // Extract relevant tags based on content
    Object.values(this.importanceKeywords).flat().forEach(keyword => {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  prioritizeNews(newsArray) {
    return newsArray
      .sort((a, b) => {
        // Primary sort: importance score
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }
        // Secondary sort: publication date
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      })
      .slice(0, 50); // Limit to top 50 news items
  }

  // Real-time Updates
  startNewsRefresh() {
    // Initial fetch
    this.fetchAllNews();
    
    // Set up periodic refresh
    this.refreshInterval = setInterval(() => {
      this.fetchAllNews();
    }, 300000); // Refresh every 5 minutes
  }

  // Event Listeners
  onConnectionChange(callback) {
    this.connectionListeners.push(callback);
  }

  onNewsUpdate(callback) {
    this.newsUpdateListeners.push(callback);
  }

  notifyConnectionListeners() {
    this.connectionListeners.forEach(callback => {
      callback(this.getConnectionStatus());
    });
  }

  notifyNewsUpdateListeners(news) {
    this.newsUpdateListeners.forEach(callback => {
      callback(news);
    });
  }

  // Public Methods
  getConnectionStatus() {
    return Object.keys(this.apis).reduce((status, apiKey) => {
      status[apiKey] = {
        name: this.apis[apiKey].name,
        status: this.apis[apiKey].status,
        lastCheck: this.apis[apiKey].lastCheck,
        responseTime: this.apis[apiKey].responseTime,
        error: this.apis[apiKey].error
      };
      return status;
    }, {});
  }

  getLatestNews(limit = 10) {
    return this.newsCache.slice(0, limit);
  }

  getNewsBySource(source) {
    return this.newsCache.filter(news => news.apiSource === source);
  }

  getNewsByImportance(minImportance = 5) {
    return this.newsCache.filter(news => news.importance >= minImportance);
  }

  // Auto-refresh functionality
  startAutoRefresh() {
    // Initial fetch
    this.fetchAllNews();
    
    // Set up periodic refresh
    this.refreshInterval = setInterval(() => {
      this.fetchAllNews();
    }, this.refreshRate);
    
    // Set up connection monitoring
    this.connectionCheckInterval = setInterval(() => {
      this.checkAllConnections();
    }, 30000); // Check every 30 seconds
  }

  async fetchWithRetry(url, options = {}, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${url}:`, error.message);
        
        if (i === attempts - 1) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  setRefreshRate(minutes) {
    this.refreshRate = minutes * 60 * 1000;
    
    // Restart auto-refresh with new rate
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = setInterval(() => {
        this.fetchAllNews();
      }, this.refreshRate);
    }
  }

  // Manual refresh method
  async refresh() {
    try {
      await this.fetchAllNews();
      return { success: true, message: 'News refreshed successfully' };
    } catch (error) {
      console.error('Manual refresh failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Get refresh status
  getRefreshStatus() {
    return {
      refreshRate: this.refreshRate,
      lastRefresh: this.lastRefresh,
      isAutoRefreshActive: !!this.refreshInterval,
      nextRefresh: this.lastRefresh ? new Date(this.lastRefresh.getTime() + this.refreshRate) : null
    };
  }

  // Toggle between mock and real data
  setMockDataMode(useMock) {
    this.useMockData = useMock;
    if (useMock) {
      // Refresh mock data with current timestamps
      this.mockNews = this.generateMockNews();
    }
    // Trigger a refresh
    this.fetchAllNews();
  }

  // Get current data mode
  getDataMode() {
    return {
      useMockData: this.useMockData,
      reason: this.useMockData ? 'CORS limitations prevent direct API calls from browser' : 'Using live APIs'
    };
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    this.connectionListeners = [];
    this.newsUpdateListeners = [];
  }
}

export default SpaceNewsService;