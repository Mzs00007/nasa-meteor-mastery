import React, { useState } from 'react';

import '../../styles/clean-theme.css';
import '../ui/CleanModernComponents.css';
import {
  CleanButton,
  CleanSlider,
  CleanCard,
  CleanSelect,
  CleanInput,
  CleanToggle,
  CleanSection,
  CleanBadge,
} from '../ui/cleanmoderncomponents';

const InteractiveControlPanel = ({
  meteorParams,
  onParamsChange,
  mapSettings,
  onMapSettingsChange,
  simulationState,
  onRunSimulation,
  onResetSimulation,
}) => {
  const [activeTab, setActiveTab] = useState('meteor');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for mobile detection
  React.useEffect(() => {
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

  // Preset compositions
  const compositions = [
    {
      value: 'stone',
      label: 'Stone (Chondrite)',
      density: 3000,
      description: 'Most common meteorite type',
    },
    {
      value: 'iron',
      label: 'Iron (Metallic)',
      density: 7800,
      description: 'Dense metallic meteorite',
    },
    {
      value: 'stony-iron',
      label: 'Stony-Iron',
      density: 5400,
      description: 'Mixed composition',
    },
  ];

  // Preset scenarios
  const presetScenarios = [
    {
      name: 'Tunguska Event (1908)',
      params: {
        diameter: 60,
        velocity: 27000,
        angle: 30,
        composition: 'stone',
      },
    },
    {
      name: 'Chelyabinsk (2013)',
      params: {
        diameter: 20,
        velocity: 19000,
        angle: 18,
        composition: 'stone',
      },
    },
    {
      name: 'Chicxulub (Dinosaur Killer)',
      params: {
        diameter: 10000,
        velocity: 20000,
        angle: 45,
        composition: 'stone',
      },
    },
    {
      name: 'Barringer Crater',
      params: { diameter: 50, velocity: 12800, angle: 45, composition: 'iron' },
    },
  ];

  const handleParamChange = (param, value) => {
    onParamsChange(prev => ({
      ...prev,
      [param]: parseFloat(value) || value,
    }));
  };

  const handleMapSettingChange = (setting, value) => {
    onMapSettingsChange(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const loadPreset = preset => {
    onParamsChange(prev => ({
      ...prev,
      ...preset.params,
    }));
  };

  const TabButton = ({ id, label, icon }) => (
    <CleanButton
      variant={activeTab === id ? 'primary' : 'secondary'}
      size='medium'
      onClick={() => setActiveTab(id)}
    >
      {icon} {label}
    </CleanButton>
  );

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step,
    unit,
    onChange,
    description,
  }) => (
    <CleanSlider
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      unit={unit}
      onChange={onChange}
      description={description}
    />
  );

  const ToggleControl = ({ label, checked, onChange, description }) => (
    <CleanToggle
      label={label}
      checked={checked}
      onChange={onChange}
      description={description}
    />
  );

  return (
    <CleanCard
      className={`clean-control-panel ${isCollapsed ? 'collapsed' : ''}`}
      padding='normal'
    >
      <div
        className='clean-flex clean-items-center clean-justify-between clean-p-4'
        style={{ borderBottom: '1px solid var(--clean-border-primary)' }}
      >
        <div className='clean-flex clean-items-center clean-gap-3'>
          <span className='clean-text-2xl'>🎯</span>
          <h3 className='clean-text-lg clean-font-semibold clean-text-primary clean-m-0'>
            Impact Simulator Controls
          </h3>
        </div>
        <div className='clean-flex clean-items-center clean-gap-2'>
          {isMobile && (
            <CleanButton
              variant='ghost'
              size='small'
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Controls' : 'Collapse Controls'}
            >
              {isCollapsed ? '📋' : '✖️'}
            </CleanButton>
          )}
          <CleanButton
            variant='ghost'
            size='small'
            onClick={() => setShowAdvanced(!showAdvanced)}
            title='Toggle Advanced Controls'
          >
            ⚙️
          </CleanButton>
        </div>
      </div>
      {/* Collapsible Content */}
      <div
        className={`clean-panel-content ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          transition: 'var(--clean-transition-normal)',
          overflow: isCollapsed ? 'hidden' : 'visible',
          maxHeight: isCollapsed ? '0' : 'none',
          opacity: isCollapsed ? '0' : '1',
        }}
      >
        {/* Tab Navigation */}
        <div
          className='clean-flex clean-gap-2 clean-p-4'
          style={{ borderBottom: '1px solid var(--clean-border-primary)' }}
        >
          <TabButton id='meteor' label='Meteor' icon='☄️' />
          <TabButton id='map' label='Map' icon='🌍' />
          <TabButton id='simulation' label='Simulation' icon='🎮' />
        </div>

        {/* Meteor Parameters Tab */}
        {activeTab === 'meteor' && (
          <div className='clean-p-4'>
            <CleanSection
              title='Meteor Properties'
              icon='🪨'
              collapsible={false}
            >
              <SliderControl
                label='Diameter'
                value={meteorParams.diameter}
                min={1}
                max={10000}
                step={1}
                unit='m'
                onChange={value => handleParamChange('diameter', value)}
                description='Size of the meteoroid'
              />

              <SliderControl
                label='Velocity'
                value={meteorParams.velocity}
                min={5000}
                max={70000}
                step={1000}
                unit='m/s'
                onChange={value => handleParamChange('velocity', value)}
                description='Entry velocity into atmosphere'
              />

              <SliderControl
                label='Impact Angle'
                value={meteorParams.angle}
                min={10}
                max={90}
                step={1}
                unit='°'
                onChange={value => handleParamChange('angle', value)}
                description='Angle from horizontal'
              />

              <SliderControl
                label='Entry Altitude'
                value={meteorParams.altitude}
                min={10000}
                max={200000}
                step={1000}
                unit='m'
                onChange={value => handleParamChange('altitude', value)}
                description='Height above surface'
              />

              <div className='clean-m-4'>
                <label className='clean-text-sm clean-font-medium clean-text-secondary clean-m-2'>
                  Composition
                </label>
                <div className='clean-grid clean-grid--cols-3 clean-gap-2'>
                  {compositions.map(comp => (
                    <CleanButton
                      key={comp.value}
                      variant={
                        meteorParams.composition === comp.value
                          ? 'primary'
                          : 'secondary'
                      }
                      size='medium'
                      onClick={() =>
                        handleParamChange('composition', comp.value)
                      }
                      title={comp.description}
                      style={{
                        flexDirection: 'column',
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div className='clean-text-sm clean-font-medium'>
                        {comp.label}
                      </div>
                      <div className='clean-text-xs clean-text-tertiary'>
                        {comp.density} kg/m³
                      </div>
                    </CleanButton>
                  ))}
                </div>
              </div>
            </CleanSection>

            {/* Location Controls */}
            <CleanSection title='Impact Location' icon='📍' collapsible={false}>
              <div className='clean-grid clean-grid--cols-2 clean-gap-4'>
                <CleanInput
                  label='Latitude'
                  type='number'
                  value={meteorParams.latitude}
                  onChange={e => handleParamChange('latitude', e.target.value)}
                  min={-90}
                  max={90}
                  step={0.0001}
                />
                <CleanInput
                  label='Longitude'
                  type='number'
                  value={meteorParams.longitude}
                  onChange={e => handleParamChange('longitude', e.target.value)}
                  min={-180}
                  max={180}
                  step={0.0001}
                />
              </div>
              <p className='clean-text-xs clean-text-tertiary clean-m-2'>
                Click on map to select location
              </p>
            </CleanSection>

            {/* Preset Scenarios */}
            <CleanSection
              title='Historical Events'
              icon='🎯'
              collapsible={false}
            >
              <div className='clean-grid clean-grid--cols-2 clean-gap-3'>
                {presetScenarios.map((preset, index) => (
                  <CleanButton
                    key={index}
                    variant='secondary'
                    size='medium'
                    onClick={() => loadPreset(preset)}
                    style={{
                      flexDirection: 'column',
                      padding: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div className='clean-text-sm clean-font-medium'>
                      {preset.name}
                    </div>
                  </CleanButton>
                ))}
              </div>
            </CleanSection>
          </div>
        )}

        {/* Map Display Settings Tab */}
        {activeTab === 'map' && (
          <div className='clean-p-4'>
            <CleanSection title='Display Options' icon='🗺️' collapsible={false}>
              <ToggleControl
                label='Show Trajectory'
                checked={mapSettings.showTrajectory}
                onChange={value =>
                  handleMapSettingChange('showTrajectory', value)
                }
                description='Display meteor approach path'
              />

              <ToggleControl
                label='Show Blast Radius'
                checked={mapSettings.showBlastRadius}
                onChange={value =>
                  handleMapSettingChange('showBlastRadius', value)
                }
                description='Show impact blast zones'
              />

              <ToggleControl
                label='Show Seismic Rings'
                checked={mapSettings.showSeismicRings}
                onChange={value =>
                  handleMapSettingChange('showSeismicRings', value)
                }
                description='Display earthquake propagation'
              />

              <ToggleControl
                label='Show Heat Map'
                checked={mapSettings.showHeatMap}
                onChange={value => handleMapSettingChange('showHeatMap', value)}
                description='Temperature distribution overlay'
              />

              <ToggleControl
                label='Population Density'
                checked={mapSettings.showPopulationDensity}
                onChange={value =>
                  handleMapSettingChange('showPopulationDensity', value)
                }
                description='Show populated areas'
              />

              <ToggleControl
                label='Tectonic Plates'
                checked={mapSettings.showTectonicPlates}
                onChange={value =>
                  handleMapSettingChange('showTectonicPlates', value)
                }
                description='Geological plate boundaries'
              />
            </CleanSection>

            {showAdvanced && (
              <CleanSection
                title='Advanced Settings'
                icon='⚙️'
                collapsible={false}
              >
                <div className='clean-grid clean-grid--cols-2 clean-gap-4'>
                  <div>
                    <label className='clean-text-sm clean-font-medium clean-text-secondary clean-m-2'>
                      Time of Day
                    </label>
                    <CleanSelect
                      value={mapSettings.timeOfDay}
                      onChange={e =>
                        handleMapSettingChange('timeOfDay', e.target.value)
                      }
                      options={[
                        { value: 'current', label: 'Current Time' },
                        { value: 'day', label: 'Daytime' },
                        { value: 'night', label: 'Nighttime' },
                        { value: 'custom', label: 'Custom' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className='clean-text-sm clean-font-medium clean-text-secondary clean-m-2'>
                      Weather Conditions
                    </label>
                    <CleanSelect
                      value={mapSettings.weatherConditions}
                      onChange={e =>
                        handleMapSettingChange(
                          'weatherConditions',
                          e.target.value
                        )
                      }
                      options={[
                        { value: 'clear', label: 'Clear' },
                        { value: 'cloudy', label: 'Cloudy' },
                        { value: 'stormy', label: 'Stormy' },
                        { value: 'foggy', label: 'Foggy' },
                      ]}
                    />
                  </div>
                </div>
              </CleanSection>
            )}
          </div>
        )}

        {/* Simulation Controls Tab */}
        {activeTab === 'simulation' && (
          <div className='clean-p-4'>
            <CleanSection
              title='Simulation Controls'
              icon='🎮'
              collapsible={false}
            >
              <div className='clean-flex clean-gap-3 clean-m-4'>
                <CleanButton
                  variant='primary'
                  size='large'
                  onClick={onRunSimulation}
                  disabled={simulationState.isRunning}
                  style={{ flex: 1 }}
                >
                  {simulationState.isRunning
                    ? '⏳ Running...'
                    : '▶️ Run Simulation'}
                </CleanButton>

                <CleanButton
                  variant='secondary'
                  size='large'
                  onClick={onResetSimulation}
                  disabled={simulationState.isRunning}
                  style={{ flex: 1 }}
                >
                  🔄 Reset
                </CleanButton>
              </div>

              {simulationState.isRunning && (
                <div className='clean-p-3 clean-bg-surface-secondary clean-rounded-md clean-m-4'>
                  <div className='clean-flex clean-items-center clean-gap-2 clean-mb-2'>
                    <div
                      className='clean-w-2 clean-h-2 clean-bg-primary clean-rounded-full'
                      style={{ animation: 'pulse 1s infinite' }}
                    />
                    <span className='clean-text-sm clean-text-secondary'>
                      Simulation in progress...
                    </span>
                  </div>
                  <div className='clean-text-xs clean-text-tertiary'>
                    Phase: {simulationState.phase}
                  </div>
                </div>
              )}

              {simulationState.isComplete && (
                <div className='clean-p-3 clean-bg-success-subtle clean-rounded-md clean-m-4'>
                  <div className='clean-flex clean-items-center clean-gap-2'>
                    <div className='clean-w-2 clean-h-2 clean-bg-success clean-rounded-full' />
                    <span className='clean-text-sm clean-text-success'>
                      Simulation complete!
                    </span>
                  </div>
                </div>
              )}
            </CleanSection>

            {showAdvanced && (
              <CleanSection
                title='Advanced Simulation'
                icon='⚙️'
                collapsible={false}
              >
                <div className='clean-grid clean-grid--cols-2 clean-gap-3 clean-m-4'>
                  <CleanButton variant='secondary' size='medium'>
                    🔬 Detailed Physics
                  </CleanButton>
                  <CleanButton variant='secondary' size='medium'>
                    🌊 Tsunami Modeling
                  </CleanButton>
                  <CleanButton variant='secondary' size='medium'>
                    🌋 Volcanic Effects
                  </CleanButton>
                  <CleanButton variant='secondary' size='medium'>
                    ☁️ Climate Impact
                  </CleanButton>
                </div>
              </CleanSection>
            )}
          </div>
        )}
      </div>{' '}
      {/* End of panel-content */}
      {/* Footer */}
      <div
        className='clean-p-4 clean-border-t clean-border-primary'
        style={{ borderTop: '1px solid var(--clean-border-primary)' }}
      >
        <CleanButton
          variant='ghost'
          size='small'
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ width: '100%' }}
        >
          {showAdvanced ? '🔼 Hide Advanced' : '🔽 Show Advanced'}
        </CleanButton>
      </div>
    </CleanCard>
  );
};

export default InteractiveControlPanel;
