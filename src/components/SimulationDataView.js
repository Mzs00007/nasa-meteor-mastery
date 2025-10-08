import React from 'react';
import { GlassCard, GlassStat } from './ui/GlassComponents';

const SimulationDataView = ({ simulationResults, asteroidParams }) => {
  if (!simulationResults) {
    return (
      <div className='bg-black/20 rounded-lg p-6 min-h-[300px] flex items-center justify-center border border-white/10'>
        <div className='text-center text-gray-300'>
          <div className='text-4xl mb-4'>📊</div>
          <div className='text-lg font-medium mb-2'>Data Analysis</div>
          <p className='text-sm'>Run a simulation to see detailed numerical analysis</p>
        </div>
      </div>
    );
  }

  // Calculate additional metrics
  const kineticEnergy = 0.5 * (asteroidParams.diameter ** 3) * (asteroidParams.velocity ** 2) / 1000;
  // Get energy from either property name and ensure it's a valid number
  const impactEnergy = simulationResults.energy || simulationResults.impactEnergy || 1e15;
  const impactEnergyMT = impactEnergy / 4.184e15; // Convert Joules to Megatons TNT (1 MT = 4.184e15 J)
  const craterVolume = Math.PI * Math.pow(simulationResults.craterDiameter / 2, 2) * (simulationResults.craterDiameter * 0.2);
  const ejectaMass = craterVolume * 2500; // kg, assuming rock density
  
  console.log('SimulationDataView - Energy values:', {
    rawEnergy: simulationResults.energy,
    impactEnergyProperty: simulationResults.impactEnergy,
    calculatedMT: impactEnergyMT,
    craterDiameter: simulationResults.craterDiameter
  });

  return (
    <div className="space-y-6">
      {/* Impact Metrics */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">🎯 Impact Metrics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <GlassStat
            label="Impact Energy"
            value={`${impactEnergyMT.toFixed(2)} MT`}
            icon="💥"
            description="TNT equivalent"
          />
          <GlassStat
            label="Kinetic Energy"
            value={`${kineticEnergy.toFixed(2)} TJ`}
            icon="⚡"
            description="Pre-impact energy"
          />
          <GlassStat
            label="Impact Velocity"
            value={`${asteroidParams.velocity} km/s`}
            icon="🚀"
            description="Entry speed"
          />
          <GlassStat
            label="Entry Angle"
            value={`${asteroidParams.angle}°`}
            icon="📐"
            description="Impact angle"
          />
          <GlassStat
            label="Asteroid Mass"
            value={`${(Math.PI * Math.pow(asteroidParams.diameter/2, 3) * 4/3 * 2500 / 1e9).toFixed(2)} kt`}
            icon="⚖️"
            description="Estimated mass"
          />
          <GlassStat
            label="Composition"
            value={asteroidParams.composition}
            icon="🪨"
            description="Material type"
          />
        </div>
      </GlassCard>

      {/* Crater Analysis */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">🕳️ Crater Analysis</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <GlassStat
            label="Crater Diameter"
            value={`${(simulationResults.craterDiameter / 1000).toFixed(2)} km`}
            icon="📏"
            description="Final crater size"
          />
          <GlassStat
            label="Crater Depth"
            value={`${(simulationResults.craterDiameter * 0.2 / 1000).toFixed(2)} km`}
            icon="📊"
            description="Maximum depth"
          />
          <GlassStat
            label="Crater Volume"
            value={`${(craterVolume / 1e9).toFixed(2)} km³`}
            icon="🏔️"
            description="Excavated material"
          />
          <GlassStat
            label="Ejecta Mass"
            value={`${(ejectaMass / 1e12).toFixed(2)} Gt`}
            icon="🌋"
            description="Thrown material"
          />
          <GlassStat
            label="Rim Height"
            value={`${(simulationResults.craterDiameter * 0.05 / 1000).toFixed(2)} km`}
            icon="⛰️"
            description="Crater rim elevation"
          />
          <GlassStat
            label="Impact Duration"
            value={`${(asteroidParams.diameter / (asteroidParams.velocity * 1000)).toFixed(3)} s`}
            icon="⏱️"
            description="Contact time"
          />
        </div>
      </GlassCard>

      {/* Damage Assessment */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">💥 Damage Assessment</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-red-400 mr-2">🔥</span>
                <span className="text-white font-medium">Total Destruction Zone</span>
              </div>
              <div className="text-red-300 text-sm">
                Radius: {(simulationResults.craterDiameter / 2000).toFixed(1)} km
              </div>
              <div className="text-red-300 text-sm">
                Area: {(Math.PI * Math.pow(simulationResults.craterDiameter / 2000, 2)).toFixed(1)} km²
              </div>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-orange-400 mr-2">🌋</span>
                <span className="text-white font-medium">Severe Damage Zone</span>
              </div>
              <div className="text-orange-300 text-sm">
                Radius: {(simulationResults.craterDiameter / 1000).toFixed(1)} km
              </div>
              <div className="text-orange-300 text-sm">
                Area: {(Math.PI * Math.pow(simulationResults.craterDiameter / 1000, 2)).toFixed(1)} km²
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-yellow-400 mr-2">⚠️</span>
                <span className="text-white font-medium">Moderate Damage Zone</span>
              </div>
              <div className="text-yellow-300 text-sm">
                Radius: {(simulationResults.craterDiameter / 500).toFixed(1)} km
              </div>
              <div className="text-yellow-300 text-sm">
                Area: {(Math.PI * Math.pow(simulationResults.craterDiameter / 500, 2)).toFixed(1)} km²
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <span className="text-blue-400 mr-2">🌊</span>
                <span className="text-white font-medium">Light Damage Zone</span>
              </div>
              <div className="text-blue-300 text-sm">
                Radius: {(simulationResults.craterDiameter / 250).toFixed(1)} km
              </div>
              <div className="text-blue-300 text-sm">
                Area: {(Math.PI * Math.pow(simulationResults.craterDiameter / 250, 2)).toFixed(1)} km²
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Environmental Effects */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">🌍 Environmental Effects</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassStat
            label="Seismic Magnitude"
            value={`${Math.min(9.5, Math.log10(impactEnergyMT) + 4).toFixed(1)}`}
            icon="📈"
            description="Earthquake equivalent"
          />
          <GlassStat
            label="Thermal Radiation"
            value={`${(impactEnergyMT * 0.3).toFixed(1)} MT`}
            icon="🔥"
            description="Heat energy released"
          />
          <GlassStat
            label="Atmospheric Dust"
            value={`${(ejectaMass / 1e15).toFixed(2)} Pt`}
            icon="🌫️"
            description="Dust injected"
          />
          <GlassStat
            label="Climate Impact"
            value={impactEnergyMT > 1000 ? "Global" : impactEnergyMT > 100 ? "Regional" : "Local"}
            icon="🌡️"
            description="Temperature effect"
          />
        </div>
      </GlassCard>
    </div>
  );
};

export default SimulationDataView;