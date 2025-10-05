/**
 * Comprehensive Planetary Data from NASA and Astronomical Sources
 * All measurements are scientifically accurate and sourced from official astronomical data
 */

export const PLANETARY_DATA = {
  sun: {
    name: "Sun",
    type: "star",
    radius: 696340, // km
    mass: 1.989e30, // kg
    temperature: 5778, // K (surface)
    coreTemperature: 15000000, // K
    axialTilt: 7.25, // degrees relative to invariable plane
    rotationPeriod: 25.05, // days (equatorial)
    luminosity: 3.828e26, // watts
    spectralClass: "G2V",
    age: 4.6e9, // years
    composition: {
      hydrogen: 73.46,
      helium: 24.85,
      oxygen: 0.77,
      carbon: 0.29,
      iron: 0.16,
      other: 0.47
    }
  },

  mercury: {
    name: "Mercury",
    type: "terrestrial",
    radius: 2439.7, // km
    mass: 3.3011e23, // kg
    axialTilt: 0.034, // degrees - smallest tilt in solar system
    rotationPeriod: 58.646, // Earth days
    orbitalPeriod: 87.969, // Earth days
    distanceFromSun: 57.91e6, // km (average)
    eccentricity: 0.2056, // orbital eccentricity
    inclination: 7.005, // degrees to ecliptic
    longitudeOfAscendingNode: 48.331, // degrees
    argumentOfPeriapsis: 29.124, // degrees
    surfaceTemperature: {
      day: 427, // °C
      night: -173 // °C
    },
    atmosphere: "virtually none",
    moons: [],
    composition: {
      iron: 70,
      silicate: 30
    },
    magneticField: 0.0011, // relative to Earth
    albedo: 0.142
  },

  venus: {
    name: "Venus",
    type: "terrestrial",
    radius: 6051.8, // km
    mass: 4.8675e24, // kg
    axialTilt: 177.4, // degrees - nearly upside down, retrograde rotation
    rotationPeriod: -243.025, // Earth days (negative = retrograde)
    orbitalPeriod: 224.701, // Earth days
    distanceFromSun: 108.21e6, // km (average)
    eccentricity: 0.0067,
    inclination: 3.39, // degrees to ecliptic
    longitudeOfAscendingNode: 76.680, // degrees
    argumentOfPeriapsis: 54.884, // degrees
    surfaceTemperature: 464, // °C (hottest planet)
    surfacePressure: 92, // Earth atmospheres
    atmosphere: {
      carbonDioxide: 96.5,
      nitrogen: 3.5,
      sulfurDioxide: 0.015
    },
    moons: [],
    greenhouseEffect: true,
    magneticField: 0, // no significant magnetic field
    albedo: 0.689
  },

  earth: {
    name: "Earth",
    type: "terrestrial",
    radius: 6371.0, // km
    mass: 5.9724e24, // kg
    axialTilt: 23.44, // degrees - responsible for seasons
    rotationPeriod: 0.99726968, // Earth days (23h 56m 4s)
    orbitalPeriod: 365.256, // Earth days
    distanceFromSun: 149.598e6, // km (1 AU)
    eccentricity: 0.0167,
    inclination: 0, // reference plane
    longitudeOfAscendingNode: 0, // degrees (reference)
    argumentOfPeriapsis: 102.937, // degrees
    surfaceTemperature: 15, // °C average
    atmosphere: {
      nitrogen: 78.08,
      oxygen: 20.95,
      argon: 0.93,
      carbonDioxide: 0.04
    },
    moons: [
      {
        name: "Moon",
        radius: 1737.4, // km
        mass: 7.342e22, // kg
        distanceFromPlanet: 384400, // km
        orbitalPeriod: 27.322, // days
        tidallyLocked: true
      }
    ],
    magneticField: 1, // reference value
    albedo: 0.306,
    waterCoverage: 71 // percentage
  },

  mars: {
    name: "Mars",
    type: "terrestrial",
    radius: 3389.5, // km
    mass: 6.4171e23, // kg
    axialTilt: 23.98, // degrees - similar to Earth, chaotic over millions of years
    rotationPeriod: 1.025957, // Earth days (24h 37m)
    orbitalPeriod: 686.980, // Earth days
    distanceFromSun: 227.92e6, // km (average)
    eccentricity: 0.0934,
    inclination: 1.85, // degrees to ecliptic
    longitudeOfAscendingNode: 49.558, // degrees
    argumentOfPeriapsis: 286.502, // degrees
    surfaceTemperature: -65, // °C average
    atmosphere: {
      carbonDioxide: 95.97,
      argon: 1.93,
      nitrogen: 1.89,
      oxygen: 0.146
    },
    moons: [
      {
        name: "Phobos",
        radius: 11.1, // km (irregular shape)
        mass: 1.0659e16, // kg
        distanceFromPlanet: 9376, // km
        orbitalPeriod: 0.31891, // days
        tidallyLocked: true,
        shape: "irregular"
      },
      {
        name: "Deimos",
        radius: 6.2, // km (irregular shape)
        mass: 1.4762e15, // kg
        distanceFromPlanet: 23463, // km
        orbitalPeriod: 1.263, // days
        tidallyLocked: true,
        shape: "irregular"
      }
    ],
    polarIceCaps: true,
    magneticField: 0, // no global magnetic field
    albedo: 0.170
  },

  jupiter: {
    name: "Jupiter",
    type: "gas_giant",
    radius: 69911, // km
    mass: 1.8982e27, // kg
    axialTilt: 3.08, // degrees - very small tilt
    rotationPeriod: 0.41354, // Earth days (9h 55m)
    orbitalPeriod: 4332.59, // Earth days (11.86 years)
    distanceFromSun: 778.57e6, // km (average)
    eccentricity: 0.0489,
    inclination: 1.304, // degrees to ecliptic
    longitudeOfAscendingNode: 100.464, // degrees
    argumentOfPeriapsis: 273.867, // degrees
    temperature: -110, // °C (cloud tops)
    atmosphere: {
      hydrogen: 89.8,
      helium: 10.2,
      methane: 0.3,
      ammonia: 0.026
    },
    moons: [
      {
        name: "Io",
        radius: 1821.6, // km
        mass: 8.9319e22, // kg
        distanceFromPlanet: 421700, // km
        orbitalPeriod: 1.769, // days
        tidallyLocked: true,
        volcanicallyActive: true
      },
      {
        name: "Europa",
        radius: 1560.8, // km
        mass: 4.7998e22, // kg
        distanceFromPlanet: 671034, // km
        orbitalPeriod: 3.551, // days
        tidallyLocked: true,
        subsurfaceOcean: true
      },
      {
        name: "Ganymede",
        radius: 2634.1, // km
        mass: 1.4819e23, // kg
        distanceFromPlanet: 1070412, // km
        orbitalPeriod: 7.155, // days
        tidallyLocked: true,
        largestMoon: true
      },
      {
        name: "Callisto",
        radius: 2410.3, // km
        mass: 1.0759e23, // kg
        distanceFromPlanet: 1882709, // km
        orbitalPeriod: 16.689, // days
        tidallyLocked: true,
        heavilyCratered: true
      }
    ],
    greatRedSpot: {
      width: 16350, // km
      height: 13020, // km
      windSpeed: 432 // km/h
    },
    magneticField: 19519, // relative to Earth
    albedo: 0.343,
    rings: true // faint ring system
  },

  saturn: {
    name: "Saturn",
    type: "gas_giant",
    radius: 58232, // km
    mass: 5.6834e26, // kg
    axialTilt: 26.73, // degrees - significant tilt affecting ring visibility
    rotationPeriod: 0.44401, // Earth days (10h 39m)
    orbitalPeriod: 10759.22, // Earth days (29.46 years)
    distanceFromSun: 1432.04e6, // km (average)
    eccentricity: 0.0565,
    inclination: 2.485, // degrees to ecliptic
    longitudeOfAscendingNode: 113.665, // degrees
    argumentOfPeriapsis: 339.392, // degrees
    temperature: -140, // °C (cloud tops)
    atmosphere: {
      hydrogen: 96.3,
      helium: 3.25,
      methane: 0.45,
      ammonia: 0.0125
    },
    moons: [
      {
        name: "Titan",
        radius: 2574, // km
        mass: 1.3452e23, // kg
        distanceFromPlanet: 1221830, // km
        orbitalPeriod: 15.945, // days
        tidallyLocked: true,
        atmosphere: true,
        lakes: true // hydrocarbon lakes
      },
      {
        name: "Enceladus",
        radius: 252.1, // km
        mass: 1.0802e20, // kg
        distanceFromPlanet: 238020, // km
        orbitalPeriod: 1.370, // days
        tidallyLocked: true,
        geysers: true
      },
      {
        name: "Mimas",
        radius: 198.2, // km
        mass: 3.7493e19, // kg
        distanceFromPlanet: 185539, // km
        orbitalPeriod: 0.942, // days
        tidallyLocked: true,
        herschelCrater: true
      }
    ],
    rings: {
      mainRings: ["D", "C", "B", "A", "F", "G", "E"],
      particles: "ice and rock",
      thickness: 1, // km average
      width: 282000 // km
    },
    magneticField: 578, // relative to Earth
    albedo: 0.342,
    density: 0.687 // g/cm³ - less dense than water
  },

  uranus: {
    name: "Uranus",
    type: "ice_giant",
    radius: 25362, // km
    mass: 8.6810e25, // kg
    axialTilt: 97.77, // degrees - extreme tilt, rotates on its side
    rotationPeriod: -0.71833, // Earth days (17h 14m, retrograde)
    orbitalPeriod: 30688.5, // Earth days (84.01 years)
    distanceFromSun: 2867.04e6, // km (average)
    eccentricity: 0.0457,
    inclination: 0.773, // degrees to ecliptic
    longitudeOfAscendingNode: 74.006, // degrees
    argumentOfPeriapsis: 96.998, // degrees
    temperature: -195, // °C (cloud tops)
    atmosphere: {
      hydrogen: 82.5,
      helium: 15.2,
      methane: 2.3 // gives blue-green color
    },
    moons: [
      {
        name: "Miranda",
        radius: 235.8, // km
        mass: 6.59e19, // kg
        distanceFromPlanet: 129390, // km
        orbitalPeriod: 1.413, // days
        tidallyLocked: true
      },
      {
        name: "Ariel",
        radius: 578.9, // km
        mass: 1.353e21, // kg
        distanceFromPlanet: 190900, // km
        orbitalPeriod: 2.520, // days
        tidallyLocked: true
      },
      {
        name: "Umbriel",
        radius: 584.7, // km
        mass: 1.172e21, // kg
        distanceFromPlanet: 266000, // km
        orbitalPeriod: 4.144, // days
        tidallyLocked: true
      },
      {
        name: "Titania",
        radius: 788.4, // km
        mass: 3.527e21, // kg
        distanceFromPlanet: 436300, // km
        orbitalPeriod: 8.706, // days
        tidallyLocked: true
      },
      {
        name: "Oberon",
        radius: 761.4, // km
        mass: 3.014e21, // kg
        distanceFromPlanet: 583500, // km
        orbitalPeriod: 13.463, // days
        tidallyLocked: true
      }
    ],
    rings: {
      discovered: 1977,
      narrow: true,
      dark: true
    },
    magneticField: 50, // relative to Earth
    albedo: 0.300,
    uniqueRotation: "sideways" // poles point toward/away from Sun
  },

  neptune: {
    name: "Neptune",
    type: "ice_giant",
    radius: 24622, // km
    mass: 1.02413e26, // kg
    axialTilt: 28.32, // degrees
    rotationPeriod: 0.6713, // Earth days (16h 6m)
    orbitalPeriod: 60182, // Earth days (164.8 years)
    distanceFromSun: 4515.0e6, // km (average)
    eccentricity: 0.0113,
    inclination: 1.767, // degrees to ecliptic
    longitudeOfAscendingNode: 131.784, // degrees
    argumentOfPeriapsis: 276.336, // degrees
    temperature: -200, // °C (cloud tops)
    atmosphere: {
      hydrogen: 80,
      helium: 19,
      methane: 1 // gives deep blue color
    },
    moons: [
      {
        name: "Triton",
        radius: 1353.4, // km
        mass: 2.139e22, // kg
        distanceFromPlanet: 354759, // km
        orbitalPeriod: -5.877, // days (retrograde orbit)
        tidallyLocked: true,
        retrograde: true,
        geysers: true
      },
      {
        name: "Nereid",
        radius: 170, // km (estimated)
        mass: 3.1e19, // kg (estimated)
        distanceFromPlanet: 5513818, // km
        orbitalPeriod: 360.14, // days
        highEccentricity: true
      }
    ],
    winds: {
      speed: 2100 // km/h - fastest in solar system
    },
    magneticField: 27, // relative to Earth
    albedo: 0.290,
    greatDarkSpot: true // storm system
  }
};

// Orbital mechanics constants
export const ORBITAL_CONSTANTS = {
  AU: 149597870.7, // km - Astronomical Unit
  GRAVITATIONAL_CONSTANT: 6.67430e-11, // m³/kg⋅s²
  SOLAR_MASS: 1.989e30, // kg
  EARTH_MASS: 5.9724e24, // kg
  SPEED_OF_LIGHT: 299792458, // m/s
};

// Scale factors for visualization
export const SCALE_FACTORS = {
  DISTANCE: 1e-7, // Scale down distances for visualization
  SIZE: 1e-4, // Scale down sizes for visualization
  TIME: 1000, // Speed up time for animation
  REALISTIC: false // Toggle between realistic and viewable scales
};

// Color schemes for planets
export const PLANET_COLORS = {
  sun: 0xFDB813,
  mercury: 0x8C7853,
  venus: 0xFFC649,
  earth: 0x6B93D6,
  mars: 0xCD5C5C,
  jupiter: 0xD8CA9D,
  saturn: 0xFAD5A5,
  uranus: 0x4FD0E7,
  neptune: 0x4B70DD
};

// Texture URLs for realistic planetary surfaces (NASA/JPL approved sources)
export const TEXTURE_URLS = {
  sun: 'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
  mercury: 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  venus: 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  earth: 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
  mars: 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  jupiter: 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  saturn: 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  uranus: 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  neptune: 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  // Additional texture maps for enhanced realism
  earthNight: 'https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg',
  earthClouds: 'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg',
  earthNormal: 'https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.jpg',
  moonTexture: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
  saturnRings: 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png',
  starfield: '/textures/starfield.jpg'
};

export default PLANETARY_DATA;