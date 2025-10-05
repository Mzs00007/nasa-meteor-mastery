import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './impact-visualization-dashboard.css';

const ImpactVisualizationDashboard = ({ 
  impactResults, 
  simulationHistory, 
  meteorParams,
  onExport,
  onShare 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [isAnimating, setIsAnimating] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');
  
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'energy', label: '⚡ Energy Analysis', icon: '⚡' },
    { id: 'damage', label: '💥 Damage Assessment', icon: '💥' },
    { id: 'comparison', label: '📈 Comparison', icon: '📈' },
    { id: 'timeline', label: '⏱️ Timeline', icon: '⏱️' },
    { id: 'risk', label: '⚠️ Risk Analysis', icon: '⚠️' }
  ];

  // Chart type options
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: '📊' },
    { id: 'line', label: 'Line Chart', icon: '📈' },
    { id: 'pie', label: 'Pie Chart', icon: '🥧' },
    { id: 'radar', label: 'Radar Chart', icon: '🎯' },
    { id: 'scatter', label: 'Scatter Plot', icon: '⚪' }
  ];

  // Metric options
  const metrics = [
    { id: 'energy', label: 'Kinetic Energy', unit: 'J', color: '#3b82f6' },
    { id: 'tnt', label: 'TNT Equivalent', unit: 'MT', color: '#ef4444' },
    { id: 'crater', label: 'Crater Diameter', unit: 'km', color: '#f59e0b' },
    { id: 'blast', label: 'Blast Radius', unit: 'km', color: '#8b5cf6' },
    { id: 'seismic', label: 'Seismic Magnitude', unit: 'Richter', color: '#22c55e' },
    { id: 'casualties', label: 'Casualties', unit: 'people', color: '#dc2626' }
  ];

  // Process simulation data for visualization
  const processedData = useMemo(() => {
    if (!impactResults) return null;

    return {
      current: {
        energy: impactResults.kineticEnergy || 0,
        tnt: impactResults.tntEquivalent || 0,
        crater: impactResults.craterDiameter || 0,
        blast: impactResults.blastRadius || 0,
        seismic: impactResults.seismicMagnitude || 0,
        casualties: impactResults.casualties || 0
      },
      historical: simulationHistory?.map(sim => ({
        id: sim.id,
        timestamp: sim.timestamp,
        energy: sim.results?.kineticEnergy || 0,
        tnt: sim.results?.tntEquivalent || 0,
        crater: sim.results?.craterDiameter || 0,
        blast: sim.results?.blastRadius || 0,
        seismic: sim.results?.seismicMagnitude || 0,
        casualties: sim.results?.casualties || 0,
        diameter: sim.params?.diameter || 0,
        velocity: sim.params?.velocity || 0,
        angle: sim.params?.angle || 0,
        composition: sim.params?.composition || 'stone'
      })) || []
    };
  }, [impactResults, simulationHistory]);

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (!processedData?.historical) return [];

    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const cutoff = now - (ranges[timeRange] || ranges.all);
    return processedData.historical.filter(item => 
      new Date(item.timestamp).getTime() > cutoff
    );
  }, [processedData, timeRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!filteredData.length) return null;

    const calculateStats = (values) => {
      const sorted = values.sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      return { mean, median, min, max, stdDev, count: values.length };
    };

    return {
      energy: calculateStats(filteredData.map(d => d.energy)),
      tnt: calculateStats(filteredData.map(d => d.tnt)),
      crater: calculateStats(filteredData.map(d => d.crater)),
      blast: calculateStats(filteredData.map(d => d.blast)),
      seismic: calculateStats(filteredData.map(d => d.seismic)),
      casualties: calculateStats(filteredData.map(d => d.casualties))
    };
  }, [filteredData]);

  // Risk assessment calculations
  const riskAssessment = useMemo(() => {
    if (!processedData?.current) return null;

    const { energy, tnt, crater, blast, casualties } = processedData.current;

    // Define risk thresholds (based on scientific literature)
    const thresholds = {
      energy: [1e12, 1e15, 1e18, 1e21], // Joules
      tnt: [0.001, 1, 1000, 1000000], // Megatons
      crater: [0.1, 1, 10, 100], // km
      casualties: [100, 10000, 1000000, 100000000] // people
    };

    const getRiskLevel = (value, thresholds) => {
      if (value < thresholds[0]) return { level: 'minimal', score: 1, color: '#22c55e' };
      if (value < thresholds[1]) return { level: 'low', score: 2, color: '#f59e0b' };
      if (value < thresholds[2]) return { level: 'moderate', score: 3, color: '#ef4444' };
      if (value < thresholds[3]) return { level: 'high', score: 4, color: '#dc2626' };
      return { level: 'catastrophic', score: 5, color: '#7c2d12' };
    };

    const energyRisk = getRiskLevel(energy, thresholds.energy);
    const tntRisk = getRiskLevel(tnt, thresholds.tnt);
    const craterRisk = getRiskLevel(crater, thresholds.crater);
    const casualtyRisk = getRiskLevel(casualties, thresholds.casualties);

    const overallScore = (energyRisk.score + tntRisk.score + craterRisk.score + casualtyRisk.score) / 4;
    const overallRisk = getRiskLevel(overallScore, [1.5, 2.5, 3.5, 4.5]);

    return {
      overall: overallRisk,
      breakdown: {
        energy: energyRisk,
        tnt: tntRisk,
        crater: craterRisk,
        casualties: casualtyRisk
      },
      recommendations: generateRecommendations(overallRisk.level)
    };
  }, [processedData]);

  // Generate risk-based recommendations
  const generateRecommendations = (riskLevel) => {
    const recommendations = {
      minimal: [
        'Monitor for similar objects',
        'Continue regular observations',
        'Update impact models'
      ],
      low: [
        'Increase monitoring frequency',
        'Prepare early warning systems',
        'Review evacuation procedures'
      ],
      moderate: [
        'Activate emergency protocols',
        'Coordinate with international agencies',
        'Prepare evacuation zones'
      ],
      high: [
        'Immediate evacuation of impact zone',
        'Deploy deflection missions if possible',
        'Activate global emergency response'
      ],
      catastrophic: [
        'Global emergency declaration',
        'Mass evacuation protocols',
        'International coordination required'
      ]
    };

    return recommendations[riskLevel] || recommendations.minimal;
  };

  // Draw charts on canvas
  const drawChart = (canvas, data, type, metric) => {
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up styling
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Get metric data
    const metricData = data.map(d => d[metric] || 0);
    const maxValue = Math.max(...metricData);
    const minValue = Math.min(...metricData);
    const range = maxValue - minValue || 1;

    // Draw based on chart type
    switch (type) {
      case 'bar':
        drawBarChart(ctx, metricData, padding, chartWidth, chartHeight, maxValue);
        break;
      case 'line':
        drawLineChart(ctx, metricData, padding, chartWidth, chartHeight, maxValue, minValue);
        break;
      case 'pie':
        drawPieChart(ctx, metricData, width / 2, height / 2, Math.min(chartWidth, chartHeight) / 3);
        break;
      case 'radar':
        drawRadarChart(ctx, metricData, width / 2, height / 2, Math.min(chartWidth, chartHeight) / 3);
        break;
      case 'scatter':
        drawScatterPlot(ctx, data, padding, chartWidth, chartHeight, metric);
        break;
    }

    // Draw axes and labels
    drawAxes(ctx, padding, chartWidth, chartHeight, maxValue, minValue, metric);
  };

  // Chart drawing functions
  const drawBarChart = (ctx, data, padding, width, height, maxValue) => {
    const barWidth = width / data.length * 0.8;
    const barSpacing = width / data.length * 0.2;

    ctx.fillStyle = '#3b82f6';
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * height;
      const x = padding + index * (barWidth + barSpacing);
      const y = padding + height - barHeight;
      
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Add value labels
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(
        formatNumber(value), 
        x + barWidth / 2, 
        y - 5
      );
      ctx.fillStyle = '#3b82f6';
    });
  };

  const drawLineChart = (ctx, data, padding, width, height, maxValue, minValue) => {
    const range = maxValue - minValue || 1;
    const stepX = width / (data.length - 1);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = padding + height - ((value - minValue) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // Draw data points
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.stroke();
  };

  const drawPieChart = (ctx, data, centerX, centerY, radius) => {
    const total = data.reduce((sum, value) => sum + value, 0);
    let currentAngle = -Math.PI / 2;

    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899'];

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
  };

  const drawRadarChart = (ctx, data, centerX, centerY, radius) => {
    const numPoints = data.length;
    const angleStep = (2 * Math.PI) / numPoints;
    const maxValue = Math.max(...data);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const gridRadius = (radius / 5) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, gridRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw data
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (value / maxValue) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawScatterPlot = (ctx, data, padding, width, height, metric) => {
    const xValues = data.map(d => d.diameter || 0);
    const yValues = data.map(d => d[metric] || 0);
    
    const maxX = Math.max(...xValues);
    const maxY = Math.max(...yValues);
    const minX = Math.min(...xValues);
    const minY = Math.min(...yValues);

    ctx.fillStyle = '#3b82f6';
    data.forEach((item, index) => {
      const x = padding + ((xValues[index] - minX) / (maxX - minX)) * width;
      const y = padding + height - ((yValues[index] - minY) / (maxY - minY)) * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawAxes = (ctx, padding, width, height, maxValue, minValue, metric) => {
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + height);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + height);
    ctx.lineTo(padding + width, padding + height);
    ctx.stroke();
    
    // Y-axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (maxValue - minValue) * (i / 5);
      const y = padding + height - (i / 5) * height;
      ctx.fillText(formatNumber(value), padding - 5, y + 3);
    }
  };

  // Utility functions
  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toFixed(2);
  };

  const formatMetricValue = (value, metric) => {
    const metricInfo = metrics.find(m => m.id === metric);
    if (!metricInfo) return value;

    return `${formatNumber(value)} ${metricInfo.unit}`;
  };

  // Export functionality
  const handleExport = () => {
    if (!onExport) return;

    const exportData = {
      results: processedData?.current,
      statistics,
      riskAssessment,
      metadata: {
        timestamp: new Date().toISOString(),
        meteorParams,
        chartType,
        selectedMetric,
        timeRange
      }
    };

    onExport(exportData, exportFormat);
  };

  // Update canvas when data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && filteredData.length > 0) {
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Draw chart
      drawChart(canvas, filteredData, chartType, selectedMetric);
    }
  }, [filteredData, chartType, selectedMetric]);

  // Animation effect
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [activeTab, chartType, selectedMetric]);

  if (!processedData) {
    return (
      <div className="visualization-dashboard">
        <div className="no-data-message">
          <h3>🎯 No Simulation Data</h3>
          <p>Run a simulation to see visualization results</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="visualization-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h3>📊 Impact Visualization Dashboard</h3>
          <div className="data-status">
            <span className="data-indicator active"></span>
            <span>Live Data • {filteredData.length} simulations</span>
          </div>
        </div>
        
        <div className="header-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          
          <button className="export-btn" onClick={handleExport}>
            📤 Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="tab-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="metrics-grid">
                {metrics.map(metric => {
                  const value = processedData.current[metric.id] || 0;
                  return (
                    <div key={metric.id} className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">{metric.label}</span>
                        <div 
                          className="metric-indicator"
                          style={{ backgroundColor: metric.color }}
                        ></div>
                      </div>
                      <div className="metric-value">
                        {formatMetricValue(value, metric.id)}
                      </div>
                      <div className="metric-change">
                        {statistics?.[metric.id] && (
                          <span className={value > statistics[metric.id].mean ? 'positive' : 'negative'}>
                            {value > statistics[metric.id].mean ? '↗' : '↘'} 
                            {((value / statistics[metric.id].mean - 1) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'energy' && (
            <div className="energy-tab">
              <div className="chart-controls">
                <div className="chart-type-selector">
                  {chartTypes.map(type => (
                    <button
                      key={type.id}
                      className={`chart-type-btn ${chartType === type.id ? 'active' : ''}`}
                      onClick={() => setChartType(type.id)}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="metric-selector">
                  <select 
                    value={selectedMetric} 
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    {metrics.map(metric => (
                      <option key={metric.id} value={metric.id}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="chart-container">
                <canvas 
                  ref={canvasRef}
                  className={`chart-canvas ${isAnimating ? 'animating' : ''}`}
                ></canvas>
              </div>
            </div>
          )}

          {activeTab === 'risk' && riskAssessment && (
            <div className="risk-tab">
              <div className="risk-overview">
                <div className="overall-risk">
                  <h4>Overall Risk Assessment</h4>
                  <div 
                    className={`risk-level ${riskAssessment.overall.level}`}
                    style={{ borderColor: riskAssessment.overall.color }}
                  >
                    <span className="risk-score">{riskAssessment.overall.score}/5</span>
                    <span className="risk-label">{riskAssessment.overall.level.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="risk-breakdown">
                  <h4>Risk Breakdown</h4>
                  {Object.entries(riskAssessment.breakdown).map(([key, risk]) => (
                    <div key={key} className="risk-item">
                      <span className="risk-category">{key}</span>
                      <div className="risk-bar">
                        <div 
                          className="risk-fill"
                          style={{ 
                            width: `${(risk.score / 5) * 100}%`,
                            backgroundColor: risk.color 
                          }}
                        ></div>
                      </div>
                      <span className="risk-level-text">{risk.level}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="recommendations">
                <h4>🎯 Recommendations</h4>
                <ul className="recommendation-list">
                  {riskAssessment.recommendations.map((rec, index) => (
                    <li key={index} className="recommendation-item">
                      <span className="rec-bullet">•</span>
                      <span className="rec-text">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Add other tab content as needed */}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ImpactVisualizationDashboard;