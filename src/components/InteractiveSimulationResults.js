import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useSimulation } from '../context/SimulationContext';
import { exportService } from '../services/exportService';
import { calculateComprehensiveImpact } from '../utils/corrected-physics';

import ImpactDataChart from './ImpactDataChart';
import ImpactMap2D from './ImpactMap2D';
import Orbit3DView from './Orbit3DView';
import EnhancedMeteorBackground from './ui/EnhancedMeteorBackground';
import SimulationErrorBoundary from './ui/SimulationErrorBoundary';
import CalculationErrorBoundary from './ui/CalculationErrorBoundary';
import MoveableNavigationPanel from './MoveableNavigationPanel';

import '../styles/glassmorphic.css';

// Enhanced Error Boundary Component for InteractiveSimulationResults
class ResultsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('InteractiveSimulationResults Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 max-w-md text-center">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              📊
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Results Error</h2>
            <p className="text-gray-300 mb-6">
              There was an error displaying the simulation results. This could be due to:
            </p>
            <ul className="text-gray-400 text-sm mb-6 text-left">
              <li>• Invalid simulation data</li>
              <li>• Network connectivity issues</li>
              <li>• Calculation errors</li>
              <li>• Browser compatibility issues</li>
            </ul>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Utility functions for formatting (calculations moved to corrected-physics.js)

const formatNumber = (num) => {
  if (!num || isNaN(num)) return 'N/A';
  return num.toLocaleString();
};

const formatEnergy = (energy) => {
  if (!energy || isNaN(energy)) return 'Calculating...';
  if (energy >= 1e18) return `${(energy / 1e18).toFixed(1)} Exajoules`;
  if (energy >= 1e15) return `${(energy / 1e15).toFixed(1)} Petajoules`;
  if (energy >= 1e12) return `${(energy / 1e12).toFixed(1)} Terajoules`;
  return `${energy.toExponential(2)} Joules`;
};

const formatDistance = (distance) => {
  if (!distance || isNaN(distance)) return 'N/A';
  if (distance >= 1) return `${distance.toFixed(1)} km`;
  return `${(distance * 1000).toFixed(0)} m`;
};

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
  const [activeView, setActiveView] = useState('detailed'); // detailed, 3d, map, charts
  const [isRealTime, setIsRealTime] = useState(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState('energy');
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('');
  const [currentPhase, setCurrentPhase] = useState('entry');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [calculationStage, setCalculationStage] = useState('');
  const [showShockwave, setShowShockwave] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  // Real-time simulation state
  const [realTimeData, setRealTimeData] = useState(null);

  // Auto-hide loading after 5 seconds
  useEffect(() => {
    if (loading || isCalculating) {
      const timer = setTimeout(() => {
        setIsCalculating(false);
        // If using external loading state, you might need to call a function to set loading to false
      }, 5000); // 5 seconds
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [loading, isCalculating]);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const intervalRef = useRef(null);

  // Animation and effects
  const [impactAnimation, setImpactAnimation] = useState(false);
  const [shockwaveRadius, setShockwaveRadius] = useState(0);
  const [showImpactEffects, setShowImpactEffects] = useState(false);

  // Calculate detailed impact data using corrected physics
  const impactData = React.useMemo(() => {
    if (!asteroidParams || !simulationResults) {
      return null;
    }

    // Set calculation state
    setIsCalculating(true);
    setCalculationStage('Calculating comprehensive impact analysis...');
    setCalculationProgress(10);

    try {
      // Use corrected physics calculations
      const comprehensiveImpact = calculateComprehensiveImpact(asteroidParams, simulationResults);
      
      // Update calculation progress
      setCalculationStage('Processing impact effects...');
      setCalculationProgress(50);
      
      // Simulate calculation delay for visual feedback
      setTimeout(() => {
        setCalculationStage('Finalizing damage assessment...');
        setCalculationProgress(90);
      }, 100);
      
      setTimeout(() => {
        setIsCalculating(false);
        setCalculationProgress(100);
        setCalculationStage('Complete');
      }, 200);

      // Transform data to match existing UI structure
      return {
        energy: comprehensiveImpact.energy,
        mass: comprehensiveImpact.mass,
        crater: {
          diameter: comprehensiveImpact.crater.diameter,
          depth: comprehensiveImpact.crater.depth,
          casualties: comprehensiveImpact.casualties.crater,
          impactSpeed: (asteroidParams.velocity || 20) * 2.237, // Convert km/s to mph
          tntEquivalent: comprehensiveImpact.tnt.tntMegatons,
          frequency: comprehensiveImpact.frequency
        },
        fireball: {
          diameter: comprehensiveImpact.thermal.fireballRadius * 2,
          casualties: comprehensiveImpact.casualties.fireball,
          thirdDegreeBurns: comprehensiveImpact.casualties.thermal,
          secondDegreeBurns: Math.floor(comprehensiveImpact.casualties.thermal * 1.5),
          clothesFireRadius: comprehensiveImpact.thermal.clothesIgnitionRadius,
          treesFireRadius: comprehensiveImpact.thermal.treesIgnitionRadius
        },
        shockwave: {
          decibels: comprehensiveImpact.shockwave.decibelsAt1km,
          casualties: comprehensiveImpact.casualties.shockwave,
          lungDamageRadius: comprehensiveImpact.shockwave.lungDamageRadius,
          eardrumRuptureRadius: comprehensiveImpact.shockwave.eardrumRuptureRadius,
          buildingCollapseRadius: comprehensiveImpact.shockwave.buildingCollapseRadius,
          homeCollapseRadius: comprehensiveImpact.shockwave.windowBreakageRadius
        },
        windBlast: {
          peakSpeed: comprehensiveImpact.wind.peakWindSpeedMph,
          casualties: comprehensiveImpact.casualties.wind,
          jupiterWindRadius: comprehensiveImpact.wind.hurricaneWindRadius,
          leveledHomesRadius: comprehensiveImpact.wind.tornadoWindRadius,
          tornadoRadius: comprehensiveImpact.wind.tornadoWindRadius,
          treesDownRadius: comprehensiveImpact.wind.treeDamageRadius
        },
        earthquake: {
          magnitude: comprehensiveImpact.seismic.magnitude,
          casualties: comprehensiveImpact.casualties.seismic,
          feltRadius: comprehensiveImpact.seismic.feltRadius
        },
        tnt: comprehensiveImpact.tnt
      };
    } catch (error) {
      console.error('Error calculating impact data:', error);
      setIsCalculating(false);
      return null;
    }
  }, [simulationResults, asteroidParams]);

  useEffect(() => {
    if (impactData && !showImpactEffects) {
      const timer = setTimeout(() => {
        setShowImpactEffects(true);
        setImpactAnimation(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [impactData, showImpactEffects]);

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

    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress += 2 * animationSpeed;
      if (progress >= 100) {
        progress = 0;
        setCurrentPhase(prev => {
          const phases = ['entry', 'heating', 'fragmentation', 'impact', 'aftermath'];
          const currentIndex = phases.indexOf(prev);
          return phases[(currentIndex + 1) % phases.length];
        });
      }

      setSimulationProgress(progress);
      
      // Use real NASA data if available, otherwise simulate
      let realTimeUpdate = {};
      
      if (nasaAsteroidData && nasaAsteroidData.length > 0) {
        // Use actual NASA asteroid data for real-time simulation
        const currentAsteroid = nasaAsteroidData[0]; // Use first available asteroid
        const phaseMultiplier = progress / 100;
        
        realTimeUpdate = {
          altitude: Math.max(0, 150 - (progress * 1.5)), // Atmospheric entry altitude
          velocity: currentAsteroid.velocity * (1 + phaseMultiplier * 0.3), // Velocity increases during entry
          temperature: 300 + progress * 75, // Temperature increases with atmospheric friction
          asteroidName: currentAsteroid.name,
          asteroidId: currentAsteroid.id,
          diameter: currentAsteroid.diameter,
          isPotentiallyHazardous: currentAsteroid.isPotentiallyHazardous,
          missDistance: currentAsteroid.missDistance,
          approachDate: currentAsteroid.approachDate,
          orbitClass: currentAsteroid.orbitClass,
          source: 'nasa-live'
        };
      } else {
        // Fallback to simulated data
        realTimeUpdate = {
          altitude: Math.max(0, 100 - progress),
          velocity: 20 + Math.sin(progress * 0.1) * 5,
          temperature: 300 + progress * 50,
          source: 'simulated'
        };
      }

      setRealTimeData(realTimeUpdate);

      // Update shockwave animation
      setShockwaveRadius(progress * 2);
    }, 100 / animationSpeed);
  };

  const stopRealTimeSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    setExportType('PDF');

    try {
      await exportService.exportToPDF(simulationResults, asteroidParams, impactData);
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
    setExporting(true);
    setExportType('CSV');

    try {
      await exportService.exportToCSV(simulationResults, asteroidParams, impactData);
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
    const energy = simulationResults?.energy || simulationResults?.impactEnergy;
    if (!energy) {
      return 'Unknown';
    }

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

  // Render detailed impact sections
  const renderCraterSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
    >
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ rotate: impactAnimation ? [0, 360] : 0 }}
          transition={{ duration: 2, repeat: impactAnimation ? Infinity : 0 }}
          className="text-4xl mr-4"
        >
          🕳️
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold text-white">Crater Impact</h3>
          <p className="text-gray-300">Direct impact zone and crater formation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-red-400 mb-2">
            {impactData?.crater.diameter.toFixed(1)} miles
          </div>
          <div className="text-gray-300 text-sm">Crater Diameter</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {formatNumber(impactData?.crater.casualties)}
          </div>
          <div className="text-gray-300 text-sm">People Vaporized</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {(impactData?.crater.depth * 3280.84).toFixed(0)} ft
          </div>
          <div className="text-gray-300 text-sm">Crater Depth</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-green-400 mb-2">
            {formatNumber(impactData?.crater.impactSpeed.toFixed(0))} mph
          </div>
          <div className="text-gray-300 text-sm">Impact Speed</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {(impactData?.crater.tntEquivalent / 1e9).toFixed(0)} Gigatons
          </div>
          <div className="text-gray-300 text-sm">TNT Equivalent</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {formatNumber(impactData?.crater.frequency.toFixed(0))} years
          </div>
          <div className="text-gray-300 text-sm">Average Frequency</div>
        </motion.div>
      </div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: showImpactEffects ? '100%' : 0 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30"
      >
        <p className="text-white text-center font-medium">
          💥 More energy was released than the world consumes in a year
        </p>
      </motion.div>
    </motion.div>
  );

  const renderFireballSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
    >
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ 
            scale: impactAnimation ? [1, 1.2, 1] : 1,
            rotate: impactAnimation ? [0, 180, 360] : 0 
          }}
          transition={{ duration: 3, repeat: impactAnimation ? Infinity : 0 }}
          className="text-4xl mr-4"
        >
          🔥
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold text-white">Fireball Effects</h3>
          <p className="text-gray-300">Thermal radiation and fire damage zones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-red-400 mb-2">
            {impactData?.fireball.diameter.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Fireball Diameter</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {formatNumber(impactData?.fireball.casualties)}
          </div>
          <div className="text-gray-300 text-sm">Deaths from Fireball</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-red-300 mb-2">
            {formatNumber(impactData?.fireball.thirdDegreeBurns)}
          </div>
          <div className="text-gray-300 text-sm">3rd Degree Burns</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-orange-300 mb-2">
            {formatNumber(impactData?.fireball.secondDegreeBurns)}
          </div>
          <div className="text-gray-300 text-sm">2nd Degree Burns</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {impactData?.fireball.clothesFireRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Clothes Catch Fire</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-green-400 mb-2">
            {impactData?.fireball.treesFireRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Trees Catch Fire</div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderShockwaveSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
    >
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ 
            scale: impactAnimation ? [1, 1.3, 1] : 1 
          }}
          transition={{ duration: 1.5, repeat: impactAnimation ? Infinity : 0 }}
          className="text-4xl mr-4"
        >
          💥
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold text-white">Shock Wave</h3>
          <p className="text-gray-300">Pressure wave and structural damage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-red-400 mb-2">
            {impactData?.shockwave.decibels.toFixed(0)} dB
          </div>
          <div className="text-gray-300 text-sm">Shock Wave Intensity</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {formatNumber(impactData?.shockwave.casualties)}
          </div>
          <div className="text-gray-300 text-sm">Deaths from Shock Wave</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {impactData?.shockwave.lungDamageRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Lung Damage Radius</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {impactData?.shockwave.eardrumRuptureRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Eardrum Rupture</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-gray-400 mb-2">
            {impactData?.shockwave.buildingCollapseRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Building Collapse</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {impactData?.shockwave.homeCollapseRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Home Collapse</div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderWindBlastSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
    >
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ 
            x: impactAnimation ? [-5, 5, -5] : 0 
          }}
          transition={{ duration: 2, repeat: impactAnimation ? Infinity : 0 }}
          className="text-4xl mr-4"
        >
          💨
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold text-white">Wind Blast</h3>
          <p className="text-gray-300">Extreme winds and destruction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-cyan-400 mb-2">
            {formatNumber(impactData?.windBlast.peakSpeed.toFixed(0))} mph
          </div>
          <div className="text-gray-300 text-sm">Peak Wind Speed</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-red-400 mb-2">
            {formatNumber(impactData?.windBlast.casualties)}
          </div>
          <div className="text-gray-300 text-sm">Deaths from Wind Blast</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {impactData?.windBlast.jupiterWindRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Jupiter-Speed Winds</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {impactData?.windBlast.leveledHomesRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Homes Leveled</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {impactData?.windBlast.tornadoRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">EF5 Tornado Winds</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-green-400 mb-2">
            {impactData?.windBlast.treesDownRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Trees Knocked Down</div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderEarthquakeSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.0 }}
      className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
    >
      <div className="flex items-center mb-6">
        <motion.div
          animate={{ 
            y: impactAnimation ? [-2, 2, -2] : 0 
          }}
          transition={{ duration: 1, repeat: impactAnimation ? Infinity : 0 }}
          className="text-4xl mr-4"
        >
          🌍
        </motion.div>
        <div>
          <h3 className="text-2xl font-bold text-white">Seismic Effects</h3>
          <p className="text-gray-300">Earthquake and ground motion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-amber-400 mb-2">
            {impactData?.earthquake.magnitude.toFixed(1)}
          </div>
          <div className="text-gray-300 text-sm">Earthquake Magnitude</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-red-400 mb-2">
            {formatNumber(impactData?.earthquake.casualties)}
          </div>
          <div className="text-gray-300 text-sm">Deaths from Earthquake</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/5 p-4 rounded-lg border border-white/10"
        >
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {impactData?.earthquake.feltRadius.toFixed(0)} miles
          </div>
          <div className="text-gray-300 text-sm">Felt Distance</div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderDetailedView = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Impact Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center p-8 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-xl border border-red-500/30"
      >
        <motion.h1
          animate={{ 
            scale: [1, 1.05, 1],
            textShadow: [
              '0 0 10px rgba(255,255,255,0.5)',
              '0 0 20px rgba(255,255,255,0.8)',
              '0 0 10px rgba(255,255,255,0.5)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
        >
          IMPACT ANALYSIS
        </motion.h1>
        <div className={`text-2xl font-bold mb-2 ${getImpactSeverityColor()}`}>
          {getImpactSeverity()} Impact Event
        </div>
        <p className="text-gray-300 text-lg">
          Comprehensive analysis of asteroid impact effects and casualties
        </p>
      </motion.div>

      {/* Main Content Grid - Analytics and Map Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column - Impact Analytics */}
        <div className="space-y-8">
          {/* Detailed Impact Sections */}
          {impactData ? (
            <CalculationErrorBoundary 
              calculationType="impact-analysis"
              onRetry={() => window.location.reload()}
              onReset={() => navigate('/simulation')}
            >
              <div className="space-y-6">
              {/* Real-Time NASA Data Display */}
              {isRealTime && realTimeData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-md border border-blue-400/30 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">🛰️</div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Live NASA Data</h3>
                        <p className="text-blue-300 text-sm">
                          {realTimeData.source === 'nasa-live' ? 'Real-time asteroid tracking' : 'Simulated data'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium">LIVE</span>
                    </div>
                  </div>

                  {realTimeData.source === 'nasa-live' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-lg font-bold text-blue-400">{realTimeData.asteroidName}</div>
                        <div className="text-gray-300 text-xs">Asteroid Name</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-lg font-bold text-orange-400">
                          {realTimeData.diameter ? `${(realTimeData.diameter / 1000).toFixed(2)} km` : 'N/A'}
                        </div>
                        <div className="text-gray-300 text-xs">Diameter</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-lg font-bold text-red-400">
                          {realTimeData.isPotentiallyHazardous ? 'YES' : 'NO'}
                        </div>
                        <div className="text-gray-300 text-xs">Potentially Hazardous</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg">
                        <div className="text-lg font-bold text-purple-400">{realTimeData.orbitClass}</div>
                        <div className="text-gray-300 text-xs">Orbit Class</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {realTimeData.altitude?.toFixed(1)} km
                      </div>
                      <div className="text-gray-300 text-sm">Current Altitude</div>
                      <div className="text-xs text-gray-400 mt-1">Phase: {currentPhase}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {realTimeData.velocity?.toFixed(1)} km/s
                      </div>
                      <div className="text-gray-300 text-sm">Velocity</div>
                      <div className="text-xs text-gray-400 mt-1">Relative to Earth</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {realTimeData.temperature?.toFixed(0)}°K
                      </div>
                      <div className="text-gray-300 text-sm">Surface Temperature</div>
                      <div className="text-xs text-gray-400 mt-1">Atmospheric heating</div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-6">
                {renderCraterSection()}
                {renderFireballSection()}
                {renderShockwaveSection()}
                {renderWindBlastSection()}
                {renderEarthquakeSection()}
              </div>
            </div>
            </CalculationErrorBoundary>
          ) : simulationResults ? (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
        >
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">📊</div>
            <div>
              <h3 className="text-2xl font-bold text-white">Basic Impact Statistics</h3>
              <p className="text-gray-300">Core simulation results</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 p-4 rounded-lg border border-white/10"
            >
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {simulationResults.energy ? 
                  `${(simulationResults.energy / 1e15).toFixed(2)} MT` : 
                  'N/A'
                }
              </div>
              <div className="text-gray-300 text-sm">Impact Energy</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 p-4 rounded-lg border border-white/10"
            >
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {simulationResults.craterDiameter ? 
                  `${(simulationResults.craterDiameter / 1000).toFixed(1)} km` : 
                  'N/A'
                }
              </div>
              <div className="text-gray-300 text-sm">Crater Diameter</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 p-4 rounded-lg border border-white/10"
            >
              <div className="text-3xl font-bold text-green-400 mb-2">
                {impactLocation?.latitude && impactLocation?.longitude ? 
                  `${impactLocation.latitude.toFixed(2)}°, ${impactLocation.longitude.toFixed(2)}°` : 
                  'N/A'
                }
              </div>
              <div className="text-gray-300 text-sm">Impact Location</div>
            </motion.div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <p className="text-white text-center">
              💡 For detailed impact analysis including casualties and damage zones, ensure all asteroid parameters are properly configured.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-center"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-white mb-4">No Simulation Data</h3>
          <p className="text-gray-300 mb-6">
            Run a simulation to see detailed impact statistics and analysis.
          </p>
          <button
            onClick={() => navigate('/simulation')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            🚀 Run Simulation
          </button>
        </motion.div>
      )}

      {/* Total Casualties Summary */}
      {impactData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="p-8 bg-gradient-to-r from-red-600/30 to-orange-600/30 rounded-xl border border-red-500/50"
        >
          <h3 className="text-3xl font-bold text-white mb-6 text-center">Total Impact Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">
                {formatNumber(
                  (impactData.crater.casualties + 
                   impactData.fireball.casualties + 
                   impactData.shockwave.casualties + 
                   impactData.windBlast.casualties + 
                   impactData.earthquake.casualties)
                )}
              </div>
              <div className="text-gray-300">Total Estimated Deaths</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">
                {formatNumber(
                  (impactData.fireball.thirdDegreeBurns + 
                   impactData.fireball.secondDegreeBurns)
                )}
              </div>
              <div className="text-gray-300">Total Burn Injuries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {impactData.windBlast.treesDownRadius.toFixed(0)} miles
              </div>
              <div className="text-gray-300">Maximum Damage Radius</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {(impactData.crater.tntEquivalent / 15000).toFixed(0)}x
              </div>
              <div className="text-gray-300">Hiroshima Bomb Equivalent</div>
            </div>
          </div>
        </motion.div>
      )}
        </div>

        {/* Right Column - 2D Impact Map (Always Visible) */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🗺️</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Impact Zone Map</h3>
                    <p className="text-gray-300 text-sm">Real-time visualization of impact effects</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">Live Data</span>
                </div>
              </div>
            </div>
            <div className="h-[600px] relative">
              <ImpactMap2D />
              {/* Map overlay with quick stats */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Crater Zone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Fireball Effects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Shockwave Zone</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Seismic Effects</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Action Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
          >
            <h4 className="text-lg font-bold text-white mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveView('3d')}
                className="flex items-center justify-center space-x-2 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors text-white"
              >
                <span>🌍</span>
                <span className="text-sm">3D View</span>
              </button>
              <button
                onClick={() => setActiveView('charts')}
                className="flex items-center justify-center space-x-2 p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-colors text-white"
              >
                <span>📊</span>
                <span className="text-sm">Charts</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  // Loading state with enhanced animations
  if (loading || isCalculating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <EnhancedMeteorBackground />
        <motion.div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-6"
          >
            🌌
          </motion.div>
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">
              {isCalculating ? 'Calculating Impact Effects...' : 'Processing Simulation...'}
            </h2>
            <p className="text-gray-300 mb-6">
              {calculationStage || 'Processing simulation data'}
            </p>
            
            {/* Progress bar */}
            <div className="w-80 bg-white/20 rounded-full h-3 mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculationProgress}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              />
            </div>
            
            <div className="text-sm text-gray-400">
              {calculationProgress}% Complete
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // No results state
  if (!simulationResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <EnhancedMeteorBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 max-w-md text-center"
        >
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Simulation Data</h2>
          <p className="text-gray-300 mb-6">
            Please run a simulation first to see the impact analysis.
          </p>
          <button
            onClick={() => navigate('/simulation')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            🎯 Start Simulation
          </button>
        </motion.div>
      </div>
    );
  }

  // Render loading overlay for calculations
  const renderCalculationOverlay = () => {
    if (!isCalculating) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center max-w-md mx-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-4xl mb-4"
            >
              ⚡
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">
              Calculating Impact Effects
            </h3>
            <p className="text-gray-300 mb-4">{calculationStage}</p>
            
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calculationProgress}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              />
            </div>
            
            <div className="text-sm text-gray-400">
              {calculationProgress}% Complete
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <SimulationErrorBoundary 
      componentName="Interactive Simulation Results"
      onNavigateHome={() => navigate('/')}
      onReset={() => window.location.reload()}
    >
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <EnhancedMeteorBackground />
        {renderCalculationOverlay()}
      
      {/* Animated shockwave effect */}
      <AnimatePresence>
        {showImpactEffects && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 20, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,100,0,0.3) 0%, transparent 70%)',
              transformOrigin: 'center center'
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between mb-8 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
        >
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Impact Results</h1>
          </div>

          <div className="flex items-center space-x-2">
            {['detailed', '3d', 'map', 'charts'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                  activeView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeView === 'detailed' && (
            <motion.div
              key="detailed"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
            >
              {renderDetailedView()}
            </motion.div>
          )}

          {activeView === '3d' && (
            <motion.div
              key="3d"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
              className="h-[600px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
            >
              <Orbit3DView />
            </motion.div>
          )}

          {activeView === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
              className="h-[600px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
            >
              <ImpactMap2D />
            </motion.div>
          )}

          {activeView === 'charts' && (
            <motion.div
              key="charts"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
              className="h-[600px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden"
            >
              <ImpactDataChart />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Controls */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl"
        >
          <h3 className="text-xl font-bold text-white mb-4">Export Results</h3>
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <span>📄</span>
              <span>{exporting && exportType === 'PDF' ? 'Exporting...' : 'Export PDF Report'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <span>📊</span>
              <span>{exporting && exportType === 'CSV' ? 'Exporting...' : 'Export CSV Data'}</span>
            </motion.button>
          </div>
          <p className="text-gray-400 text-sm mt-3">
            Export comprehensive impact analysis for further study and reporting.
          </p>
        </motion.div>
      </div>
    </div>
    
    {/* Moveable Navigation Panel */}
    <MoveableNavigationPanel />
    </SimulationErrorBoundary>
  );
};

// Wrap the component with error boundary
const InteractiveSimulationResultsWithErrorBoundary = () => (
  <ResultsErrorBoundary>
    <InteractiveSimulationResults />
  </ResultsErrorBoundary>
);

export default InteractiveSimulationResultsWithErrorBoundary;
