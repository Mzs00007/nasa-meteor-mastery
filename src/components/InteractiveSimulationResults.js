import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSimulation } from '../context/SimulationContext';
import { exportService } from '../services/exportService';

import ImpactDataChart from './ImpactDataChart';
import ImpactMap2D from './ImpactMap2D';
import Orbit3DView from './Orbit3DView';
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';

import '../styles/glassmorphic.css';

const InteractiveSimulationResults = () => {
  const navigate = useNavigate();
  
  const {
    simulationResults,
    impactLocation,
    asteroidParams,
    loading,
    runSimulation,
    simulationHistory,
  } = useSimulation();

  // View state management
  const [activeView, setActiveView] = useState('overview'); // overview, 3d, map, charts, timeline
  const [isRealTime, setIsRealTime] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('');
  const [currentPhase, setCurrentPhase] = useState('entry');

  // Real-time simulation state
  const [realTimeData, setRealTimeData] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const intervalRef = useRef(null);

  // Animation and effects
  const [impactAnimation, setImpactAnimation] = useState(false);
  const [shockwaveRadius, setShockwaveRadius] = useState(0);

  useEffect(() => {
    if (isRealTime && simulationResults) {
      startRealTimeSimulation();
    } else {
      stopRealTimeSimulation();
    }

    return () => stopRealTimeSimulation();
  }, [isRealTime, simulationResults]);

  const startRealTimeSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setSimulationProgress(prev => {
        const newProgress = prev + 2 * animationSpeed;
        if (newProgress >= 100) {
          triggerImpactAnimation();
          return 0;
        }
        return newProgress;
      });

      // Update real-time metrics
      setRealTimeData(prev => ({
        ...prev,
        timestamp: Date.now(),
        velocity: simulationResults?.velocity + (Math.random() - 0.5) * 0.1,
        altitude: Math.max(
          0,
          (simulationResults?.altitude || 100) - simulationProgress
        ),
        temperature: 1500 + Math.random() * 500,
      }));
    }, 100);
  };

  const stopRealTimeSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const triggerImpactAnimation = () => {
    setImpactAnimation(true);
    setShockwaveRadius(0);

    // Animate shockwave expansion
    const shockwaveInterval = setInterval(() => {
      setShockwaveRadius(prev => {
        if (prev >= 100) {
          clearInterval(shockwaveInterval);
          setImpactAnimation(false);
          return 0;
        }
        return prev + 5;
      });
    }, 50);
  };

  const formatEnergy = energy => {
    if (!energy) {
      return 'N/A';
    }
    if (energy < 1e12) {
      return `${(energy / 1e9).toFixed(2)} GJ`;
    } else if (energy < 1e15) {
      return `${(energy / 1e12).toFixed(2)} TJ`;
    }
    return `${(energy / 1e15).toFixed(2)} PJ`;
  };

  const formatDistance = distance => {
    if (!distance) {
      return 'N/A';
    }
    if (distance < 1000) {
      return `${distance.toFixed(0)} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (!simulationResults) {
      return;
    }

    setExporting(true);
    setExportType('PDF');

    try {
      await exportService.exportToPDF(simulationResults, asteroidParams);
      alert('PDF report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF report. Please try again.');
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  const handleExportCSV = async () => {
    if (!simulationResults) {
      return;
    }

    setExporting(true);
    setExportType('CSV');

    try {
      await exportService.exportToCSV(simulationResults, asteroidParams);
      alert('CSV data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export CSV data. Please try again.');
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  const getImpactSeverity = () => {
    if (!simulationResults?.impactEnergy) {
      return 'Unknown';
    }
    const energy = simulationResults.impactEnergy;

    if (energy < 1e12) {
      return 'Minimal';
    }
    if (energy < 1e15) {
      return 'Moderate';
    }
    if (energy < 1e18) {
      return 'Severe';
    }
    return 'Catastrophic';
  };

  const getImpactSeverityColor = () => {
    const severity = getImpactSeverity();
    switch (severity) {
      case 'Minimal':
        return 'text-green-400';
      case 'Moderate':
        return 'text-yellow-400';
      case 'Severe':
        return 'text-orange-400';
      case 'Catastrophic':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderOverviewPanel = () => (
    <div className='space-y-6'>
      {/* Impact Summary */}
      <div 
        className='p-6'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-bold text-white'>Impact Summary</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactSeverityColor()} bg-white/10`}
          >
            {getImpactSeverity()} Impact
          </div>
        </div>

        <div className='glass-stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💥</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {formatEnergy(simulationResults?.impactEnergy)}
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Impact Energy</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🕳️</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {formatDistance(simulationResults?.craterDiameter)}
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Crater Diameter</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {`${simulationResults?.velocity?.toFixed(2) || 'N/A'} km/s`}
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Impact Velocity</div>
          </div>
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🌍</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {`M ${simulationResults?.seismicMagnitude?.toFixed(1) || 'N/A'}`}
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Seismic Magnitude</div>
          </div>
        </div>
      </div>

      {/* Real-time Simulation Controls */}
      <div 
        className='p-6'
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className='realtime-controls flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4'>
          <h3 className='text-xl font-bold text-white'>Real-time Simulation</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#D1D5DB', fontSize: '14px' }}>Live Mode</span>
            <div 
              onClick={() => setIsRealTime(!isRealTime)}
              style={{
                width: '48px',
                height: '24px',
                background: isRealTime ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: isRealTime ? '26px' : '2px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </div>
        </div>

        {isRealTime && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-300'>Simulation Progress</span>
              <span className='text-white font-medium'>
                {simulationProgress.toFixed(0)}%
              </span>
            </div>
            <div 
              className='mb-4'
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                height: '8px'
              }}
            >
              <div 
                style={{
                  background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
                  height: '100%',
                  width: `${simulationProgress}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-400'>
                  {realTimeData?.velocity?.toFixed(2) || '0.00'}
                </div>
                <div className='text-sm text-gray-400'>Velocity (km/s)</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-400'>
                  {realTimeData?.altitude?.toFixed(0) || '0'}
                </div>
                <div className='text-sm text-gray-400'>Altitude (km)</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-400'>
                  {realTimeData?.temperature?.toFixed(0) || '0'}
                </div>
                <div className='text-sm text-gray-400'>Temperature (K)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environmental Impact */}
      {simulationResults && (
        <div 
          className='p-6'
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h3 className='text-xl font-bold text-white mb-4'>
            Environmental Impact
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-300'>Blast Radius</span>
                <span className='text-white'>
                  {formatDistance(simulationResults.blastRadius)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-300'>Thermal Radiation</span>
                <span className='text-white'>
                  {formatDistance(simulationResults.thermalRadius)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-300'>Ejecta Range</span>
                <span className='text-white'>
                  {formatDistance(simulationResults.ejectaRange)}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-300'>Affected Population</span>
                <span className='text-white'>
                  {simulationResults.affectedPopulation?.toLocaleString() ||
                    'N/A'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-300'>Economic Impact</span>
                <span className='text-white'>
                  ${simulationResults.economicImpact?.toLocaleString() || 'N/A'}
                  B
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-300'>Recovery Time</span>
                <span className='text-white'>
                  {simulationResults.recoveryTime || 'N/A'} years
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      {simulationResults && (
        <div 
          className='p-6'
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h3 className='text-xl font-bold text-white mb-4'>📤 Export Data</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className='flex items-center justify-center space-x-2'
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: exporting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                opacity: exporting ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!exporting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!exporting) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              <span>📄</span>
              <span>
                {exporting && exportType === 'PDF'
                  ? 'Exporting...'
                  : 'Export PDF Report'}
              </span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className='flex items-center justify-center space-x-2'
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: exporting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                opacity: exporting ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!exporting) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!exporting) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              <span>📊</span>
              <span>
                {exporting && exportType === 'CSV'
                  ? 'Exporting...'
                  : 'Export CSV Data'}
              </span>
            </button>
          </div>
          <p className='text-gray-400 text-sm mt-3'>
            Export simulation results for analysis and reporting.
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveSimulationResults;
