import React from 'react';
import { GlassCard, GlassStat } from './ui/GlassComponents';

const SimulationComparisonView = ({ simulationResults, asteroidParams }) => {
  if (!simulationResults) {
    return (
      <div className='bg-black/20 rounded-lg p-6 min-h-[300px] flex items-center justify-center border border-white/10'>
        <div className='text-center text-gray-300'>
          <div className='text-4xl mb-4'>⚖️</div>
          <div className='text-lg font-medium mb-2'>Comparison View</div>
          <p className='text-sm'>Run a simulation to compare with historical events</p>
        </div>
      </div>
    );
  }

  // Get energy from either property name and convert to Megatons TNT
  const impactEnergy = simulationResults.energy || simulationResults.impactEnergy || 1e15;
  const impactEnergyMT = impactEnergy / 4.184e15; // Convert Joules to Megatons TNT

  // Historical events for comparison
  const historicalEvents = [
    {
      name: "Hiroshima Bomb",
      energy: 0.015, // MT
      icon: "💣",
      year: "1945",
      description: "Nuclear weapon"
    },
    {
      name: "Chelyabinsk Meteor",
      energy: 0.5, // MT
      icon: "💥",
      year: "2013",
      description: "Russian meteor event"
    },
    {
      name: "Tunguska Event",
      energy: 15, // MT
      icon: "🌋",
      year: "1908",
      description: "Siberian explosion"
    },
    {
      name: "Tsar Bomba",
      energy: 50, // MT
      icon: "☢️",
      year: "1961",
      description: "Largest nuclear test"
    },
    {
      name: "Krakatoa Eruption",
      energy: 200, // MT
      icon: "🌋",
      year: "1883",
      description: "Volcanic explosion"
    },
    {
      name: "Chicxulub Impact",
      energy: 100000000, // MT (100 million)
      icon: "🦖",
      year: "66 MYA",
      description: "Dinosaur extinction event"
    }
  ];

  // Find closest historical events
  const sortedEvents = historicalEvents
    .map(event => ({
      ...event,
      ratio: impactEnergyMT / event.energy,
      difference: Math.abs(Math.log10(impactEnergyMT) - Math.log10(event.energy))
    }))
    .sort((a, b) => a.difference - b.difference);

  const closestEvent = sortedEvents[0];
  const secondClosest = sortedEvents[1];

  // Calculate Hiroshima equivalents
  const hiroshimaEquivalent = impactEnergyMT / 0.015;

  return (
    <div className="space-y-6">
      {/* Your Simulation */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">🎯 Your Simulation</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassStat
            label="Impact Energy"
            value={`${impactEnergyMT.toFixed(2)} MT`}
            icon="💥"
            description="TNT equivalent"
          />
          <GlassStat
            label="Asteroid Size"
            value={`${asteroidParams.diameter}m`}
            icon="🪨"
            description="Diameter"
          />
          <GlassStat
            label="Crater Size"
            value={`${(simulationResults.craterDiameter / 1000).toFixed(2)} km`}
            icon="🕳️"
            description="Diameter"
          />
          <GlassStat
            label="Hiroshima Equivalent"
            value={`${hiroshimaEquivalent.toFixed(0)}x`}
            icon="💣"
            description="Nuclear comparison"
          />
        </div>
      </GlassCard>

      {/* Closest Historical Comparison */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">📊 Closest Historical Event</h4>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{closestEvent.icon}</span>
              <div>
                <div className="text-white font-semibold">{closestEvent.name}</div>
                <div className="text-gray-300 text-sm">{closestEvent.year} • {closestEvent.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold">{closestEvent.energy} MT</div>
              <div className="text-gray-300 text-sm">
                {closestEvent.ratio > 1 
                  ? `${closestEvent.ratio.toFixed(1)}x smaller`
                  : `${(1/closestEvent.ratio).toFixed(1)}x larger`
                }
              </div>
            </div>
          </div>
          <div className="text-gray-300 text-sm">
            Your simulation is most similar to this historical event in terms of energy release.
          </div>
        </div>
      </GlassCard>

      {/* Energy Scale Comparison */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">📈 Energy Scale Comparison</h4>
        <div className="space-y-3">
          {historicalEvents.map((event, index) => {
            const ratio = impactEnergyMT / event.energy;
            const isLarger = ratio > 1;
            const displayRatio = isLarger ? ratio : 1/ratio;
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{event.icon}</span>
                  <div>
                    <div className="text-white font-medium">{event.name}</div>
                    <div className="text-gray-400 text-sm">{event.year}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white">{event.energy} MT</div>
                  <div className={`text-sm ${isLarger ? 'text-red-300' : 'text-green-300'}`}>
                    {displayRatio.toFixed(1)}x {isLarger ? 'smaller' : 'larger'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Impact Classification */}
      <GlassCard className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">🏷️ Impact Classification</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-medium mb-2">Torino Scale</div>
              <div className="text-gray-300 text-sm">
                {impactEnergyMT < 0.1 ? "0 - No Hazard" :
                 impactEnergyMT < 1 ? "1 - Normal" :
                 impactEnergyMT < 100 ? "2-4 - Meriting Attention" :
                 impactEnergyMT < 10000 ? "5-7 - Threatening" :
                 "8-10 - Certain Collision"}
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-medium mb-2">Damage Scope</div>
              <div className="text-gray-300 text-sm">
                {impactEnergyMT < 1 ? "Local damage" :
                 impactEnergyMT < 100 ? "Regional devastation" :
                 impactEnergyMT < 10000 ? "Continental effects" :
                 "Global catastrophe"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-medium mb-2">Frequency</div>
              <div className="text-gray-300 text-sm">
                {asteroidParams.diameter < 10 ? "Daily (burns up in atmosphere)" :
                 asteroidParams.diameter < 50 ? "Every few years" :
                 asteroidParams.diameter < 100 ? "Every few decades" :
                 asteroidParams.diameter < 1000 ? "Every few centuries" :
                 "Every few million years"}
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-medium mb-2">Survival Outlook</div>
              <div className="text-gray-300 text-sm">
                {impactEnergyMT < 1 ? "Minimal casualties" :
                 impactEnergyMT < 100 ? "Local evacuation needed" :
                 impactEnergyMT < 10000 ? "Regional crisis" :
                 "Civilization threat"}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SimulationComparisonView;