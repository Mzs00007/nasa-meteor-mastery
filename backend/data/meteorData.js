/**
 * Sample meteor data for the application
 */
const meteorData = [
  {
    id: 'chelyabinsk',
    name: 'Chelyabinsk',
    diameter: 20,
    density: 3300,
    velocity: 19.2,
    angle: 18.3,
    year: 2013,
    location: { lat: 55.15, lng: 61.41 },
    energy: 0.5
  },
  {
    id: 'tunguska',
    name: 'Tunguska',
    diameter: 60,
    density: 2600,
    velocity: 15.0,
    angle: 35.0,
    year: 1908,
    location: { lat: 60.89, lng: 101.89 },
    energy: 10.0
  },
  {
    id: 'chicxulub',
    name: 'Chicxulub (Dinosaur Extinction)',
    diameter: 10000,
    density: 3000,
    velocity: 20.0,
    angle: 45.0,
    year: -66000000,
    location: { lat: 21.40, lng: -89.51 },
    energy: 100000000
  }
];

/**
 * Get random meteor data
 * @returns {Object} Random meteor data
 */
exports.getRandomMeteorData = () => {
  const randomIndex = Math.floor(Math.random() * meteorData.length);
  return meteorData[randomIndex];
};

/**
 * Get all meteor data
 * @returns {Array} All meteor data
 */
exports.getAllMeteorData = () => {
  return meteorData;
};

/**
 * Get meteor data by ID
 * @param {string} id - Meteor ID
 * @returns {Object|null} Meteor data or null if not found
 */
exports.getMeteorById = (id) => {
  return meteorData.find(meteor => meteor.id === id) || null;
};