import React, { useState, useEffect } from 'react';

import '../../styles/clean-theme.css';
import '../ui/CleanModernComponents.css';
import {
  CleanButton,
  CleanCard,
  CleanBadge,
  CleanProgress,
  CleanSection,
} from '../ui/cleanmoderncomponents';

const StatisticsPanel = ({
  impactResults,
  meteorParams,
  simulationHistory,
  onExportData,
  onShareResults,
}) => {
  const [activeView, setActiveView] = useState('overview');
  const [animatedValues, setAnimatedValues] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile for better UX
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Animate number changes
  useEffect(() => {
    if (impactResults) {
      const newAnimatedValues = {};
      Object.keys(impactResults).forEach(key => {
        if (typeof impactResults[key] === 'number') {
          newAnimatedValues[key] = impactResults[key];
        }
      });
      setAnimatedValues(newAnimatedValues);
    }
  }, [impactResults]);

  const formatNumber = (value, decimals = 0) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatScientific = value => {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return value.toExponential(2);
  };

  const getImpactSeverity = energy => {
    if (energy < 1e12) {
      return { level: 'Local', color: '#4CAF50', icon: '🟢' };
    }
    if (energy < 1e15) {
      return { level: 'Regional', color: '#FF9800', icon: '🟡' };
    }
    if (energy < 1e18) {
      return { level: 'Continental', color: '#FF5722', icon: '🟠' };
    }
    return { level: 'Global', color: '#F44336', icon: '🔴' };
  };

  const StatCard = ({ title, value, unit, icon, description, trend }) => (
    <CleanCard className='clean-p-4 clean-h-full'>
      <div className='clean-flex clean-items-center clean-gap-2 clean-mb-3'>
        <span className='clean-text-lg'>{icon}</span>
        <h4 className='clean-text-sm clean-font-medium clean-text-secondary'>
          {title}
        </h4>
      </div>
      <div className='clean-flex clean-items-baseline clean-gap-1 clean-mb-2'>
        <span className='clean-text-xl clean-font-bold clean-text-primary'>
          {value}
        </span>
        <span className='clean-text-xs clean-text-tertiary'>{unit}</span>
      </div>
      {trend && (
        <div
          className={`clean-flex clean-items-center clean-gap-1 clean-text-xs clean-mb-2 ${trend > 0 ? 'clean-text-success' : 'clean-text-danger'}`}
        >
          {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
        </div>
      )}
      <p className='clean-text-xs clean-text-tertiary'>{description}</p>
    </CleanCard>
  );

  const ProgressBar = ({
    label,
    value,
    max,
    color = 'var(--clean-primary)',
  }) => (
    <div className='clean-mb-4'>
      <div className='clean-flex clean-justify-between clean-text-sm clean-text-secondary clean-mb-2'>
        <span>{label}</span>
        <span>
          {formatNumber(value)} / {formatNumber(max)}
        </span>
      </div>
      <div className='clean-w-full clean-h-2 clean-bg-surface-secondary clean-rounded-full clean-overflow-hidden'>
        <div
          className='clean-h-full clean-transition-all clean-duration-300'
          style={{
            width: `${Math.min((value / max) * 100, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );

  if (!impactResults) {
    return (
      <CleanSection
        title='📊 Impact Statistics'
        collapsible={isMobile}
        defaultCollapsed={isCollapsed}
      >
        <div className='clean-flex clean-flex-col clean-items-center clean-justify-center clean-py-8 clean-text-center'>
          <div className='clean-text-4xl clean-mb-4'>📈</div>
          <p className='clean-text-secondary'>
            Run a simulation to see impact statistics
          </p>
        </div>
      </CleanSection>
    );
  }

  const severity = getImpactSeverity(impactResults.kineticEnergy);

  return (
    <CleanSection
      title='📊 Impact Statistics'
      collapsible={isMobile}
      defaultCollapsed={isCollapsed}
      headerActions={
        <div className='clean-flex clean-gap-1'>
          <CleanButton
            variant={activeView === 'overview' ? 'primary' : 'ghost'}
            size='small'
            onClick={() => setActiveView('overview')}
            title='Overview'
          >
            📋
          </CleanButton>
          <CleanButton
            variant={activeView === 'detailed' ? 'primary' : 'ghost'}
            size='small'
            onClick={() => setActiveView('detailed')}
            title='Detailed Analysis'
          >
            🔬
          </CleanButton>
          <CleanButton
            variant={activeView === 'comparison' ? 'primary' : 'ghost'}
            size='small'
            onClick={() => setActiveView('comparison')}
            title='Historical Comparison'
          >
            📈
          </CleanButton>
        </div>
      }
    >
      <div className='clean-space-y-4'>
        {/* Severity Indicator */}
        <div className='clean-flex clean-flex-col clean-items-center clean-text-center clean-mb-6'>
          <CleanBadge
            variant='custom'
            className='clean-mb-2'
            style={{ backgroundColor: severity.color, color: 'white' }}
          >
            {severity.icon} {severity.level} Impact
          </CleanBadge>
          <p className='clean-text-sm clean-text-secondary'>
            Impact classification based on energy release
          </p>
        </div>

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className='clean-grid clean-grid-cols-1 md:clean-grid-cols-2 clean-gap-4'>
            <StatCard
              title='Kinetic Energy'
              value={formatScientific(impactResults.kineticEnergy)}
              unit='Joules'
              icon='⚡'
              description='Total energy at impact'
            />

            <StatCard
              title='TNT Equivalent'
              value={formatNumber(impactResults.tntEquivalent / 1000000, 1)}
              unit='Megatons'
              icon='💥'
              description='Explosive power comparison'
            />

            <StatCard
              title='Crater Diameter'
              value={formatNumber(impactResults.craterDiameter, 1)}
              unit='km'
              icon='🕳️'
              description='Final crater size'
            />

            <StatCard
              title='Blast Radius'
              value={formatNumber(impactResults.blastRadius / 1000, 1)}
              unit='km'
              icon='💨'
              description='Destructive blast zone'
            />

            <StatCard
              title='Seismic Magnitude'
              value={formatNumber(impactResults.seismicMagnitude, 1)}
              unit='Richter'
              icon='🌍'
              description='Earthquake intensity'
            />

            <StatCard
              title='Estimated Casualties'
              value={formatNumber(impactResults.casualties)}
              unit='people'
              icon='👥'
              description='Population at risk'
            />
          </div>
        )}

        {/* Detailed Analysis Tab */}
        {activeView === 'detailed' && (
          <div className='clean-space-y-6'>
            <div>
              <h4 className='clean-text-lg clean-font-semibold clean-text-primary clean-mb-4 clean-flex clean-items-center clean-gap-2'>
                🔥 Thermal Effects
              </h4>
              <div className='clean-grid clean-grid-cols-1 clean-gap-3'>
                <div className='clean-flex clean-justify-between clean-items-center clean-p-3 clean-bg-surface-secondary clean-rounded-lg'>
                  <span className='clean-text-sm clean-text-secondary'>
                    Peak Temperature
                  </span>
                  <span className='clean-text-sm clean-font-medium clean-text-primary'>
                    {formatNumber(impactResults.peakTemperature)} K
                  </span>
                </div>
                <div className='clean-flex clean-justify-between clean-items-center clean-p-3 clean-bg-surface-secondary clean-rounded-lg'>
                  <span className='clean-text-sm clean-text-secondary'>
                    Thermal Radiation
                  </span>
                  <span className='clean-text-sm clean-font-medium clean-text-primary'>
                    {formatScientific(impactResults.thermalRadiation)} W/m²
                  </span>
                </div>
                <div className='clean-flex clean-justify-between clean-items-center clean-p-3 clean-bg-surface-secondary clean-rounded-lg'>
                  <span className='clean-text-sm clean-text-secondary'>
                    Fireball Duration
                  </span>
                  <span className='clean-text-sm clean-font-medium clean-text-primary'>
                    {formatNumber(impactResults.fireballDuration, 1)} seconds
                  </span>
                </div>
              </div>
            </div>

            <div className='stats-section'>
              <h4>🌊 Shockwave Properties</h4>
              <div className='detail-grid'>
                <div className='detail-item'>
                  <span className='detail-label'>Peak Pressure</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.peakPressure / 1000, 1)} kPa
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>Shockwave Speed</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.shockwaveSpeed)} m/s
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>Arrival Time</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.shockwaveArrivalTime, 1)}{' '}
                    seconds
                  </span>
                </div>
              </div>
            </div>

            <div className='stats-section'>
              <h4>🪨 Debris Field</h4>
              <div className='detail-grid'>
                <div className='detail-item'>
                  <span className='detail-label'>Ejecta Mass</span>
                  <span className='detail-value'>
                    {formatScientific(impactResults.ejectaMass)} kg
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>Debris Range</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.debrisRange / 1000, 1)} km
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>Fallback Time</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.debrisFallbackTime / 60, 1)}{' '}
                    minutes
                  </span>
                </div>
              </div>
            </div>

            <div className='stats-section'>
              <h4>🌫️ Atmospheric Effects</h4>
              <div className='detail-grid'>
                <div className='detail-item'>
                  <span className='detail-label'>Dust Cloud Volume</span>
                  <span className='detail-value'>
                    {formatScientific(impactResults.dustCloudVolume)} m³
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>Atmospheric Heating</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.atmosphericHeating, 1)} K
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>Ozone Depletion</span>
                  <span className='detail-value'>
                    {formatNumber(impactResults.ozoneDepletion * 100, 1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeView === 'comparison' && (
          <div className='comparison-stats'>
            <div className='stats-section'>
              <h4>📈 Historical Comparison</h4>

              {/* Energy comparison chart */}
              <div className='comparison-chart'>
                <h5>Energy Release Comparison</h5>
                <ProgressBar
                  label='Current Impact'
                  value={impactResults.kineticEnergy}
                  max={1e24}
                  color='#ff6b6b'
                />
                <ProgressBar
                  label='Chicxulub (Dinosaur Killer)'
                  value={4.2e23}
                  max={1e24}
                  color='#4ecdc4'
                />
                <ProgressBar
                  label='Tunguska Event'
                  value={1.5e16}
                  max={1e24}
                  color='#45b7d1'
                />
                <ProgressBar
                  label='Chelyabinsk'
                  value={4.2e14}
                  max={1e24}
                  color='#96ceb4'
                />
              </div>

              {/* Size comparison */}
              <div className='size-comparison'>
                <h5>Size Comparison</h5>
                <div className='size-circles'>
                  <div className='size-item'>
                    <div
                      className='size-circle current'
                      style={{
                        width: `${Math.min((meteorParams.diameter / 100) * 50, 100)}px`,
                        height: `${Math.min((meteorParams.diameter / 100) * 50, 100)}px`,
                      }}
                    />
                    <span>Current ({meteorParams.diameter}m)</span>
                  </div>
                  <div className='size-item'>
                    <div className='size-circle chicxulub' />
                    <span>Chicxulub (10km)</span>
                  </div>
                  <div className='size-item'>
                    <div className='size-circle tunguska' />
                    <span>Tunguska (60m)</span>
                  </div>
                </div>
              </div>
            </div>

            {simulationHistory && simulationHistory.length > 0 && (
              <div className='stats-section'>
                <h4>📊 Your Simulation History</h4>
                <div className='history-list'>
                  {simulationHistory.slice(-5).map((sim, index) => (
                    <div key={index} className='history-item glass-card'>
                      <div className='history-header'>
                        <span className='history-date'>
                          {new Date(sim.timestamp).toLocaleDateString()}
                        </span>
                        <span className='history-energy'>
                          {formatScientific(sim.kineticEnergy)} J
                        </span>
                      </div>
                      <div className='history-details'>
                        <span>Diameter: {sim.diameter}m</span>
                        <span>Velocity: {formatNumber(sim.velocity)}m/s</span>
                        <span>Casualties: {formatNumber(sim.casualties)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Controls */}
        <div className='clean-flex clean-flex-wrap clean-gap-2 clean-pt-4 clean-border-t clean-border-primary'>
          <CleanButton
            variant='secondary'
            size='medium'
            onClick={() => onExportData('csv')}
          >
            📊 Export CSV
          </CleanButton>
          <CleanButton
            variant='secondary'
            size='medium'
            onClick={() => onExportData('json')}
          >
            📄 Export JSON
          </CleanButton>
          <CleanButton
            variant='secondary'
            size='medium'
            onClick={() => onExportData('pdf')}
          >
            📋 Export Report
          </CleanButton>
          <CleanButton variant='primary' size='medium' onClick={onShareResults}>
            🔗 Share Results
          </CleanButton>
        </div>
      </div>{' '}
      {/* End of clean-space-y-4 */}
    </CleanSection>
  );
};

export default StatisticsPanel;
