import React, { useState, useEffect } from 'react';
import { AdvancedPhysicsEngine } from '../../utils/AdvancedPhysicsEngine';
import { useAnimations, useEntranceAnimation } from '../../hooks/useAnimations';
import * as animations from '../../utils/animations';
import './SimulationProcessVisualization.css';

const SimulationProcessVisualization = ({ 
  isVisible = false, 
  onComplete = () => {},
  simulationData = null,
  asteroidParams = {},
  impactLocation = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stepResults, setStepResults] = useState({});
  const [physicsEngine] = useState(new AdvancedPhysicsEngine());

  // Animation hooks
  const { 
    animateStaggerFadeIn, 
    animatePulse, 
    animateProgressBar,
    animateTypewriter,
    animateBounceIn 
  } = useAnimations();
  const containerRef = useEntranceAnimation({ type: 'slideInTop', delay: 300 });

  const steps = [
    {
      id: 1,
      title: "Parameter Validation",
      description: "Validating asteroid parameters and impact location",
      icon: "🔍",
      duration: 1500,
      details: "Checking diameter, velocity, composition, and target coordinates",
      calculation: async () => {
        // Actual parameter validation
        const validation = {
          diameter: asteroidParams.diameter >= 1 && asteroidParams.diameter <= 10000,
          velocity: asteroidParams.velocity >= 11 && asteroidParams.velocity <= 72,
          composition: ['iron', 'stone', 'ice'].includes(asteroidParams.composition),
          location: impactLocation && impactLocation.latitude && impactLocation.longitude,
          mass: asteroidParams.diameter ? physicsEngine.calculateMass(asteroidParams.diameter, asteroidParams.composition) : 0
        };
        
        return {
          valid: Object.values(validation).every(v => v),
          details: validation,
          mass: validation.mass
        };
      }
    },
    {
      id: 2,
      title: "Physics Engine Initialization",
      description: "Loading advanced physics calculations",
      icon: "⚙️",
      duration: 2000,
      details: "Initializing atmospheric entry, crater formation, and energy models",
      calculation: async () => {
        // Initialize physics constants and models
        const constants = {
          gravitationalAcceleration: 9.81, // m/s²
          atmosphericDensity: 1.225, // kg/m³ at sea level
          earthRadius: 6371000, // meters
          dragCoefficient: 0.47, // sphere
          heatCapacity: 1000, // J/kg·K for stone
          meltingPoint: 1800, // K for stone
          vaporization: 4000 // K
        };
        
        const models = {
          atmosphericModel: 'exponential',
          craterScaling: 'schmidt-housen',
          energyDistribution: 'sedov-taylor',
          fragmentationModel: 'grady-kipp'
        };
        
        return { constants, models, initialized: true };
      }
    },
    {
      id: 3,
      title: "Atmospheric Entry Simulation",
      description: "Calculating atmospheric effects and fragmentation",
      icon: "🌍",
      duration: 2500,
      details: "Modeling air resistance, heating, and potential breakup",
      calculation: async () => {
        // Calculate atmospheric entry effects
        const entryVelocity = asteroidParams.velocity * 1000; // convert to m/s
        const diameter = asteroidParams.diameter;
        const mass = stepResults[1]?.mass || physicsEngine.calculateMass(diameter, asteroidParams.composition);
        
        // Atmospheric heating
        const dynamicPressure = 0.5 * 1.225 * Math.pow(entryVelocity, 2);
        const heatingRate = dynamicPressure * entryVelocity * 0.1; // simplified
        
        // Fragmentation analysis
        const fragmentationAltitude = physicsEngine.calculateFragmentationAltitude(
          mass, entryVelocity, asteroidParams.composition
        );
        
        // Deceleration due to air resistance
        const dragForce = 0.5 * 1.225 * Math.pow(entryVelocity, 2) * Math.PI * Math.pow(diameter/2, 2) * 0.47;
        const deceleration = dragForce / mass;
        
        return {
          entryVelocity,
          dynamicPressure,
          heatingRate,
          fragmentationAltitude,
          deceleration,
          survivesToGround: fragmentationAltitude < 1000,
          finalVelocity: Math.max(entryVelocity * 0.7, entryVelocity - deceleration * 10)
        };
      }
    },
    {
      id: 4,
      title: "Impact Energy Calculation",
      description: "Computing kinetic energy and TNT equivalent",
      icon: "💥",
      duration: 2000,
      details: "Calculating total energy release and distribution patterns",
      calculation: async () => {
        const mass = stepResults[1]?.mass || physicsEngine.calculateMass(asteroidParams.diameter, asteroidParams.composition);
        const velocity = stepResults[3]?.finalVelocity || asteroidParams.velocity * 1000;
        
        // Kinetic energy calculation
        const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2); // Joules
        
        // TNT equivalent (1 ton TNT = 4.184 × 10^9 J)
        const tntEquivalent = kineticEnergy / (4.184e9); // tons TNT
        const megatons = tntEquivalent / 1e6;
        
        // Energy distribution
        const craterEnergy = kineticEnergy * 0.1; // 10% goes to crater formation
        const seismicEnergy = kineticEnergy * 0.05; // 5% to seismic waves
        const thermalEnergy = kineticEnergy * 0.3; // 30% to thermal radiation
        const blastEnergy = kineticEnergy * 0.4; // 40% to blast wave
        const ejectaEnergy = kineticEnergy * 0.15; // 15% to ejecta
        
        return {
          kineticEnergy,
          tntEquivalent,
          megatons,
          energyDistribution: {
            crater: craterEnergy,
            seismic: seismicEnergy,
            thermal: thermalEnergy,
            blast: blastEnergy,
            ejecta: ejectaEnergy
          }
        };
      }
    },
    {
      id: 5,
      title: "Crater Formation Analysis",
      description: "Modeling crater dimensions and ejecta patterns",
      icon: "🕳️",
      duration: 1800,
      details: "Using scaling laws to determine crater size and depth",
      calculation: async () => {
        const energy = stepResults[4]?.kineticEnergy || 0;
        const diameter = asteroidParams.diameter;
        const velocity = stepResults[3]?.finalVelocity || asteroidParams.velocity * 1000;
        const angle = asteroidParams.angle || 45;
        
        // Schmidt-Housen crater scaling
        const craterDiameter = physicsEngine.calculateCraterDiameter(diameter, velocity, asteroidParams.composition);
        const craterDepth = craterDiameter * 0.2; // typical depth-to-diameter ratio
        const rimHeight = craterDepth * 0.1;
        
        // Ejecta calculations
        const ejectaVolume = Math.PI * Math.pow(craterDiameter/2, 2) * craterDepth;
        const ejectaRange = craterDiameter * 2.5; // typical ejecta range
        
        // Impact angle effects
        const angleEffect = Math.sin(angle * Math.PI / 180);
        const adjustedDiameter = craterDiameter * (0.7 + 0.3 * angleEffect);
        
        return {
          craterDiameter: adjustedDiameter,
          craterDepth,
          rimHeight,
          ejectaVolume,
          ejectaRange,
          craterVolume: Math.PI * Math.pow(adjustedDiameter/2, 2) * craterDepth / 3,
          angleEffect
        };
      }
    },
    {
      id: 6,
      title: "Damage Zone Mapping",
      description: "Calculating thermal, blast, and seismic effects",
      icon: "📊",
      duration: 2200,
      details: "Mapping destruction zones and environmental impacts",
      calculation: async () => {
        const energy = stepResults[4]?.kineticEnergy || 0;
        const megatons = stepResults[4]?.megatons || 0;
        
        // Thermal radiation effects
        const thermalRadius1st = Math.pow(megatons, 0.4) * 7.6 * 1000; // 1st degree burns (m)
        const thermalRadius2nd = Math.pow(megatons, 0.4) * 6.2 * 1000; // 2nd degree burns (m)
        const thermalRadius3rd = Math.pow(megatons, 0.4) * 5.0 * 1000; // 3rd degree burns (m)
        
        // Blast wave effects
        const blastRadius5psi = Math.pow(megatons, 1/3) * 4.6 * 1000; // 5 psi overpressure (m)
        const blastRadius1psi = Math.pow(megatons, 1/3) * 11.9 * 1000; // 1 psi overpressure (m)
        
        // Seismic effects
        const seismicMagnitude = 4.0 + 0.67 * Math.log10(megatons);
        const seismicRadius = Math.pow(10, seismicMagnitude - 3) * 1000; // felt radius (m)
        
        // Fireball radius
        const fireballRadius = Math.pow(megatons, 0.4) * 180; // meters
        
        // Casualty estimates (simplified)
         const population = estimatePopulation(impactLocation);
         const casualties = calculateCasualties(population, {
           thermalRadius3rd,
           blastRadius5psi,
           blastRadius1psi
         });
        
        return {
          thermalEffects: {
            radius1st: thermalRadius1st,
            radius2nd: thermalRadius2nd,
            radius3rd: thermalRadius3rd
          },
          blastEffects: {
            radius5psi: blastRadius5psi,
            radius1psi: blastRadius1psi,
            fireballRadius
          },
          seismicEffects: {
            magnitude: seismicMagnitude,
            feltRadius: seismicRadius
          },
          casualties
        };
      }
    },
    {
      id: 7,
      title: "Environmental Impact Assessment",
      description: "Analyzing long-term environmental effects",
      icon: "🌿",
      duration: 1600,
      details: "Evaluating climate effects, dust clouds, and ecosystem damage",
      calculation: async () => {
        const energy = stepResults[4]?.kineticEnergy || 0;
        const craterDiameter = stepResults[5]?.craterDiameter || 0;
        const ejectaVolume = stepResults[5]?.ejectaVolume || 0;
        
        // Dust cloud calculations
        const dustMass = ejectaVolume * 2500; // kg (assuming rock density)
        const dustCloudRadius = Math.pow(dustMass / 1000, 0.33) * 50000; // simplified model
        const dustSettlingTime = Math.pow(dustMass / 1e9, 0.5) * 30; // days
        
        // Climate effects
        const temperatureDrop = Math.min(energy / 1e20 * 2, 10); // max 10°C drop
        const climateDuration = Math.pow(energy / 1e18, 0.3) * 365; // days
        
        // Ozone depletion
        const ozoneDepletion = Math.min(energy / 1e21 * 5, 20); // max 20% depletion
        
        // Ecosystem damage
        const ecosystemRadius = Math.max(craterDiameter * 10, dustCloudRadius * 0.5);
        const recoveryTime = Math.pow(ecosystemRadius / 1000, 0.5) * 10; // years
        
        return {
          dustCloud: {
            mass: dustMass,
            radius: dustCloudRadius,
            settlingTime: dustSettlingTime
          },
          climateEffects: {
            temperatureDrop,
            duration: climateDuration
          },
          ozoneDepletion,
          ecosystemDamage: {
            affectedRadius: ecosystemRadius,
            recoveryTime
          }
        };
      }
    },
    {
      id: 8,
      title: "Visualization Generation",
      description: "Creating interactive impact visualization",
      icon: "🗺️",
      duration: 1400,
      details: "Generating realistic map overlays and energy distributions",
      calculation: async () => {
        // Compile all results for visualization
        const compiledResults = {
          impactLocation,
          asteroidParams,
          validationResults: stepResults[1],
          physicsConstants: stepResults[2],
          atmosphericEntry: stepResults[3],
          energyCalculation: stepResults[4],
          craterAnalysis: stepResults[5],
          damageZones: stepResults[6],
          environmentalImpact: stepResults[7]
        };
        
        // Generate visualization data
         const visualizationData = {
           energyZones: generateEnergyZones(stepResults[6]),
           impactMarker: {
             position: [impactLocation.latitude, impactLocation.longitude],
             type: 'impact',
             data: compiledResults
           },
           overlays: generateMapOverlays(stepResults),
           statistics: generateStatistics(stepResults)
         };
        
        return {
          compiledResults,
          visualizationData,
          ready: true
        };
      }
    }
  ];

  // Helper methods
  const estimatePopulation = (location) => {
    // Simplified population estimation based on coordinates
    // In a real implementation, this would query population density databases
    return Math.random() * 1000000; // placeholder
  };

  const calculateCasualties = (population, damageZones) => {
    const thermalArea = Math.PI * Math.pow(damageZones.thermalRadius3rd / 1000, 2);
    const blastArea = Math.PI * Math.pow(damageZones.blastRadius5psi / 1000, 2);
    
    // Simplified casualty calculation
    const populationDensity = population / 10000; // per km²
    const immediate = Math.min(blastArea * populationDensity * 0.8, population * 0.5);
    const shortTerm = Math.min(thermalArea * populationDensity * 0.3, population * 0.3);
    
    return {
      immediate: Math.round(immediate),
      shortTerm: Math.round(shortTerm),
      total: Math.round(immediate + shortTerm)
    };
  };

  const generateEnergyZones = (damageData) => {
    if (!damageData) return {};
    
    return {
      fireball: {
        radius: damageData.blastEffects.fireballRadius,
        color: '#ff4444',
        opacity: 0.8,
        energy: stepResults[4]?.energyDistribution?.thermal || 0,
        effects: ['Vaporization', 'Plasma formation', 'Intense radiation']
      },
      thermal: {
        radius: damageData.thermalEffects.radius3rd,
        color: '#ff8844',
        opacity: 0.6,
        energy: stepResults[4]?.energyDistribution?.thermal || 0,
        effects: ['3rd degree burns', 'Ignition of materials', 'Thermal radiation']
      },
      blast: {
        radius: damageData.blastEffects.radius5psi,
        color: '#ffaa44',
        opacity: 0.4,
        energy: stepResults[4]?.energyDistribution?.blast || 0,
        effects: ['Building collapse', '5 psi overpressure', 'Severe damage']
      },
      seismic: {
        radius: damageData.seismicEffects.feltRadius,
        color: '#44aaff',
        opacity: 0.3,
        energy: stepResults[4]?.energyDistribution?.seismic || 0,
        effects: ['Ground shaking', 'Structural damage', 'Landslides']
      }
    };
  };

  const generateMapOverlays = (results) => {
    return {
      crater: {
        type: 'circle',
        center: [impactLocation.latitude, impactLocation.longitude],
        radius: results[5]?.craterDiameter || 0,
        style: { fillColor: '#8B4513', opacity: 0.8 }
      },
      ejecta: {
        type: 'circle',
        center: [impactLocation.latitude, impactLocation.longitude],
        radius: results[5]?.ejectaRange || 0,
        style: { fillColor: '#D2691E', opacity: 0.4 }
      }
    };
  };

  const generateStatistics = (results) => {
    return {
      impactEnergy: results[4]?.kineticEnergy || 0,
      tntEquivalent: results[4]?.megatons || 0,
      craterDiameter: results[5]?.craterDiameter || 0,
      casualties: results[6]?.casualties?.total || 0,
      seismicMagnitude: results[6]?.seismicEffects?.magnitude || 0
    };
  };

  useEffect(() => {
    if (isVisible && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep(0);
      setCompletedSteps([]);
      setStepResults({});
      startSimulation();
    }
  }, [isVisible]);

  const startSimulation = async () => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      
      // Animate step activation
      const stepElement = document.querySelector(`.step-card:nth-child(${i + 1})`);
      if (stepElement) {
        animateBounceIn(stepElement, { duration: 600 });
        animatePulse(stepElement.querySelector('.step-icon'), { duration: 2000 });
      }
      
      try {
        // Execute actual calculation for this step
        const result = await steps[i].calculation();
        setStepResults(prev => ({ ...prev, [i + 1]: result }));
        
        // Wait for step duration (for UI effect)
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        
        // Mark step as completed with animation
        setCompletedSteps(prev => [...prev, i]);
        
        // Animate completion
        if (stepElement) {
          const checkElement = stepElement.querySelector('.completion-check');
          if (checkElement) {
            animateBounceIn(checkElement, { duration: 500, delay: 200 });
          }
        }
      } catch (error) {
        console.error(`Error in step ${i + 1}:`, error);
        // Continue with next step even if one fails
        setCompletedSteps(prev => [...prev, i]);
      }
    }
    
    // Complete animation and pass results
    setTimeout(() => {
      setIsAnimating(false);
      onComplete(stepResults);
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div className="simulation-process-overlay">
      <div className="process-container" ref={containerRef}>
        <div className="process-header">
          <h2 className="process-title">
            <span className="title-icon">🚀</span>
            Asteroid Impact Simulation
          </h2>
          <p className="process-subtitle">
            Advanced physics modeling in progress...
          </p>
        </div>

        <div className="process-steps">
          {steps.map((step, index) => (
            <div key={step.id} className="step-container">
              {/* Step Card */}
              <div className={`step-card ${
                index === currentStep ? 'active' : 
                completedSteps.includes(index) ? 'completed' : 'pending'
              }`}>
                <div className="step-icon-container">
                  <span className="step-icon">{step.icon}</span>
                  {completedSteps.includes(index) && (
                    <div className="completion-check">✅</div>
                  )}
                  {index === currentStep && (
                    <div className="active-pulse"></div>
                  )}
                </div>
                
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                  <div className="step-details">{step.details}</div>
                  
                  {index === currentStep && (
                    <div className="step-progress">
                      <div className="progress-bar">
                        <div className="progress-fill"></div>
                      </div>
                      <span className="progress-text">Processing...</span>
                    </div>
                  )}
                </div>

                <div className="step-number">{step.id}</div>
              </div>

              {/* Arrow Connector */}
              {index < steps.length - 1 && (
                <div className={`arrow-connector ${
                  completedSteps.includes(index) ? 'completed' : 
                  index === currentStep ? 'active' : 'pending'
                }`}>
                  <div className="arrow-line"></div>
                  <div className="arrow-head">
                    <svg viewBox="0 0 24 24" className="arrow-svg">
                      <path d="M8 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className="arrow-particles">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`arrow-particle particle-${i + 1}`}></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="progress-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Completed Steps</span>
              <span className="stat-value">{completedSteps.length}/{steps.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Current Phase</span>
              <span className="stat-value">
                {currentStep < steps.length ? steps[currentStep].title : 'Complete'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Progress</span>
              <span className="stat-value">
                {Math.round((completedSteps.length / steps.length) * 100)}%
              </span>
            </div>
          </div>
          
          <div className="overall-progress">
            <div className="overall-progress-bar">
              <div 
                className="overall-progress-fill"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`floating-particle particle-${i + 1}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationProcessVisualization;