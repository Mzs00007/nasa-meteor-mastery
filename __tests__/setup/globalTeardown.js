/**
 * Global Teardown for Jest Tests
 * Cleans up the testing environment after all tests complete
 */

module.exports = async () => {
  // Clean up any global resources

  // Reset environment variables
  delete process.env.REACT_APP_API_URL;
  delete process.env.REACT_APP_CESIUM_TOKEN;

  // Clean up any temporary files or resources
  // (Add cleanup logic here if needed)

  console.log('🧹 Global test teardown completed');
};
