import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import React, { useState, useEffect } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { Link, useLocation } from 'react-router-dom';

import { exportService } from '../services/exportService';

// Glass UI Components
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import {
  GlassPanel,
  GlassCard,
  GlassButton,
  GlassStat,
  GlassNav,
  GlassToggle,
} from './ui/GlassComponents';
import { ModernSpinner, SkeletonText, SkeletonCard, LoadingButton, ProgressBar, LoadingOverlay } from './ui/ModernLoadingComponents';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdvancedSimulationResults = () => {
  const location = useLocation();
  const { results, parameters } = location.state || {};

  const [activeTab, setActiveTab] = useState('overview');
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [showFragmentation, setShowFragmentation] = useState(true);
  const [showEnvironmental, setShowEnvironmental] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('');
  const [chartsLoading, setChartsLoading] = useState(true);
  const [dataProcessing, setDataProcessing] = useState(true);

  // Simulate data processing and chart loading
  useEffect(() => {
    const processData = async () => {
      if (results) {
        // Simulate data processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        setDataProcessing(false);
        
        // Simulate chart rendering time
        await new Promise(resolve => setTimeout(resolve, 1000));
        setChartsLoading(false);
      }
    };

    processData();
  }, [results]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.6)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
  };

  // Format numbers for display
  const formatNumber = (num, decimals = 2) => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(decimals)}B`;
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(decimals)}M`;
    }
    if (num >= 1e3) {
      return `${(num / 1e3).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  // Prepare trajectory chart data
  const trajectoryData = results?.entryPhase?.trajectory
    ? {
        labels: results.entryPhase.trajectory.map(point =>
          point.time.toFixed(1)
        ),
        datasets: [
          {
            label: 'Altitude (km)',
            data: results.entryPhase.trajectory.map(
              point => point.altitude / 1000
            ),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            yAxisID: 'y',
          },
          {
            label: 'Velocity (km/s)',
            data: results.entryPhase.trajectory.map(
              point => point.velocity / 1000
            ),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            yAxisID: 'y1',
          },
        ],
      }
    : null;

  // Prepare shockwave data
  const shockwaveData = results?.impactPhase?.shockwave
    ? {
        labels: results.impactPhase.shockwave.radius.map(
          r => `${(r / 1000).toFixed(1)} km`
        ),
        datasets: [
          {
            label: 'Overpressure (kPa)',
            data: results.impactPhase.shockwave.overpressure,
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
          },
        ],
      }
    : null;

  if (!results) {
    return (
      <div className='min-h-screen relative overflow-hidden flex items-center justify-center'>
        <EnhancedMeteorBackground />
        <GlassPanel className='p-8 text-center'>
          <h2 className='text-2xl font-bold text-white mb-4'>
            No Results Available
          </h2>
          <p className='text-gray-300 mb-6'>
            Please run a simulation first to view results.
          </p>
          <Link to='/simulation/advanced-setup'>
            <GlassButton variant='primary'>
              🚀 Run Advanced Simulation
            </GlassButton>
          </Link>
        </GlassPanel>
      </div>
    );
  }

  // Export handlers
  const handleExportPDF = async () => {
    setExporting(true);
    setExportType('PDF');
    try {
      const result = await exportService.exportToPDF(results, parameters);
      if (result.success) {
        alert(`PDF report exported successfully: ${result.filename}`);
      }
    } catch (error) {
      alert(`Failed to export PDF: ${error.message}`);
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setExportType('CSV');
    try {
      const result = exportService.exportToCSV(results, parameters);
      if (result.success) {
        alert(`CSV data exported successfully: ${result.filename}`);
      }
    } catch (error) {
      alert(`Failed to export CSV: ${error.message}`);
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  const handleExportTrajectory = async () => {
    setExporting(true);
    setExportType('Trajectory');
    try {
      const result = exportService.exportTrajectoryCSV(results);
      if (result.success) {
        alert(`Trajectory data exported successfully: ${result.filename}`);
      }
    } catch (error) {
      alert(`Failed to export trajectory data: ${error.message}`);
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'trajectory', name: 'Trajectory', icon: '🛸' },
    { id: 'impact', name: 'Impact', icon: '💥' },
    { id: 'environmental', name: 'Environmental', icon: '🌍' },
    { id: 'comparison', name: 'Comparison', icon: '⚖️' },
  ];

  return (
    <div className='min-h-screen relative overflow-hidden'>
      <EnhancedMeteorBackground />

      {/* Navigation */}
      <GlassNav className='fixed top-0 left-0 right-0 z-50'>
        <div className='flex items-center justify-between px-6 py-4'>
          <Link
            to='/'
            className='text-xl font-bold text-white hover:text-blue-300 transition-colors enhanced-nav-item enhanced-focus'
          >
            🌌 Advanced Results
          </Link>
          <div className='flex items-center space-x-4'>
            <Link to='/simulation/advanced-setup'>
              <GlassButton variant='secondary' size='sm' className='enhanced-btn enhanced-focus'>
                🔄 New Simulation
              </GlassButton>
            </Link>
            <div className='flex items-center space-x-2'>
              <LoadingButton
                onClick={handleExportPDF}
                loading={exporting && exportType === 'PDF'}
                disabled={exporting}
                className="px-4 py-2 text-sm enhanced-btn enhanced-focus enhanced-glow"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '500'
                }}
              >
                📄 Export PDF
              </LoadingButton>
              
              <LoadingButton
                onClick={handleExportCSV}
                loading={exporting && exportType === 'CSV'}
                disabled={exporting}
                className="px-4 py-2 text-sm enhanced-btn enhanced-focus enhanced-pulse"
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '500'
                }}
              >
                📊 Export CSV
              </LoadingButton>
            </div>
          </div>
        </div>
      </GlassNav>

      <div className='pt-20 min-h-screen'>
        {/* Header */}
        <div className='px-6 py-4'>
          <GlassPanel className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-white mb-2'>
                  🔬 Advanced Simulation Results
                </h1>
                <p className='text-gray-300'>
                  Simulation ID: {results.simulationId} |{' '}
                  {new Date(results.timestamp).toLocaleString()}
                </p>
              </div>
              <div className='text-right'>
                <div className='text-sm text-gray-300'>Parameters</div>
                <div className='text-white font-medium'>
                  {parameters?.diameter}m {parameters?.composition} asteroid
                </div>
                <div className='text-white font-medium'>
                  {parameters?.velocity} km/s at {parameters?.angle}°
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Tab Navigation */}
        <div className='px-6 mb-6'>
          <GlassCard className='p-2 enhanced-card'>
            <div className='flex space-x-2'>
              {tabs.map(tab => (
                <GlassButton
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'secondary'}
                  size='sm'
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 enhanced-tab enhanced-btn enhanced-focus ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <span className='enhanced-icon'>{tab.icon}</span>
                  <span>{tab.name}</span>
                </GlassButton>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Content */}
        <div className='px-6 pb-6'>
          {dataProcessing ? (
            <div className='space-y-6'>
              <GlassCard className='p-6'>
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <ModernSpinner variant="orbit" size="large" />
                    <h3 className='text-xl font-semibold text-white mt-4 mb-2'>
                      Processing Simulation Data
                    </h3>
                    <p className='text-gray-300'>
                      Analyzing atmospheric entry, fragmentation, and impact effects...
                    </p>
                  </div>
                </div>
              </GlassCard>
              
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <SkeletonCard className="h-64" />
                <SkeletonCard className="h-64" />
                <SkeletonCard className="h-64" />
                <SkeletonCard className="h-64" />
              </div>
            </div>
          ) : activeTab === 'overview' && (
            <div className='space-y-6'>
              {/* Key Statistics */}
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  📈 Key Statistics
                </h2>
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  {chartsLoading ? (
                    <>
                      <div className='p-4 bg-white/5 rounded-lg'>
                        <SkeletonText className="h-4 w-16 mb-2" />
                        <SkeletonText className="h-6 w-20" />
                      </div>
                      <div className='p-4 bg-white/5 rounded-lg'>
                        <SkeletonText className="h-4 w-16 mb-2" />
                        <SkeletonText className="h-6 w-20" />
                      </div>
                      <div className='p-4 bg-white/5 rounded-lg'>
                        <SkeletonText className="h-4 w-16 mb-2" />
                        <SkeletonText className="h-6 w-20" />
                      </div>
                      <div className='p-4 bg-white/5 rounded-lg'>
                        <SkeletonText className="h-4 w-16 mb-2" />
                        <SkeletonText className="h-6 w-20" />
                      </div>
                    </>
                  ) : (
                    <>
                      <GlassStat
                        label='Impact Energy'
                        value={`${formatNumber(results.summary.impactEnergy / 1e15)} PJ`}
                        icon='⚡'
                      />
                      <GlassStat
                        label='TNT Equivalent'
                        value={`${formatNumber(results.environmentalEffects.tntEquivalent)} tons`}
                        icon='💥'
                      />
                      <GlassStat
                        label='Crater Diameter'
                        value={`${formatNumber(results.summary.craterDiameter)} m`}
                        icon='🕳️'
                      />
                      <GlassStat
                        label='Devastation Radius'
                        value={`${formatNumber(results.summary.devastationRadius)} m`}
                        icon='💀'
                      />
                    </>
                  )}
                </div>
              </GlassCard>

              {/* Impact Classification */}
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  🎯 Impact Classification
                </h2>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Event Type
                    </h3>
                    <div
                      className={`p-4 rounded-lg border ${
                        results.summary.airburstAltitude
                          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/10 border-red-500/20 text-red-300'
                      }`}
                    >
                      {results.summary.airburstAltitude
                        ? `🌟 Airburst at ${formatNumber(results.summary.airburstAltitude)} m`
                        : '💥 Ground Impact'}
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Tsunami Risk
                    </h3>
                    <div
                      className={`p-4 rounded-lg border ${
                        results.environmentalEffects.tsunamiRisk.risk === 'high'
                          ? 'bg-red-500/10 border-red-500/20 text-red-300'
                          : results.environmentalEffects.tsunamiRisk.risk ===
                              'moderate'
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                            : 'bg-green-500/10 border-green-500/20 text-green-300'
                      }`}
                    >
                      🌊{' '}
                      {results.environmentalEffects.tsunamiRisk.risk.toUpperCase()}{' '}
                      Risk
                      {results.environmentalEffects.tsunamiRisk
                        .estimatedWaveHeight > 0 && (
                        <div className='text-sm mt-1'>
                          Wave Height:{' '}
                          {formatNumber(
                            results.environmentalEffects.tsunamiRisk
                              .estimatedWaveHeight
                          )}{' '}
                          m
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Export Options */}
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  📤 Export Options
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <GlassButton
                    variant='primary'
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className='flex items-center justify-center space-x-2'
                  >
                    <span>📄</span>
                    <span>
                      {exporting && exportType === 'PDF'
                        ? 'Exporting...'
                        : 'PDF Report'}
                    </span>
                  </GlassButton>
                  <GlassButton
                    variant='secondary'
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className='flex items-center justify-center space-x-2'
                  >
                    <span>📊</span>
                    <span>
                      {exporting && exportType === 'CSV'
                        ? 'Exporting...'
                        : 'CSV Data'}
                    </span>
                  </GlassButton>
                  <GlassButton
                    variant='secondary'
                    onClick={handleExportTrajectory}
                    disabled={exporting || !results?.entryPhase?.trajectory}
                    className='flex items-center justify-center space-x-2'
                  >
                    <span>🛸</span>
                    <span>
                      {exporting && exportType === 'Trajectory'
                        ? 'Exporting...'
                        : 'Trajectory Data'}
                    </span>
                  </GlassButton>
                </div>
                <p className='text-gray-400 text-sm mt-3'>
                  Export simulation data in various formats for analysis and
                  reporting.
                </p>
              </GlassCard>

              {/* Quick Comparison */}
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  ⚖️ Historical Comparison
                </h2>
                <div className='space-y-3'>
                  {[
                    { name: 'Chelyabinsk (2013)', energy: 2.1e14, icon: '🌟' },
                    { name: 'Tunguska (1908)', energy: 1.5e16, icon: '🔥' },
                    { name: 'Chicxulub (66 MYA)', energy: 4.2e23, icon: '🦕' },
                  ].map(event => {
                    const ratio = results.summary.impactEnergy / event.energy;
                    return (
                      <div
                        key={event.name}
                        className='flex items-center justify-between p-3 bg-white/5 rounded-lg'
                      >
                        <div className='flex items-center space-x-3'>
                          <span className='text-xl'>{event.icon}</span>
                          <span className='text-white font-medium'>
                            {event.name}
                          </span>
                        </div>
                        <div className='text-right'>
                          <div className='text-white'>
                            {ratio > 1
                              ? `${formatNumber(ratio)}x larger`
                              : `${formatNumber(1 / ratio)}x smaller`}
                          </div>
                          <div className='text-xs text-gray-400'>
                            {formatNumber(event.energy / 1e15)} PJ
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'trajectory' && trajectoryData && (
            <div className='space-y-6'>
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  🛸 Atmospheric Entry Trajectory
                </h2>
                <div className='h-96 relative'>
                  {chartsLoading ? (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg'>
                      <div className='text-center'>
                        <ModernSpinner variant="pulse" size="medium" />
                        <p className='text-gray-300 mt-2'>Rendering trajectory chart...</p>
                      </div>
                    </div>
                  ) : (
                    <Line
                      data={trajectoryData}
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            ticks: { color: 'rgba(255, 255, 255, 0.6)' },
                            grid: { drawOnChartArea: false },
                          },
                        },
                      }}
                    />
                  )}
                </div>
              </GlassCard>

              {results.entryPhase.fragments.length > 0 && (
                <GlassCard className='p-6'>
                  <h2 className='text-xl font-semibold text-white mb-4'>
                    💥 Fragmentation Analysis
                  </h2>
                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                    <GlassStat
                      label='Fragment Count'
                      value={results.entryPhase.fragments.length}
                      icon='🔢'
                    />
                    <GlassStat
                      label='Airburst Altitude'
                      value={`${formatNumber(results.entryPhase.airburstAltitude)} m`}
                      icon='💥'
                    />
                    <GlassStat
                      label='Max Dynamic Pressure'
                      value={`${formatNumber(results.entryPhase.maxDynamicPressure / 1000)} kPa`}
                      icon='🌪️'
                    />
                    <GlassStat
                      label='Survival Rate'
                      value={`${(
                        (results.entryPhase.finalMass /
                          (parameters?.diameter
                            ? (4 / 3) *
                              Math.PI *
                              Math.pow(parameters.diameter / 2, 3) *
                              3500
                            : 1)) *
                        100
                      ).toFixed(1)}%`}
                      icon='🎯'
                    />
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'impact' && (
            <div className='space-y-6'>
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  💥 Impact Effects
                </h2>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Crater Formation
                    </h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-gray-300'>Diameter:</span>
                        <span className='text-white'>
                          {formatNumber(results.impactPhase.crater.diameter)} m
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-300'>Depth:</span>
                        <span className='text-white'>
                          {formatNumber(results.impactPhase.crater.depth)} m
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-300'>Ejecta Volume:</span>
                        <span className='text-white'>
                          {formatNumber(
                            results.impactPhase.crater.ejectaVolume
                          )}{' '}
                          m³
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Seismic Effects
                    </h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-gray-300'>Magnitude:</span>
                        <span className='text-white'>
                          {results.impactPhase.seismic.magnitude.toFixed(1)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-300'>Duration:</span>
                        <span className='text-white'>
                          {formatNumber(results.impactPhase.seismic.duration)} s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {shockwaveData && (
                <GlassCard className='p-6'>
                  <h2 className='text-xl font-semibold text-white mb-4'>
                    🌪️ Shockwave Propagation
                  </h2>
                  <div className='h-96 relative'>
                    {chartsLoading ? (
                      <div className='absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg'>
                        <div className='text-center'>
                          <ModernSpinner variant="pulse" size="medium" />
                          <p className='text-gray-300 mt-2'>Rendering shockwave chart...</p>
                        </div>
                      </div>
                    ) : (
                      <Bar data={shockwaveData} options={chartOptions} />
                    )}
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'environmental' && (
            <div className='space-y-6'>
              <GlassCard className='p-6'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  🌍 Environmental Impact
                </h2>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Climate Effects
                    </h3>
                    <div className='space-y-3'>
                      <div className='p-3 bg-blue-500/10 rounded-lg border border-blue-500/20'>
                        <div className='text-blue-300 font-medium'>
                          Global Cooling
                        </div>
                        <div className='text-white'>
                          {results.environmentalEffects.climateEffects.globalCooling.toFixed(
                            2
                          )}
                          °C
                        </div>
                      </div>
                      <div className='p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20'>
                        <div className='text-yellow-300 font-medium'>
                          Dust Cloud Duration
                        </div>
                        <div className='text-white'>
                          {formatNumber(
                            results.environmentalEffects.climateEffects
                              .dustCloudDuration
                          )}{' '}
                          days
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-medium text-white mb-3'>
                      Atmospheric Effects
                    </h3>
                    <div className='space-y-3'>
                      <div className='p-3 bg-purple-500/10 rounded-lg border border-purple-500/20'>
                        <div className='text-purple-300 font-medium'>
                          Ionospheric Disturbance
                        </div>
                        <div className='text-white'>
                          {
                            results.environmentalEffects.atmosphericDisturbance
                              .ionosphericDisturbance
                          }
                        </div>
                      </div>
                      <div className='p-3 bg-red-500/10 rounded-lg border border-red-500/20'>
                        <div className='text-red-300 font-medium'>
                          Ozone Damage
                        </div>
                        <div className='text-white'>
                          {
                            results.environmentalEffects.climateEffects
                              .ozoneDamage
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSimulationResults;
