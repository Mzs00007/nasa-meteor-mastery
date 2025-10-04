/**
 * Centralized Button Controller
 * Manages all button functionality, event handlers, and state management
 * for the Meteor Madness application
 */

import { useSimulation } from '../context/SimulationContext';

class ButtonController {
  constructor() {
    this.buttonStates = new Map();
    this.eventHandlers = new Map();
    this.loadingStates = new Map();
    this.disabledStates = new Map();
    this.eventListeners = new Map();
  }

  // Event handling system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, ...args) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(...args));
    }
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Initialize button controller with simulation context
  initialize(simulationContext) {
    this.simulationContext = simulationContext;
    this.setupDefaultHandlers();
  }

  // Set app context for cross-controller communication
  setAppContext(appController) {
    this.appController = appController;
  }

  // Setup default event handlers for common buttons
  setupDefaultHandlers() {
    // Navigation handlers
    this.registerHandler('navigate-simulation', () => {
      window.location.href = '/simulation';
    });

    this.registerHandler('navigate-impact', () => {
      window.location.href = '/impact';
    });

    this.registerHandler('navigate-history', () => {
      window.location.href = '/history';
    });

    this.registerHandler('navigate-nasa', () => {
      window.location.href = '/nasa-integrations';
    });

    this.registerHandler('navigate-cesium', () => {
      window.location.href = '/cesium-earth';
    });

    // Simulation control handlers
    this.registerHandler('run-simulation', this.handleRunSimulation.bind(this));
    this.registerHandler(
      'reset-simulation',
      this.handleResetSimulation.bind(this)
    );
    this.registerHandler(
      'pause-simulation',
      this.handlePauseSimulation.bind(this)
    );
    this.registerHandler(
      'stop-simulation',
      this.handleStopSimulation.bind(this)
    );

    // View toggle handlers
    this.registerHandler('toggle-3d-view', this.handleToggle3DView.bind(this));
    this.registerHandler('toggle-2d-view', this.handleToggle2DView.bind(this));
    this.registerHandler(
      'toggle-data-view',
      this.handleToggleDataView.bind(this)
    );
    this.registerHandler(
      'toggle-comparison-view',
      this.handleToggleComparisonView.bind(this)
    );

    // Preset handlers
    this.registerHandler('preset-chelyabinsk', () =>
      this.applyPreset('chelyabinsk')
    );
    this.registerHandler('preset-tunguska', () => this.applyPreset('tunguska'));
    this.registerHandler('preset-chicxulub', () =>
      this.applyPreset('chicxulub')
    );

    // Material handlers
    this.registerHandler('material-iron', () => this.setMaterial('iron'));
    this.registerHandler('material-stone', () => this.setMaterial('stone'));
    this.registerHandler('material-ice', () => this.setMaterial('ice'));

    // Theme handlers
    this.registerHandler('theme-change', this.handleThemeChange.bind(this));

    // Learn more handler
    this.registerHandler('learn-more', () => {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Register a new event handler
  registerHandler(buttonId, handler) {
    this.eventHandlers.set(buttonId, handler);
  }

  // Execute button handler
  executeHandler(buttonId, ...args) {
    const handler = this.eventHandlers.get(buttonId);
    if (handler) {
      try {
        this.setLoading(buttonId, true);
        const result = handler(...args);

        // Handle async operations
        if (result instanceof Promise) {
          return result
            .then(res => {
              this.setLoading(buttonId, false);
              return res;
            })
            .catch(error => {
              this.setLoading(buttonId, false);
              console.error(`Error in button handler ${buttonId}:`, error);
              throw error;
            });
        }
        this.setLoading(buttonId, false);
        return result;
      } catch (error) {
        this.setLoading(buttonId, false);
        console.error(`Error in button handler ${buttonId}:`, error);
        throw error;
      }
    } else {
      console.warn(`No handler registered for button: ${buttonId}`);
    }
  }

  // Button state management
  setButtonState(buttonId, state) {
    this.buttonStates.set(buttonId, state);
  }

  getButtonState(buttonId) {
    return this.buttonStates.get(buttonId) || {};
  }

  setLoading(buttonId, isLoading) {
    this.loadingStates.set(buttonId, isLoading);
  }

  isLoading(buttonId) {
    return this.loadingStates.get(buttonId) || false;
  }

  setDisabled(buttonId, isDisabled) {
    this.disabledStates.set(buttonId, isDisabled);
  }

  isDisabled(buttonId) {
    return this.disabledStates.get(buttonId) || false;
  }

  // Simulation control methods
  async handleRunSimulation() {
    if (!this.simulationContext) {
      console.error('Simulation context not initialized');
      return;
    }

    try {
      // Get current asteroid parameters
      const params = this.simulationContext.asteroidParams;

      // Validate parameters
      if (!this.validateSimulationParams(params)) {
        throw new Error('Invalid simulation parameters');
      }

      // Run simulation
      await this.simulationContext.runSimulation(params);

      // Update UI state
      this.setButtonState('run-simulation', { active: true });

      console.log('Simulation started successfully');
    } catch (error) {
      console.error('Failed to run simulation:', error);
      throw error;
    }
  }

  handleResetSimulation() {
    if (this.simulationContext) {
      this.simulationContext.resetSimulation();
      this.setButtonState('run-simulation', { active: false });
      console.log('Simulation reset');
    }
  }

  handlePauseSimulation() {
    if (this.simulationContext) {
      this.simulationContext.pauseSimulation();
      console.log('Simulation paused');
    }
  }

  handleStopSimulation() {
    if (this.simulationContext) {
      this.simulationContext.stopSimulation();
      this.setButtonState('run-simulation', { active: false });
      console.log('Simulation stopped');
    }
  }

  // View toggle methods
  handleToggle3DView() {
    if (this.simulationContext) {
      this.simulationContext.setView('3d');
      this.updateViewButtons('3d');
    }
  }

  handleToggle2DView() {
    if (this.simulationContext) {
      this.simulationContext.setView('2d');
      this.updateViewButtons('2d');
    }
  }

  handleToggleDataView() {
    if (this.simulationContext) {
      this.simulationContext.setView('data');
      this.updateViewButtons('data');
    }
  }

  handleToggleComparisonView() {
    if (this.simulationContext) {
      this.simulationContext.setView('comparison');
      this.updateViewButtons('comparison');
    }
  }

  updateViewButtons(activeView) {
    const views = ['3d', '2d', 'data', 'comparison'];
    views.forEach(view => {
      this.setButtonState(`toggle-${view}-view`, {
        active: view === activeView,
      });
    });
  }

  // Preset methods
  applyPreset(presetName) {
    const presets = {
      chelyabinsk: {
        diameter: 20,
        velocity: 19,
        angle: 18,
        material: 'stone',
        name: 'Chelyabinsk Event',
      },
      tunguska: {
        diameter: 60,
        velocity: 27,
        angle: 30,
        material: 'ice',
        name: 'Tunguska Event',
      },
      chicxulub: {
        diameter: 10000,
        velocity: 20,
        angle: 60,
        material: 'stone',
        name: 'Chicxulub Impact',
      },
    };

    const preset = presets[presetName];
    if (preset && this.simulationContext) {
      this.simulationContext.setAsteroidParams({
        ...this.simulationContext.asteroidParams,
        ...preset,
      });

      // Update preset button states
      Object.keys(presets).forEach(name => {
        this.setButtonState(`preset-${name}`, { active: name === presetName });
      });

      console.log(`Applied ${presetName} preset`);
    }
  }

  // Material methods
  setMaterial(material) {
    if (this.simulationContext) {
      this.simulationContext.setAsteroidParams({
        ...this.simulationContext.asteroidParams,
        material,
      });

      // Update material button states
      const materials = ['iron', 'stone', 'ice'];
      materials.forEach(mat => {
        this.setButtonState(`material-${mat}`, { active: mat === material });
      });

      console.log(`Set material to ${material}`);
    }
  }

  // Theme methods
  handleThemeChange(theme) {
    document.body.className = `theme-${theme}`;
    this.setButtonState('theme-change', { currentTheme: theme });
    console.log(`Changed theme to ${theme}`);
  }

  // Validation methods
  validateSimulationParams(params) {
    if (!params) {
      return false;
    }

    const { diameter, velocity, angle } = params;

    return (
      diameter &&
      diameter > 0 &&
      diameter <= 10000 &&
      velocity &&
      velocity >= 11 &&
      velocity <= 72 &&
      angle !== undefined &&
      angle >= 0 &&
      angle <= 90
    );
  }

  // Button registration and management
  registerButton(buttonId, config = {}) {
    this.buttonStates.set(buttonId, {
      enabled: config.enabled !== false,
      loading: false,
      ...config,
    });

    this.emit('buttonRegistered', { buttonId, config });
    return buttonId;
  }

  enableButton(buttonId) {
    this.disabledStates.delete(buttonId);
    this.emit('buttonStateChanged', { buttonId, enabled: true });
  }

  disableButton(buttonId) {
    this.disabledStates.add(buttonId);
    this.emit('buttonStateChanged', { buttonId, enabled: false });
  }

  setButtonLoading(buttonId, isLoading = true) {
    if (isLoading) {
      this.loadingStates.add(buttonId);
    } else {
      this.loadingStates.delete(buttonId);
    }
    this.emit('buttonStateChanged', { buttonId, loading: isLoading });
  }

  // Utility methods
  getAllButtonStates() {
    return Object.fromEntries(this.buttonStates);
  }

  clearAllStates() {
    this.buttonStates.clear();
    this.loadingStates.clear();
    this.disabledStates.clear();
  }

  // Methods called by AppController
  updateButtonState(buttonId, state) {
    this.setButtonState(buttonId, state);
  }

  setSubmitEnabled(isEnabled) {
    this.setDisabled('submit', !isEnabled);
    this.setDisabled('launch-simulation', !isEnabled);
  }

  // Debug methods
  debugButtonState(buttonId) {
    console.log(`Button ${buttonId} state:`, {
      state: this.getButtonState(buttonId),
      loading: this.isLoading(buttonId),
      disabled: this.isDisabled(buttonId),
      hasHandler: this.eventHandlers.has(buttonId),
    });
  }
}

// Create singleton instance
const buttonController = new ButtonController();

// React hook for using button controller
export const useButtonController = () => {
  const simulationContext = useSimulation();

  React.useEffect(() => {
    buttonController.initialize(simulationContext);
  }, [simulationContext]);

  return {
    executeHandler: buttonController.executeHandler.bind(buttonController),
    registerHandler: buttonController.registerHandler.bind(buttonController),
    setButtonState: buttonController.setButtonState.bind(buttonController),
    getButtonState: buttonController.getButtonState.bind(buttonController),
    setLoading: buttonController.setLoading.bind(buttonController),
    isLoading: buttonController.isLoading.bind(buttonController),
    setDisabled: buttonController.setDisabled.bind(buttonController),
    isDisabled: buttonController.isDisabled.bind(buttonController),
    debugButtonState: buttonController.debugButtonState.bind(buttonController),
  };
};

export default ButtonController;
export { buttonController };
