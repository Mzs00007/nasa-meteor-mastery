// Space News API Service
// Fetches live space-related news from multiple sources

class SpaceNewsAPI {
  constructor() {
    this.baseUrls = {
      spaceflight: 'https://api.spaceflightnewsapi.net/v4',
      nasa: 'https://api.nasa.gov/planetary/apod',
      nasaNews: 'https://www.nasa.gov/news/releases/latest/rss'
    };
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data if available and not expired
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Set cache data
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Fetch latest space news from Spaceflight News API
  async fetchSpaceflightNews(limit = 10) {
    const cacheKey = `spaceflight_news_${limit}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrls.spaceflight}/articles/?limit=${limit}&ordering=-published_at`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const processedNews = data.results.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        url: article.url,
        imageUrl: article.image_url,
        publishedAt: new Date(article.published_at),
        source: 'Spaceflight News',
        newsSite: article.news_site,
        featured: article.featured
      }));

      this.setCachedData(cacheKey, processedNews);
      return processedNews;
    } catch (error) {
      console.error('Error fetching spaceflight news:', error);
      return [];
    }
  }

  // Fetch NASA breaking news and updates
  async fetchNASANews() {
    const cacheKey = 'nasa_news';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Simulated NASA news data (in real implementation, would parse RSS or use NASA API)
      const nasaNews = [
        {
          id: 'nasa_1',
          title: 'NASA Artemis Mission Update: Lunar Gateway Progress',
          summary: 'Latest developments in the Artemis program and lunar gateway construction timeline.',
          url: 'https://www.nasa.gov/artemis',
          imageUrl: 'https://www.nasa.gov/sites/default/files/thumbnails/image/artemis-logo.png',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          source: 'NASA Official',
          category: 'Mission Updates',
          priority: 'high'
        },
        {
          id: 'nasa_2',
          title: 'James Webb Space Telescope Discovers New Exoplanet',
          summary: 'JWST identifies potentially habitable exoplanet in nearby star system.',
          url: 'https://www.nasa.gov/webb',
          imageUrl: 'https://www.nasa.gov/sites/default/files/thumbnails/image/webb-logo.png',
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          source: 'NASA Official',
          category: 'Scientific Discovery',
          priority: 'high'
        },
        {
          id: 'nasa_3',
          title: 'Solar Storm Alert: Enhanced Aurora Activity Expected',
          summary: 'NOAA and NASA predict increased geomagnetic activity affecting satellite operations.',
          url: 'https://www.nasa.gov/space-weather',
          imageUrl: 'https://www.nasa.gov/sites/default/files/thumbnails/image/solar-storm.jpg',
          publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          source: 'NASA Space Weather',
          category: 'Space Weather',
          priority: 'critical'
        }
      ];

      this.setCachedData(cacheKey, nasaNews);
      return nasaNews;
    } catch (error) {
      console.error('Error fetching NASA news:', error);
      return [];
    }
  }

  // Fetch asteroid and NEO related news
  async fetchAsteroidNews() {
    const cacheKey = 'asteroid_news';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrls.spaceflight}/articles/?search=asteroid&limit=5&ordering=-published_at`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const asteroidNews = data.results.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        url: article.url,
        imageUrl: article.image_url,
        publishedAt: new Date(article.published_at),
        source: 'Spaceflight News',
        category: 'Asteroid/NEO',
        relevance: 'high'
      }));

      this.setCachedData(cacheKey, asteroidNews);
      return asteroidNews;
    } catch (error) {
      console.error('Error fetching asteroid news:', error);
      return [];
    }
  }

  // Get combined news feed with priority sorting
  async getCombinedNewsFeed(limit = 15) {
    try {
      const [spaceflightNews, nasaNews, asteroidNews] = await Promise.all([
        this.fetchSpaceflightNews(8),
        this.fetchNASANews(),
        this.fetchAsteroidNews()
      ]);

      // Combine all news sources
      const allNews = [
        ...nasaNews,
        ...spaceflightNews,
        ...asteroidNews
      ];

      // Sort by priority and recency
      const sortedNews = allNews.sort((a, b) => {
        // Priority sorting (critical > high > normal)
        const priorityOrder = { critical: 3, high: 2, normal: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // If same priority, sort by date
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });

      // Remove duplicates and limit results
      const uniqueNews = sortedNews
        .filter((news, index, self) => 
          index === self.findIndex(n => n.title === news.title)
        )
        .slice(0, limit);

      return uniqueNews;
    } catch (error) {
      console.error('Error fetching combined news feed:', error);
      return [];
    }
  }

  // Get breaking news (high priority items from last 24 hours)
  async getBreakingNews() {
    try {
      const allNews = await this.getCombinedNewsFeed(50);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return allNews.filter(news => 
        new Date(news.publishedAt) > twentyFourHoursAgo &&
        (news.priority === 'critical' || news.priority === 'high')
      ).slice(0, 5);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}

// Create singleton instance
const spaceNewsAPI = new SpaceNewsAPI();

export default spaceNewsAPI;

// Export individual methods for convenience
export const {
  fetchSpaceflightNews,
  fetchNASANews,
  fetchAsteroidNews,
  getCombinedNewsFeed,
  getBreakingNews,
  clearCache,
  getCacheStats
} = spaceNewsAPI;