import React from 'react';

import FormulaInfoPanel from './FormulaInfoPanel';

const PhysicsFormulasPanel = () => {
  const nasaOrbitalFormulas = [
    {
      title: "Kepler's Equation",
      formula: 'M = E - e * sin(E)',
      description:
        "Kepler's equation relates the mean anomaly (M) to the eccentric anomaly (E) for elliptical orbits. This is fundamental for calculating planetary positions.",
      parameters: [
        { name: 'M', description: 'Mean anomaly', units: 'radians' },
        { name: 'E', description: 'Eccentric anomaly', units: 'radians' },
        {
          name: 'e',
          description: 'Orbital eccentricity',
          units: 'dimensionless',
        },
      ],
      source: 'NASA JPL Horizons System',
    },
    {
      title: 'Orbital Energy Equation',
      formula: 'E = -G * M / (2 * a)',
      description:
        'The specific orbital energy equation for elliptical orbits, where energy is negative for bound orbits.',
      parameters: [
        { name: 'E', description: 'Specific orbital energy', units: 'J/kg' },
        { name: 'G', description: 'Gravitational constant', units: 'm³/kg·s²' },
        { name: 'M', description: 'Central body mass', units: 'kg' },
        { name: 'a', description: 'Semi-major axis', units: 'm' },
      ],
      source: 'NASA Orbital Mechanics',
    },
    {
      title: 'Vis-viva Equation',
      formula: 'v² = GM(2/r - 1/a)',
      description:
        'The vis-viva equation calculates orbital speed at any point in an elliptical orbit.',
      parameters: [
        { name: 'v', description: 'Orbital velocity', units: 'm/s' },
        { name: 'G', description: 'Gravitational constant', units: 'm³/kg·s²' },
        { name: 'M', description: 'Central body mass', units: 'kg' },
        { name: 'r', description: 'Distance from central body', units: 'm' },
        { name: 'a', description: 'Semi-major axis', units: 'm' },
      ],
      source: 'NASA CNEOS',
    },
  ];

  const usgsImpactFormulas = [
    {
      title: 'Kinetic Energy Calculation',
      formula: 'KE = 0.5 * m * v²',
      description:
        'Basic kinetic energy formula used to calculate the energy released during asteroid impact.',
      parameters: [
        { name: 'KE', description: 'Kinetic energy', units: 'Joules' },
        { name: 'm', description: 'Mass of asteroid', units: 'kg' },
        { name: 'v', description: 'Impact velocity', units: 'm/s' },
      ],
      source: 'USGS Impact Effects Calculator',
    },
    {
      title: 'Crater Diameter (Collins et al. 2005)',
      formula: 'D = 1.161 * (ρ_a/ρ_t)^(1/3) * (E)^(1/3.4)',
      description:
        'Empirical formula for estimating transient crater diameter based on impact energy and material densities.',
      parameters: [
        { name: 'D', description: 'Crater diameter', units: 'km' },
        { name: 'ρ_a', description: 'Asteroid density', units: 'kg/m³' },
        { name: 'ρ_t', description: 'Target density', units: 'kg/m³' },
        { name: 'E', description: 'Impact energy', units: 'Joules' },
      ],
      source: 'USGS/Imperial College London Impact Model',
    },
    {
      title: 'Seismic Magnitude',
      formula: 'M_w = 0.67 * log10(E) - 5.87',
      description:
        'Empirical relationship between impact energy and moment magnitude scale for seismic events.',
      parameters: [
        {
          name: 'M_w',
          description: 'Moment magnitude',
          units: 'dimensionless',
        },
        { name: 'E', description: 'Impact energy', units: 'Joules' },
      ],
      source: 'USGS Earthquake Monitoring',
    },
    {
      title: 'Air Blast Overpressure',
      formula: 'P = 3.14 * 10^11 * (E)^(0.67) / r^3',
      description:
        'Calculates overpressure from airburst events at various distances from ground zero.',
      parameters: [
        { name: 'P', description: 'Overpressure', units: 'Pa' },
        { name: 'E', description: 'Impact energy', units: 'Joules' },
        { name: 'r', description: 'Distance from impact', units: 'm' },
      ],
      source: 'USGS Air Blast Effects Model',
    },
  ];

  const atmosphericChemistryFormulas = [
    {
      title: 'Atmospheric Entry Heating',
      formula: 'Q = 0.5 * ρ * v³ * C_H * A',
      description:
        'Heat flux during atmospheric entry, important for ablation and fragmentation calculations.',
      parameters: [
        { name: 'Q', description: 'Heat flux', units: 'W/m²' },
        { name: 'ρ', description: 'Atmospheric density', units: 'kg/m³' },
        { name: 'v', description: 'Velocity', units: 'm/s' },
        {
          name: 'C_H',
          description: 'Heat transfer coefficient',
          units: 'dimensionless',
        },
        { name: 'A', description: 'Cross-sectional area', units: 'm²' },
      ],
      source: 'NASA Ames Research Center',
    },
    {
      title: 'Ablation Rate',
      formula: 'dm/dt = - (Q * A) / (L_v + C_p * ΔT)',
      description:
        'Mass loss rate due to heating and vaporization during atmospheric passage.',
      parameters: [
        { name: 'dm/dt', description: 'Mass ablation rate', units: 'kg/s' },
        { name: 'Q', description: 'Heat flux', units: 'W/m²' },
        { name: 'A', description: 'Surface area', units: 'm²' },
        {
          name: 'L_v',
          description: 'Latent heat of vaporization',
          units: 'J/kg',
        },
        { name: 'C_p', description: 'Specific heat capacity', units: 'J/kg·K' },
        { name: 'ΔT', description: 'Temperature increase', units: 'K' },
      ],
      source: 'NASA Meteor Physics',
    },
  ];

  return (
    <div className='physics-formulas-container'>
      <div className='formulas-section'>
        <h2 className='section-title cosmic-glow'>
          NASA Orbital Mechanics Formulas
        </h2>
        <div className='formulas-grid'>
          {nasaOrbitalFormulas.map((formula, index) => (
            <FormulaInfoPanel key={index} {...formula} />
          ))}
        </div>
      </div>

      <div className='formulas-section'>
        <h2 className='section-title cosmic-glow'>
          USGS Impact Energy Formulas
        </h2>
        <div className='formulas-grid'>
          {usgsImpactFormulas.map((formula, index) => (
            <FormulaInfoPanel key={index} {...formula} />
          ))}
        </div>
      </div>

      <div className='formulas-section'>
        <h2 className='section-title cosmic-glow'>
          Atmospheric Chemistry Formulas
        </h2>
        <div className='formulas-grid'>
          {atmosphericChemistryFormulas.map((formula, index) => (
            <FormulaInfoPanel key={index} {...formula} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhysicsFormulasPanel;
