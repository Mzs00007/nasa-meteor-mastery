import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './data-analysis-panel.css';

const DataAnalysisPanel = ({ 
  impactResults, 
  simulationHistory, 
  nasaData, 
  onExportData,
  realTimeMode = true 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisMode, setAnalysisMode] = useState('statistical');
  const [selectedMetrics, setSelectedMetrics] = useState(['energy', 'crater', 'casualties']);
  const [timeRange, setTimeRange] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chartRef = useRef(null);

  // Data processing and analysis
  const processedData = useMemo(() => {
    if (!impactResults) return null;

    return {
      // Basic metrics
      basicMetrics: {
        energy: impactResults.energy,
        tntEquivalent: impactResults.tntEquivalent,
        craterDiameter: impactResults.craterDiameter,
        craterDepth: impactResults.craterDepth,
        seismicMagnitude: impactResults.seismicMagnitude,
        casualties: impactResults.casualties?.total || 0,
        economicDamage: impactResults.economicDamage?.total || 0
      },
      
      // Statistical analysis
      statistics: calculateStatistics(impactResults, simulationHistory),
      
      // Comparative analysis
      comparison: generateComparison(impactResults, simulationHistory),
      
      // Risk assessment
      riskAssessment: assessRisk(impactResults),
      
      // Uncertainty analysis
      uncertaintyAnalysis: analyzeUncertainty(impactResults),
      
      // Environmental impact
      environmentalImpact: analyzeEnvironmentalImpact(impactResults)
    };
  }, [impactResults, simulationHistory]);

  // Statistical calculations
  const calculateStatistics = (results, history) => {
    if (!results || !history?.length) return null;

    const energies = history.map(h => h.results?.energy || 0).filter(e => e > 0);
    const craters = history.map(h => h.results?.craterDiameter || 0).filter(c => c > 0);
    const casualties = history.map(h => h.results?.casualties?.total || 0);

    return {
      energy: {
        mean: energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 0,
        median: energies.length ? energies.sort()[Math.floor(energies.length / 2)] : 0,
        stdDev: calculateStandardDeviation(energies),
        min: Math.min(...energies),
        max: Math.max(...energies),
        percentiles: calculatePercentiles(energies)
      },
      crater: {
        mean: craters.length ? craters.reduce((a, b) => a + b, 0) / craters.length : 0,
        median: craters.length ? craters.sort()[Math.floor(craters.length / 2)] : 0,
        stdDev: calculateStandardDeviation(craters),
        min: Math.min(...craters),
        max: Math.max(...craters),
        percentiles: calculatePercentiles(craters)
      },
      casualties: {
        mean: casualties.length ? casualties.reduce((a, b) => a + b, 0) / casualties.length : 0,
        median: casualties.length ? casualties.sort()[Math.floor(casualties.length / 2)] : 0,
        stdDev: calculateStandardDeviation(casualties),
        min: Math.min(...casualties),
        max: Math.max(...casualties),
        percentiles: calculatePercentiles(casualties)
      }
    };
  };

  // Helper functions for statistical calculations
  const calculateStandardDeviation = (values) => {
    if (!values.length) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const calculatePercentiles = (values) => {
    if (!values.length) return { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p25: sorted[Math.floor(sorted.length * 0.25)],
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.90)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  };

  // Comparative analysis
  const generateComparison = (results, history) => {
    if (!results || !history?.length) return null;

    const currentEnergy = results.energy;
    const historicalEnergies = history.map(h => h.results?.energy || 0).filter(e => e > 0);
    
    const rank = historicalEnergies.filter(e => e < currentEnergy).length + 1;
    const percentile = (rank / (historicalEnergies.length + 1)) * 100;

    return {
      energyRank: rank,
      energyPercentile: percentile,
      isAboveAverage: currentEnergy > (historicalEnergies.reduce((a, b) => a + b, 0) / historicalEnergies.length),
      historicalComparison: results.historicalComparison,
      similarEvents: findSimilarEvents(results, history)
    };
  };

  // Find similar historical events
  const findSimilarEvents = (results, history) => {
    if (!results || !history?.length) return [];

    const currentEnergy = results.energy;
    const tolerance = 0.5; // 50% tolerance

    return history
      .filter(h => {
        const energy = h.results?.energy || 0;
        return energy > 0 && Math.abs(Math.log10(energy) - Math.log10(currentEnergy)) < tolerance;
      })
      .slice(0, 5) // Top 5 similar events
      .map(h => ({
        date: h.timestamp,
        energy: h.results.energy,
        location: h.parameters.location,
        similarity: 1 - Math.abs(Math.log10(h.results.energy) - Math.log10(currentEnergy)) / tolerance
      }));
  };

  // Risk assessment
  const assessRisk = (results) => {
    if (!results) return null;

    const energy = results.energy;
    const casualties = results.casualties?.total || 0;
    const economicDamage = results.economicDamage?.total || 0;

    // Risk categories based on energy
    let riskLevel = 'minimal';
    let riskScore = 0;

    if (energy > 1e20) { // > 100 Mt TNT equivalent
      riskLevel = 'catastrophic';
      riskScore = 10;
    } else if (energy > 1e18) { // > 1 Mt TNT equivalent
      riskLevel = 'severe';
      riskScore = 8;
    } else if (energy > 1e16) { // > 10 Kt TNT equivalent
      riskLevel = 'high';
      riskScore = 6;
    } else if (energy > 1e14) { // > 100 t TNT equivalent
      riskLevel = 'moderate';
      riskScore = 4;
    } else if (energy > 1e12) { // > 1 t TNT equivalent
      riskLevel = 'low';
      riskScore = 2;
    }

    return {
      level: riskLevel,
      score: riskScore,
      factors: {
        energy: energy,
        population: casualties,
        economic: economicDamage,
        environmental: results.atmosphericEffects?.globalEffects ? 10 : 0
      },
      recommendations: generateRiskRecommendations(riskLevel, results)
    };
  };

  // Generate risk recommendations
  const generateRiskRecommendations = (riskLevel, results) => {
    const recommendations = [];

    switch (riskLevel) {
      case 'catastrophic':
        recommendations.push('Immediate global emergency response required');
        recommendations.push('Mass evacuation protocols should be activated');
        recommendations.push('International coordination essential');
        break;
      case 'severe':
        recommendations.push('Regional emergency response required');
        recommendations.push('Evacuation of immediate impact zone');
        recommendations.push('Medical facilities should be prepared');
        break;
      case 'high':
        recommendations.push('Local emergency services should be alerted');
        recommendations.push('Monitor for secondary effects');
        recommendations.push('Prepare damage assessment teams');
        break;
      case 'moderate':
        recommendations.push('Local authorities should be notified');
        recommendations.push('Monitor impact site');
        break;
      case 'low':
        recommendations.push('Scientific observation recommended');
        recommendations.push('Document event for research');
        break;
      default:
        recommendations.push('Continue monitoring');
    }

    if (results.tsunamiRisk) {
      recommendations.push('Tsunami warning systems should be activated');
    }

    if (results.atmosphericEffects?.climateImpact?.temperature < -1) {
      recommendations.push('Prepare for climate disruption');
    }

    return recommendations;
  };

  // Uncertainty analysis
  const analyzeUncertainty = (results) => {
    if (!results) return null;

    const confidence = results.confidence || 0.8;
    const uncertaintyRange = results.uncertaintyRange || { min: 0, max: 0 };

    return {
      confidence: confidence,
      uncertaintyRange: uncertaintyRange,
      factors: {
        atmospheric: 0.1, // 10% uncertainty from atmospheric modeling
        material: 0.05,   // 5% uncertainty from material properties
        angle: 0.08,      // 8% uncertainty from impact angle
        location: 0.03,   // 3% uncertainty from location data
        physics: 0.04     // 4% uncertainty from physics models
      },
      totalUncertainty: Math.sqrt(0.1*0.1 + 0.05*0.05 + 0.08*0.08 + 0.03*0.03 + 0.04*0.04)
    };
  };

  // Environmental impact analysis
  const analyzeEnvironmentalImpact = (results) => {
    if (!results) return null;

    const effects = results.atmosphericEffects || {};
    
    return {
      immediate: {
        dustCloud: effects.dustCloud,
        shockwave: results.blastRadius,
        seismic: results.seismicMagnitude
      },
      shortTerm: {
        climate: effects.climateImpact,
        ozone: effects.ozoneDepletion,
        ecosystem: assessEcosystemDamage(results)
      },
      longTerm: {
        geological: assessGeologicalImpact(results),
        evolutionary: effects.globalEffects,
        recovery: estimateRecoveryTime(results)
      }
    };
  };

  // Helper functions for environmental analysis
  const assessEcosystemDamage = (results) => {
    const blastArea = Math.PI * Math.pow(results.blastRadius?.moderate || 0, 2);
    return {
      affectedArea: blastArea,
      severity: blastArea > 1000 ? 'severe' : blastArea > 100 ? 'moderate' : 'minimal',
      recoveryTime: Math.log10(blastArea + 1) * 5 // years
    };
  };

  const assessGeologicalImpact = (results) => {
    const craterVolume = results.craterDiameter ? 
      Math.PI * Math.pow(results.craterDiameter / 2, 2) * results.craterDepth : 0;
    
    return {
      craterPermanence: craterVolume > 1e6 ? 'permanent' : 'temporary',
      geologicalSignature: results.seismicMagnitude > 5,
      stratigraphicMarker: results.energy > 1e18
    };
  };

  const estimateRecoveryTime = (results) => {
    const energy = results.energy;
    if (energy > 1e20) return 'geological timescales (millions of years)';
    if (energy > 1e18) return 'centuries to millennia';
    if (energy > 1e16) return 'decades to centuries';
    if (energy > 1e14) return 'years to decades';
    return 'months to years';
  };

  // Format numbers for display
  const formatNumber = (num, precision = 2) => {
    if (num === 0) return '0';
    if (num < 1e-3) return num.toExponential(precision);
    if (num < 1) return num.toFixed(precision + 2);
    if (num < 1000) return num.toFixed(precision);
    if (num < 1e6) return (num / 1e3).toFixed(precision) + 'K';
    if (num < 1e9) return (num / 1e6).toFixed(precision) + 'M';
    if (num < 1e12) return (num / 1e9).toFixed(precision) + 'B';
    return (num / 1e12).toFixed(precision) + 'T';
  };

  // Export data functionality
  const handleExportData = (format) => {
    if (onExportData) {
      onExportData({
        format,
        data: processedData,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Render different analysis tabs
  const renderTabContent = () => {
    if (!processedData) {
      return (
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing impact data...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'statistics':
        return renderStatisticsTab();
      case 'comparison':
        return renderComparisonTab();
      case 'risk':
        return renderRiskTab();
      case 'uncertainty':
        return renderUncertaintyTab();
      case 'environmental':
        return renderEnvironmentalTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <div className="analysis-overview">
      <div className="metrics-grid">
        <div className="metric-card energy">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <h4>Kinetic Energy</h4>
            <div className="metric-value">{formatNumber(processedData.basicMetrics.energy)} J</div>
            <div className="metric-subtitle">{formatNumber(processedData.basicMetrics.tntEquivalent)} Mt TNT</div>
          </div>
        </div>

        <div className="metric-card crater">
          <div className="metric-icon">🕳️</div>
          <div className="metric-content">
            <h4>Crater Formation</h4>
            <div className="metric-value">{formatNumber(processedData.basicMetrics.craterDiameter / 1000)} km</div>
            <div className="metric-subtitle">Diameter</div>
          </div>
        </div>

        <div className="metric-card seismic">
          <div className="metric-icon">🌍</div>
          <div className="metric-content">
            <h4>Seismic Impact</h4>
            <div className="metric-value">{formatNumber(processedData.basicMetrics.seismicMagnitude)}</div>
            <div className="metric-subtitle">Richter Scale</div>
          </div>
        </div>

        <div className="metric-card casualties">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h4>Estimated Casualties</h4>
            <div className="metric-value">{formatNumber(processedData.basicMetrics.casualties)}</div>
            <div className="metric-subtitle">Total Affected</div>
          </div>
        </div>
      </div>

      <div className="analysis-summary">
        <h3>Impact Analysis Summary</h3>
        <div className="summary-content">
          <p>
            This impact event would release approximately <strong>{formatNumber(processedData.basicMetrics.tntEquivalent)} megatons</strong> of 
            energy, creating a crater <strong>{formatNumber(processedData.basicMetrics.craterDiameter / 1000)} km</strong> in diameter.
          </p>
          <p>
            The seismic impact would register <strong>{formatNumber(processedData.basicMetrics.seismicMagnitude)}</strong> on the Richter scale, 
            with an estimated <strong>{formatNumber(processedData.basicMetrics.casualties)}</strong> casualties in the affected region.
          </p>
          {processedData.riskAssessment && (
            <p>
              Risk Assessment: <span className={`risk-level ${processedData.riskAssessment.level}`}>
                {processedData.riskAssessment.level.toUpperCase()}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="analysis-statistics">
      <h3>Statistical Analysis</h3>
      {processedData.statistics ? (
        <div className="statistics-grid">
          <div className="stat-section">
            <h4>Energy Distribution</h4>
            <div className="stat-values">
              <div className="stat-item">
                <span className="stat-label">Mean:</span>
                <span className="stat-value">{formatNumber(processedData.statistics.energy.mean)} J</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Median:</span>
                <span className="stat-value">{formatNumber(processedData.statistics.energy.median)} J</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Std Dev:</span>
                <span className="stat-value">{formatNumber(processedData.statistics.energy.stdDev)} J</span>
              </div>
            </div>
          </div>

          <div className="stat-section">
            <h4>Crater Size Distribution</h4>
            <div className="stat-values">
              <div className="stat-item">
                <span className="stat-label">Mean:</span>
                <span className="stat-value">{formatNumber(processedData.statistics.crater.mean / 1000)} km</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Median:</span>
                <span className="stat-value">{formatNumber(processedData.statistics.crater.median / 1000)} km</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Range:</span>
                <span className="stat-value">
                  {formatNumber(processedData.statistics.crater.min / 1000)} - {formatNumber(processedData.statistics.crater.max / 1000)} km
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p>No statistical data available. Run more simulations to generate statistics.</p>
      )}
    </div>
  );

  const renderComparisonTab = () => (
    <div className="analysis-comparison">
      <h3>Comparative Analysis</h3>
      {processedData.comparison ? (
        <div className="comparison-content">
          <div className="historical-comparison">
            <h4>Historical Comparison</h4>
            {processedData.comparison.historicalComparison && (
              <div className="historical-event">
                <p>
                  This impact is <strong>{formatNumber(processedData.comparison.historicalComparison.ratio)}x</strong> {' '}
                  {processedData.comparison.historicalComparison.comparison} than the{' '}
                  <strong>{processedData.comparison.historicalComparison.event.name}</strong> event.
                </p>
              </div>
            )}
          </div>

          <div className="similar-events">
            <h4>Similar Events</h4>
            {processedData.comparison.similarEvents.length > 0 ? (
              <div className="events-list">
                {processedData.comparison.similarEvents.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className="event-date">{new Date(event.date).toLocaleDateString()}</div>
                    <div className="event-energy">{formatNumber(event.energy)} J</div>
                    <div className="event-similarity">{(event.similarity * 100).toFixed(1)}% similar</div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No similar events found in simulation history.</p>
            )}
          </div>
        </div>
      ) : (
        <p>No comparison data available.</p>
      )}
    </div>
  );

  const renderRiskTab = () => (
    <div className="analysis-risk">
      <h3>Risk Assessment</h3>
      {processedData.riskAssessment ? (
        <div className="risk-content">
          <div className="risk-level-indicator">
            <div className={`risk-badge ${processedData.riskAssessment.level}`}>
              {processedData.riskAssessment.level.toUpperCase()}
            </div>
            <div className="risk-score">
              Risk Score: {processedData.riskAssessment.score}/10
            </div>
          </div>

          <div className="risk-factors">
            <h4>Risk Factors</h4>
            <div className="factors-grid">
              <div className="factor-item">
                <span className="factor-label">Energy Release:</span>
                <span className="factor-value">{formatNumber(processedData.riskAssessment.factors.energy)} J</span>
              </div>
              <div className="factor-item">
                <span className="factor-label">Population Impact:</span>
                <span className="factor-value">{formatNumber(processedData.riskAssessment.factors.population)} people</span>
              </div>
              <div className="factor-item">
                <span className="factor-label">Economic Damage:</span>
                <span className="factor-value">${formatNumber(processedData.riskAssessment.factors.economic)}</span>
              </div>
            </div>
          </div>

          <div className="risk-recommendations">
            <h4>Recommendations</h4>
            <ul>
              {processedData.riskAssessment.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>No risk assessment data available.</p>
      )}
    </div>
  );

  const renderUncertaintyTab = () => (
    <div className="analysis-uncertainty">
      <h3>Uncertainty Analysis</h3>
      {processedData.uncertaintyAnalysis ? (
        <div className="uncertainty-content">
          <div className="confidence-indicator">
            <h4>Confidence Level</h4>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${processedData.uncertaintyAnalysis.confidence * 100}%` }}
              ></div>
            </div>
            <span>{(processedData.uncertaintyAnalysis.confidence * 100).toFixed(1)}%</span>
          </div>

          <div className="uncertainty-factors">
            <h4>Uncertainty Sources</h4>
            <div className="factors-list">
              {Object.entries(processedData.uncertaintyAnalysis.factors).map(([factor, value]) => (
                <div key={factor} className="uncertainty-factor">
                  <span className="factor-name">{factor.charAt(0).toUpperCase() + factor.slice(1)}:</span>
                  <span className="factor-uncertainty">±{(value * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="uncertainty-range">
            <h4>Energy Range</h4>
            <p>
              {formatNumber(processedData.uncertaintyAnalysis.uncertaintyRange.min)} J - {' '}
              {formatNumber(processedData.uncertaintyAnalysis.uncertaintyRange.max)} J
            </p>
            <p className="uncertainty-note">
              Total uncertainty: ±{(processedData.uncertaintyAnalysis.totalUncertainty * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      ) : (
        <p>No uncertainty analysis data available.</p>
      )}
    </div>
  );

  const renderEnvironmentalTab = () => (
    <div className="analysis-environmental">
      <h3>Environmental Impact Analysis</h3>
      {processedData.environmentalImpact ? (
        <div className="environmental-content">
          <div className="impact-timeline">
            <div className="timeline-section immediate">
              <h4>Immediate Effects</h4>
              <ul>
                <li>Dust cloud radius: {formatNumber(processedData.environmentalImpact.immediate.dustCloud?.radius / 1000)} km</li>
                <li>Shockwave radius: {formatNumber(processedData.environmentalImpact.immediate.shockwave?.moderate / 1000)} km</li>
                <li>Seismic magnitude: {formatNumber(processedData.environmentalImpact.immediate.seismic)}</li>
              </ul>
            </div>

            <div className="timeline-section short-term">
              <h4>Short-term Effects</h4>
              <ul>
                <li>Climate impact: {processedData.environmentalImpact.shortTerm.climate?.temperature}°C cooling</li>
                <li>Ozone depletion: {processedData.environmentalImpact.shortTerm.ozone}%</li>
                <li>Ecosystem recovery: {processedData.environmentalImpact.shortTerm.ecosystem?.recoveryTime} years</li>
              </ul>
            </div>

            <div className="timeline-section long-term">
              <h4>Long-term Effects</h4>
              <ul>
                <li>Geological impact: {processedData.environmentalImpact.longTerm.geological?.craterPermanence}</li>
                <li>Recovery time: {processedData.environmentalImpact.longTerm.recovery}</li>
                {processedData.environmentalImpact.longTerm.evolutionary && (
                  <li>Global evolutionary impact: Significant</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <p>No environmental impact data available.</p>
      )}
    </div>
  );

  return (
    <motion.div 
      className="data-analysis-panel"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="panel-header">
        <h2>📊 Data Analysis</h2>
        <div className="panel-controls">
          {realTimeMode && (
            <div className="real-time-indicator">
              <div className="pulse-dot"></div>
              <span>Live Analysis</span>
            </div>
          )}
          <div className="export-controls">
            <button onClick={() => handleExportData('csv')} className="export-btn">
              📊 CSV
            </button>
            <button onClick={() => handleExportData('json')} className="export-btn">
              📄 JSON
            </button>
          </div>
        </div>
      </div>

      <div className="analysis-tabs">
        {[
          { id: 'overview', label: '📋 Overview', icon: '📋' },
          { id: 'statistics', label: '📈 Statistics', icon: '📈' },
          { id: 'comparison', label: '⚖️ Comparison', icon: '⚖️' },
          { id: 'risk', label: '⚠️ Risk', icon: '⚠️' },
          { id: 'uncertainty', label: '🎯 Uncertainty', icon: '🎯' },
          { id: 'environmental', label: '🌍 Environmental', icon: '🌍' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label.split(' ')[1]}</span>
          </button>
        ))}
      </div>

      <div className="analysis-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DataAnalysisPanel;