/**
 * App Controller
 * Main controller that integrates all separate controllers
 * for centralized application management and coordination
 */
import uiUtilities from '../utils/UIUtilities.js';

import { buttonController } from './ButtonController.js';
import { panelController } from './PanelController.js';

class AppController {
  constructor() {
    this.buttonController = buttonController;
    this.panelController = panelController;
    this.uiUtilities = uiUtilities;

    // Application state
    this.appState = {
      currentView: 'landing',
      isLoading: false,
      errors: [],
      user: null,
      preferences: this.loadPreferences(),
    };

    // Event listeners
    this.eventListeners = new Map();

    // Initialize controllers
    this.initializeControllers();
  }

  // Initialize all controllers
  initializeControllers() {
    // Initialize button controller with app context
    this.buttonController.setAppContext(this);

    // Initialize panel controller with app context
    this.panelController.setAppContext(this);

    // Setup cross-controller communication
    this.setupControllerCommunication();

    // Initialize UI utilities
    this.initializeUIUtilities();
  }

  // Setup communication between controllers
  setupControllerCommunication() {
    // Button events that affect panels
    this.buttonController.on('viewChange', view => {
      this.setCurrentView(view);
      this.panelController.handleViewChange(view);
    });

    this.buttonController.on('panelToggle', panelId => {
      this.panelController.togglePanel(panelId);
    });

    this.buttonController.on('presetSelected', preset => {
      this.panelController.applyPreset(preset);
    });

    // Panel events that affect buttons
    this.panelController.on('panelStateChange', (panelId, state) => {
      this.buttonController.updateButtonState(panelId, state);
    });

    this.panelController.on('validationChange', isValid => {
      this.buttonController.setSubmitEnabled(isValid);
    });
  }

  // Initialize UI utilities with app-specific configurations
  initializeUIUtilities() {
    // Setup app-specific themes
    this.uiUtilities.registerTheme('meteor-dark', {
      colors: {
        primary: '#3b82f6',
        secondary: '#f472b6',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        accent: '#60a5fa',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
    });

    // Setup app-specific statistics
    this.uiUtilities.updateStatistic(
      'totalSimulations',
      0,
      'simulations',
      'integer'
    );
    this.uiUtilities.updateStatistic(
      'averageImpactEnergy',
      0,
      'MT TNT',
      'decimal'
    );
    this.uiUtilities.updateStatistic('largestAsteroid', 0, 'meters', 'integer');

    // Apply default theme
    this.uiUtilities.applyTheme('meteor-dark');
  }

  // Application state management
  setCurrentView(view) {
    const previousView = this.appState.currentView;
    this.appState.currentView = view;

    // Notify listeners
    this.emit('viewChanged', { previous: previousView, current: view });

    // Update UI
    this.uiUtilities.announceToScreenReader(`Navigated to ${view} view`);
  }

  getCurrentView() {
    return this.appState.currentView;
  }

  setLoading(isLoading, message = '') {
    this.appState.isLoading = isLoading;

    if (isLoading && message) {
      this.uiUtilities.addNotification(message, 'info', 0);
    } else if (!isLoading) {
      this.uiUtilities.clearAllNotifications();
    }

    this.emit('loadingChanged', isLoading);
  }

  addError(error, context = '') {
    const errorObj = {
      id: Date.now(),
      message: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    };

    this.appState.errors.push(errorObj);
    this.uiUtilities.addNotification(errorObj.message, 'error', 8000);

    console.error('App Error:', errorObj);
    this.emit('errorAdded', errorObj);
  }

  clearErrors() {
    this.appState.errors = [];
    this.emit('errorsCleared');
  }

  // User preferences management
  loadPreferences() {
    try {
      const saved = localStorage.getItem('meteorMadnessPreferences');
      return saved ? JSON.parse(saved) : this.getDefaultPreferences();
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  savePreferences() {
    try {
      localStorage.setItem(
        'meteorMadnessPreferences',
        JSON.stringify(this.appState.preferences)
      );
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  }

  getDefaultPreferences() {
    return {
      theme: 'meteor-dark',
      units: 'metric',
      autoSave: true,
      notifications: true,
      animations: true,
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        screenReader: false,
      },
      simulation: {
        defaultMaterial: 'stone',
        defaultSize: 100,
        defaultVelocity: 20,
        defaultAngle: 45,
      },
    };
  }

  updatePreference(key, value) {
    this.appState.preferences[key] = value;
    this.savePreferences();
    this.emit('preferenceChanged', { key, value });
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
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

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Simulation management
  async runSimulation(parameters) {
    try {
      this.setLoading(true, 'Running simulation...');

      // Validate parameters
      const validation =
        this.panelController.validateSimulationParameters(parameters);
      if (!validation.isValid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Update statistics
      const currentCount =
        this.uiUtilities.getStatistic('totalSimulations')?.value || 0;
      this.uiUtilities.updateStatistic('totalSimulations', currentCount + 1);

      // Emit simulation start event
      this.emit('simulationStarted', parameters);

      // Here you would integrate with your actual simulation logic
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const results = {
        impactEnergy:
          (parameters.size * parameters.velocity * parameters.velocity) / 1000,
        craterDiameter: Math.sqrt(parameters.size) * 10,
        damageRadius: Math.sqrt(parameters.size) * 5,
        timestamp: new Date().toISOString(),
      };

      // Update statistics
      this.uiUtilities.updateStatistic(
        'averageImpactEnergy',
        results.impactEnergy,
        'MT TNT',
        'decimal'
      );

      if (
        parameters.size >
        (this.uiUtilities.getStatistic('largestAsteroid')?.value || 0)
      ) {
        this.uiUtilities.updateStatistic(
          'largestAsteroid',
          parameters.size,
          'meters',
          'integer'
        );
      }

      this.setLoading(false);
      this.uiUtilities.addNotification(
        'Simulation completed successfully!',
        'success'
      );

      // Emit simulation complete event
      this.emit('simulationCompleted', { parameters, results });

      return results;
    } catch (error) {
      this.setLoading(false);
      this.addError(error, 'simulation');
      throw error;
    }
  }

  // NASA data integration
  async fetchNASAData() {
    try {
      this.setLoading(true, 'Fetching NASA data...');

      // Here you would integrate with your NASA API service
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockData = [
        { id: '1', name: '2023 DW', size: 150, velocity: 18.2, distance: 0.05 },
        { id: '2', name: '2023 EX', size: 89, velocity: 22.1, distance: 0.12 },
        { id: '3', name: '2023 FY', size: 234, velocity: 15.8, distance: 0.08 },
      ];

      this.setLoading(false);
      this.uiUtilities.addNotification(
        'NASA data updated successfully!',
        'success'
      );

      this.emit('nasaDataFetched', mockData);
      return mockData;
    } catch (error) {
      this.setLoading(false);
      this.addError(error, 'nasa-data');
      throw error;
    }
  }

  // Cleanup
  destroy() {
    // Clear all event listeners
    this.eventListeners.clear();

    // Cleanup controllers
    if (this.buttonController.destroy) {
      this.buttonController.destroy();
    }

    if (this.panelController.destroy) {
      this.panelController.destroy();
    }

    // Save preferences one last time
    this.savePreferences();
  }

  // Public API for components
  getAPI() {
    // Create safe method wrappers to avoid circular binding issues
    const createSafeMethod = (obj, methodName) => {
      if (obj && typeof obj[methodName] === 'function') {
        return (...args) => obj[methodName](...args);
      }
      return () => console.warn(`${methodName} not available`);
    };

    return {
      // Button controller methods
      buttons: {
        register: createSafeMethod(this.buttonController, 'registerButton'),
        click: createSafeMethod(this.buttonController, 'handleButtonClick'),
        enable: createSafeMethod(this.buttonController, 'enableButton'),
        disable: createSafeMethod(this.buttonController, 'disableButton'),
        setLoading: createSafeMethod(this.buttonController, 'setButtonLoading'),
      },

      // Panel controller methods
      panels: {
        toggle: createSafeMethod(this.panelController, 'togglePanel'),
        show: createSafeMethod(this.panelController, 'showPanel'),
        hide: createSafeMethod(this.panelController, 'hidePanel'),
        setValue: createSafeMethod(this.panelController, 'setSliderValue'),
        getValue: createSafeMethod(this.panelController, 'getSliderValue'),
        applyPreset: createSafeMethod(this.panelController, 'applyPreset'),
      },

      // UI utilities methods
      ui: {
        notify: createSafeMethod(this.uiUtilities, 'addNotification'),
        tooltip: createSafeMethod(this.uiUtilities, 'registerTooltip'),
        theme: createSafeMethod(this.uiUtilities, 'applyTheme'),
        animate: createSafeMethod(this.uiUtilities, 'animateValue'),
        format: createSafeMethod(this.uiUtilities, 'formatNumber'),
      },

      // App state methods
      app: {
        setView: createSafeMethod(this, 'setCurrentView'),
        getView: createSafeMethod(this, 'getCurrentView'),
        setLoading: createSafeMethod(this, 'setLoading'),
        addError: createSafeMethod(this, 'addError'),
        runSimulation: createSafeMethod(this, 'runSimulation'),
        fetchNASAData: createSafeMethod(this, 'fetchNASAData'),
        updatePreference: createSafeMethod(this, 'updatePreference'),
        on: createSafeMethod(this, 'on'),
        off: createSafeMethod(this, 'off'),
      },
    };
  }
}

// Create singleton instance
const appController = new AppController();

export default appController;
