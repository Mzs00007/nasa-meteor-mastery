/**
 * Enhanced Space Weather API Service
 * Provides comprehensive space weather data from multiple sources
 */

class EnhancedSpaceWeatherAPI {
  constructor() {
    this.baseURL = 'https://api.nasa.gov/DONKI';
    this.apiKey = process.env.REACT_APP_NASA_API_KEY || 'DEMO_KEY';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch new data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return cached ? cached.data : null;
    }
  }

  // Fetch solar flare data
  async getSolarFlares(startDate = null, endDate = null) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    return this.getCachedData('solarFlares', async () => {
      const response = await fetch(
        `${this.baseURL}/FLR?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`
      );
      const data = await response.json();
      
      return {
        flares: data.map(flare => ({
          id: flare.flrID,
          beginTime: flare.beginTime,
          peakTime: flare.peakTime,
          endTime: flare.endTime,
          classType: flare.classType,
          sourceLocation: flare.sourceLocation,
          activeRegionNum: flare.activeRegionNum,
          instruments: flare.instruments,
          linkedEvents: flare.linkedEvents || []
        })),
        summary: {
          total: data.length,
          xClass: data.filter(f => f.classType?.startsWith('X')).length,
          mClass: data.filter(f => f.classType?.startsWith('M')).length,
          cClass: data.filter(f => f.classType?.startsWith('C')).length,
          mostRecent: data.length > 0 ? data[data.length - 1] : null
        }
      };
    });
  }

  // Fetch coronal mass ejection data
  async getCoronalMassEjections(startDate = null, endDate = null) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    return this.getCachedData('cme', async () => {
      const response = await fetch(
        `${this.baseURL}/CME?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`
      );
      const data = await response.json();
      
      return {
        cmes: data.map(cme => ({
          id: cme.activityID,
          startTime: cme.startTime,
          sourceLocation: cme.sourceLocation,
          activeRegionNum: cme.activeRegionNum,
          instruments: cme.instruments,
          cmeAnalyses: cme.cmeAnalyses?.map(analysis => ({
            time21_5: analysis.time21_5,
            latitude: analysis.latitude,
            longitude: analysis.longitude,
            halfAngle: analysis.halfAngle,
            speed: analysis.speed,
            type: analysis.type,
            isMostAccurate: analysis.isMostAccurate
          })) || [],
          linkedEvents: cme.linkedEvents || []
        })),
        summary: {
          total: data.length,
          withEarthImpact: data.filter(cme => 
            cme.cmeAnalyses?.some(analysis => analysis.isMostAccurate)
          ).length,
          averageSpeed: data.length > 0 ? 
            data.reduce((sum, cme) => {
              const speed = cme.cmeAnalyses?.[0]?.speed || 0;
              return sum + speed;
            }, 0) / data.length : 0
        }
      };
    });
  }

  // Fetch geomagnetic storm data
  async getGeomagneticStorms(startDate = null, endDate = null) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    return this.getCachedData('geomagneticStorms', async () => {
      const response = await fetch(
        `${this.baseURL}/GST?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`
      );
      const data = await response.json();
      
      return {
        storms: data.map(storm => ({
          id: storm.gstID,
          startTime: storm.startTime,
          allKpIndex: storm.allKpIndex?.map(kp => ({
            observedTime: kp.observedTime,
            kpIndex: kp.kpIndex,
            source: kp.source
          })) || [],
          linkedEvents: storm.linkedEvents || []
        })),
        summary: {
          total: data.length,
          severeStorms: data.filter(storm => 
            storm.allKpIndex?.some(kp => kp.kpIndex >= 7)
          ).length,
          currentKp: data.length > 0 && data[data.length - 1].allKpIndex?.length > 0 ?
            data[data.length - 1].allKpIndex[data[data.length - 1].allKpIndex.length - 1].kpIndex : null
        }
      };
    });
  }

  // Fetch radiation belt enhancement data
  async getRadiationBeltEnhancements(startDate = null, endDate = null) {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    return this.getCachedData('radiationBelt', async () => {
      const response = await fetch(
        `${this.baseURL}/RBE?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`
      );
      const data = await response.json();
      
      return {
        enhancements: data.map(rbe => ({
          id: rbe.rbeID,
          eventTime: rbe.eventTime,
          instruments: rbe.instruments,
          linkedEvents: rbe.linkedEvents || []
        })),
        summary: {
          total: data.length,
          recentActivity: data.length > 0 ? data[data.length - 1] : null
        }
      };
    });
  }

  // Get comprehensive space weather summary
  async getSpaceWeatherSummary() {
    return this.getCachedData('weatherSummary', async () => {
      const [flares, cmes, storms, radiation] = await Promise.all([
        this.getSolarFlares(),
        this.getCoronalMassEjections(),
        this.getGeomagneticStorms(),
        this.getRadiationBeltEnhancements()
      ]);

      // Calculate space weather alert level
      let alertLevel = 'low';
      let alertReasons = [];

      // Check for recent X-class flares
      if (flares.summary.xClass > 0) {
        alertLevel = 'high';
        alertReasons.push(`${flares.summary.xClass} X-class solar flare(s) detected`);
      } else if (flares.summary.mClass > 2) {
        alertLevel = 'medium';
        alertReasons.push(`${flares.summary.mClass} M-class solar flare(s) detected`);
      }

      // Check for severe geomagnetic storms
      if (storms.summary.severeStorms > 0) {
        alertLevel = 'high';
        alertReasons.push(`${storms.summary.severeStorms} severe geomagnetic storm(s) detected`);
      } else if (storms.summary.currentKp && storms.summary.currentKp >= 5) {
        alertLevel = alertLevel === 'high' ? 'high' : 'medium';
        alertReasons.push(`Elevated Kp index: ${storms.summary.currentKp}`);
      }

      // Check for CMEs with Earth impact potential
      if (cmes.summary.withEarthImpact > 0) {
        alertLevel = alertLevel === 'high' ? 'high' : 'medium';
        alertReasons.push(`${cmes.summary.withEarthImpact} CME(s) with potential Earth impact`);
      }

      return {
        alertLevel,
        alertReasons,
        lastUpdated: new Date().toISOString(),
        solarFlares: flares,
        coronalMassEjections: cmes,
        geomagneticStorms: storms,
        radiationBeltEnhancements: radiation,
        overallActivity: {
          solarActivity: flares.summary.total > 5 ? 'high' : flares.summary.total > 2 ? 'medium' : 'low',
          geomagneticActivity: storms.summary.currentKp >= 7 ? 'high' : storms.summary.currentKp >= 5 ? 'medium' : 'low',
          radiationActivity: radiation.summary.total > 0 ? 'elevated' : 'normal'
        }
      };
    });
  }

  // Get space weather forecast (simulated data for demo)
  async getSpaceWeatherForecast() {
    return this.getCachedData('weatherForecast', async () => {
      // In a real implementation, this would fetch from NOAA Space Weather Prediction Center
      const forecast = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        forecast.push({
          date: date.toISOString().split('T')[0],
          solarActivity: Math.random() > 0.7 ? 'elevated' : 'normal',
          geomagneticActivity: Math.random() > 0.8 ? 'elevated' : 'normal',
          radiationLevel: Math.random() > 0.9 ? 'elevated' : 'normal',
          auroraVisibility: {
            latitude: Math.random() > 0.6 ? 60 - Math.random() * 20 : null,
            probability: Math.random()
          }
        });
      }
      
      return {
        forecast,
        confidence: 'medium',
        source: 'NOAA Space Weather Prediction Center (simulated)',
        lastUpdated: new Date().toISOString()
      };
    });
  }
}

export default new EnhancedSpaceWeatherAPI();