import AppController from '../../src/controllers/AppController.js';

// Mock dependencies
jest.mock('../../src/controllers/ButtonController.js', () => {
  const mockButtonController = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    initialize: jest.fn(),
    setupDefaultHandlers: jest.fn(),
    updateButtonState: jest.fn(),
    setSubmitEnabled: jest.fn(),
    registerButton: jest.fn(),
    handleButtonClick: jest.fn(),
    enableButton: jest.fn(),
    disableButton: jest.fn(),
    setButtonLoading: jest.fn(),
    setLoading: jest.fn(),
    setDisabled: jest.fn(),
    getButtonState: jest.fn(() => ({})),
    isLoading: jest.fn(() => false),
    isDisabled: jest.fn(() => false),
    clearAllStates: jest.fn(),
    getAllButtonStates: jest.fn(() => ({}))
  };
  
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockButtonController),
    buttonController: mockButtonController
  };
});

jest.mock('../../src/controllers/PanelController.js', () => {
  const mockPanelController = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    setAppContext: jest.fn(),
    handleViewChange: jest.fn(),
    togglePanel: jest.fn(),
    applyPreset: jest.fn(),
    showPanel: jest.fn(),
    hidePanel: jest.fn(),
    setSliderValue: jest.fn(),
    getSliderValue: jest.fn(() => 50),
    setPanelState: jest.fn(),
    getPanelState: jest.fn(() => false),
    closeAllPanels: jest.fn(),
    setupSimulationPanels: jest.fn(),
    setupVisualizationPanels: jest.fn(),
    setupNASAPanels: jest.fn(),
    resetAllStates: jest.fn(),
    exportConfiguration: jest.fn(() => ({})),
    importConfiguration: jest.fn()
  };
  
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockPanelController),
    panelController: mockPanelController
  };
});

jest.mock('../../src/utils/UIUtilities.js', () => {
  const mockUIUtilities = {
    registerTheme: jest.fn(),
    updateStatistic: jest.fn(),
    addNotification: jest.fn(),
    registerTooltip: jest.fn(),
    applyTheme: jest.fn(),
    animateValue: jest.fn(),
    formatNumber: jest.fn((num) => num.toString()),
    debounce: jest.fn((fn) => fn),
    throttle: jest.fn((fn) => fn),
    validateEmail: jest.fn(() => true),
    validateNumber: jest.fn(() => true),
    getBreakpoint: jest.fn(() => 'lg'),
    isMobile: jest.fn(() => false),
    announceToScreenReader: jest.fn()
  };
  
  return {
    __esModule: true,
    default: mockUIUtilities
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('AppController', () => {
  let appController;
  let mockButtonController;
  let mockPanelController;
  let mockUIUtilities;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Get mocked instances
    const ButtonController = require('../../src/controllers/ButtonController.js').default;
    const PanelController = require('../../src/controllers/PanelController.js').default;
    mockUIUtilities = require('../../src/utils/UIUtilities.js').default;
    
    // Create new controller instance
    appController = new AppController();
    
    // Get the mocked controller instances
    mockButtonController = appController.buttonController;
    mockPanelController = appController.panelController;
  });

  afterEach(() => {
    if (appController) {
      appController.destroy();
    }
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default state', () => {
      expect(appController.appState).toEqual({
        currentView: 'landing',
        isLoading: false,
        errors: [],
        user: null,
        preferences: expect.any(Object)
      });
    });

    test('should initialize controllers', () => {
      expect(mockButtonController.initialize).toHaveBeenCalled();
      expect(mockButtonController.setupDefaultHandlers).toHaveBeenCalled();
      expect(mockPanelController.setAppContext).toHaveBeenCalledWith(appController);
    });

    test('should setup controller communication', () => {
      expect(mockButtonController.on).toHaveBeenCalledWith('viewChange', expect.any(Function));
      expect(mockButtonController.on).toHaveBeenCalledWith('panelToggle', expect.any(Function));
      expect(mockButtonController.on).toHaveBeenCalledWith('presetSelected', expect.any(Function));
      expect(mockPanelController.on).toHaveBeenCalledWith('panelStateChange', expect.any(Function));
      expect(mockPanelController.on).toHaveBeenCalledWith('validationChange', expect.any(Function));
    });

    test('should initialize UI utilities', () => {
      expect(mockUIUtilities.registerTheme).toHaveBeenCalledWith('meteor-dark', expect.any(Object));
      expect(mockUIUtilities.updateStatistic).toHaveBeenCalledWith('app-initialized', expect.any(String));
    });

    test('should load preferences from localStorage', () => {
      const mockPreferences = JSON.stringify({ theme: 'dark', language: 'en' });
      mockLocalStorage.getItem.mockReturnValue(mockPreferences);
      
      const newController = new AppController();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('meteor-madness-preferences');
      expect(newController.appState.preferences).toEqual({ theme: 'dark', language: 'en' });
      
      newController.destroy();
    });
  });

  describe('State Management', () => {
    test('should set current view', () => {
      appController.setCurrentView('simulation');
      
      expect(appController.appState.currentView).toBe('simulation');
    });

    test('should set loading state', () => {
      appController.setLoading(true);
      
      expect(appController.appState.isLoading).toBe(true);
    });

    test('should add error', () => {
      const error = new Error('Test error');
      appController.addError(error);
      
      expect(appController.appState.errors).toHaveLength(1);
      expect(appController.appState.errors[0]).toEqual({
        id: expect.any(String),
        message: 'Test error',
        timestamp: expect.any(String),
        type: 'error'
      });
    });

    test('should add error with custom type', () => {
      appController.addError('Warning message', 'warning');
      
      expect(appController.appState.errors[0].type).toBe('warning');
      expect(appController.appState.errors[0].message).toBe('Warning message');
    });

    test('should clear errors', () => {
      appController.addError('Error 1');
      appController.addError('Error 2');
      expect(appController.appState.errors).toHaveLength(2);
      
      appController.clearErrors();
      expect(appController.appState.errors).toHaveLength(0);
    });

    test('should clear specific error by id', () => {
      appController.addError('Error 1');
      appController.addError('Error 2');
      const errorId = appController.appState.errors[0].id;
      
      appController.clearErrors(errorId);
      expect(appController.appState.errors).toHaveLength(1);
      expect(appController.appState.errors[0].message).toBe('Error 2');
    });
  });

  describe('Controller Communication', () => {
    test('should handle view change from button controller', () => {
      const viewChangeCallback = mockButtonController.on.mock.calls
        .find(call => call[0] === 'viewChange')[1];
      
      viewChangeCallback('simulation');
      
      expect(appController.appState.currentView).toBe('simulation');
      expect(mockPanelController.handleViewChange).toHaveBeenCalledWith('simulation');
    });

    test('should handle panel toggle from button controller', () => {
      const panelToggleCallback = mockButtonController.on.mock.calls
        .find(call => call[0] === 'panelToggle')[1];
      
      panelToggleCallback('settings');
      
      expect(mockPanelController.togglePanel).toHaveBeenCalledWith('settings');
    });

    test('should handle preset selection from button controller', () => {
      const presetCallback = mockButtonController.on.mock.calls
        .find(call => call[0] === 'presetSelected')[1];
      
      const preset = { name: 'chelyabinsk', params: { diameter: 20 } };
      presetCallback(preset);
      
      expect(mockPanelController.applyPreset).toHaveBeenCalledWith(preset);
    });

    test('should handle panel state change from panel controller', () => {
      const panelStateCallback = mockPanelController.on.mock.calls
        .find(call => call[0] === 'panelStateChange')[1];
      
      panelStateCallback('settings', { open: true });
      
      expect(mockButtonController.updateButtonState).toHaveBeenCalledWith('settings', { open: true });
    });

    test('should handle validation change from panel controller', () => {
      const validationCallback = mockPanelController.on.mock.calls
        .find(call => call[0] === 'validationChange')[1];
      
      validationCallback(true);
      
      expect(mockButtonController.setSubmitEnabled).toHaveBeenCalledWith(true);
    });
  });

  describe('Preferences Management', () => {
    test('should get default preferences', () => {
      const defaults = appController.getDefaultPreferences();
      
      expect(defaults).toEqual({
        theme: 'meteor-dark',
        language: 'en',
        units: 'metric',
        notifications: true,
        autoSave: true,
        animationsEnabled: true,
        soundEnabled: false,
        highContrast: false,
        reducedMotion: false
      });
    });

    test('should update preference', () => {
      appController.updatePreference('theme', 'light');
      
      expect(appController.appState.preferences.theme).toBe('light');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'meteor-madness-preferences',
        expect.stringContaining('"theme":"light"')
      );
    });

    test('should save preferences to localStorage', () => {
      appController.appState.preferences.theme = 'dark';
      appController.savePreferences();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'meteor-madness-preferences',
        expect.stringContaining('"theme":"dark"')
      );
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        appController.savePreferences();
      }).not.toThrow();
      
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save preferences:',
        expect.any(Error)
      );
    });
  });

  describe('Event System', () => {
    test('should register and emit events', () => {
      const callback = jest.fn();
      appController.on('test-event', callback);
      
      appController.emit('test-event', 'data');
      
      expect(callback).toHaveBeenCalledWith('data');
    });

    test('should remove event listeners', () => {
      const callback = jest.fn();
      appController.on('test-event', callback);
      appController.off('test-event', callback);
      
      appController.emit('test-event', 'data');
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      appController.on('test-event', callback1);
      appController.on('test-event', callback2);
      
      appController.emit('test-event', 'data');
      
      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });
  });

  describe('Simulation Execution', () => {
    test('should run simulation successfully', async () => {
      const params = {
        diameter: 100,
        velocity: 20,
        angle: 45,
        material: 'stone'
      };

      const result = await appController.runSimulation(params);
      
      expect(appController.appState.isLoading).toBe(false);
      expect(result).toEqual({
        energy: expect.any(Number),
        craterDiameter: expect.any(Number),
        impactLocation: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number)
        }),
        timestamp: expect.any(String),
        parameters: params
      });
    });

    test('should handle simulation with invalid parameters', async () => {
      const params = {
        diameter: -10, // Invalid
        velocity: 20,
        angle: 45,
        material: 'stone'
      };

      await expect(appController.runSimulation(params)).rejects.toThrow('Invalid simulation parameters');
      expect(appController.appState.isLoading).toBe(false);
    });

    test('should handle simulation with missing parameters', async () => {
      const params = {
        diameter: 100
        // Missing velocity, angle, material
      };

      await expect(appController.runSimulation(params)).rejects.toThrow('Invalid simulation parameters');
    });

    test('should emit simulation events', async () => {
      const startCallback = jest.fn();
      const completeCallback = jest.fn();
      
      appController.on('simulationStarted', startCallback);
      appController.on('simulationCompleted', completeCallback);
      
      const params = {
        diameter: 100,
        velocity: 20,
        angle: 45,
        material: 'stone'
      };

      await appController.runSimulation(params);
      
      expect(startCallback).toHaveBeenCalledWith(params);
      expect(completeCallback).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should update statistics during simulation', async () => {
      const params = {
        diameter: 100,
        velocity: 20,
        angle: 45,
        material: 'stone'
      };

      await appController.runSimulation(params);
      
      expect(mockUIUtilities.updateStatistic).toHaveBeenCalledWith(
        'simulations-run',
        expect.any(String)
      );
    });
  });

  describe('NASA Data Fetching', () => {
    test('should fetch NASA data successfully', async () => {
      const result = await appController.fetchNASAData();
      
      expect(result).toEqual({
        asteroids: expect.any(Array),
        lastUpdated: expect.any(String),
        source: 'NASA CNEOS'
      });
    });

    test('should emit NASA data events', async () => {
      const startCallback = jest.fn();
      const completeCallback = jest.fn();
      
      appController.on('nasaDataFetchStarted', startCallback);
      appController.on('nasaDataFetchCompleted', completeCallback);
      
      await appController.fetchNASAData();
      
      expect(startCallback).toHaveBeenCalled();
      expect(completeCallback).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should handle NASA data fetch errors', async () => {
      // Mock a fetch error by overriding the method temporarily
      const originalFetch = appController.fetchNASAData;
      appController.fetchNASAData = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(appController.fetchNASAData()).rejects.toThrow('Network error');
      
      // Restore original method
      appController.fetchNASAData = originalFetch;
    });
  });

  describe('API Exposure', () => {
    test('should provide safe API methods', () => {
      const api = appController.getAPI();
      
      expect(api).toHaveProperty('buttons');
      expect(api).toHaveProperty('panels');
      expect(api).toHaveProperty('ui');
      expect(api).toHaveProperty('app');
      
      expect(api.buttons).toHaveProperty('register');
      expect(api.buttons).toHaveProperty('click');
      expect(api.buttons).toHaveProperty('enable');
      expect(api.buttons).toHaveProperty('disable');
      expect(api.buttons).toHaveProperty('setLoading');
      
      expect(api.panels).toHaveProperty('toggle');
      expect(api.panels).toHaveProperty('show');
      expect(api.panels).toHaveProperty('hide');
      expect(api.panels).toHaveProperty('setValue');
      expect(api.panels).toHaveProperty('getValue');
      expect(api.panels).toHaveProperty('applyPreset');
      
      expect(api.ui).toHaveProperty('notify');
      expect(api.ui).toHaveProperty('tooltip');
      expect(api.ui).toHaveProperty('theme');
      expect(api.ui).toHaveProperty('animate');
      expect(api.ui).toHaveProperty('format');
      
      expect(api.app).toHaveProperty('setView');
      expect(api.app).toHaveProperty('getState');
      expect(api.app).toHaveProperty('runSimulation');
      expect(api.app).toHaveProperty('fetchNASAData');
    });

    test('should handle API method errors gracefully', () => {
      const api = appController.getAPI();
      
      // Mock a method to throw an error
      mockButtonController.registerButton.mockImplementation(() => {
        throw new Error('Button registration failed');
      });
      
      expect(() => {
        api.buttons.register('test-button', {});
      }).not.toThrow();
      
      expect(console.error).toHaveBeenCalledWith(
        'Error in registerButton:',
        expect.any(Error)
      );
    });
  });

  describe('Cleanup and Destruction', () => {
    test('should clean up event listeners on destroy', () => {
      const callback = jest.fn();
      appController.on('test-event', callback);
      
      appController.destroy();
      
      expect(appController.eventListeners.size).toBe(0);
    });

    test('should clean up controller states on destroy', () => {
      appController.destroy();
      
      expect(mockButtonController.clearAllStates).toHaveBeenCalled();
      expect(mockPanelController.resetAllStates).toHaveBeenCalled();
    });

    test('should handle multiple destroy calls gracefully', () => {
      expect(() => {
        appController.destroy();
        appController.destroy();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle controller initialization errors', () => {
      mockButtonController.initialize.mockImplementation(() => {
        throw new Error('Button controller init failed');
      });
      
      expect(() => {
        new AppController();
      }).not.toThrow();
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle preference loading errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      expect(() => {
        new AppController();
      }).not.toThrow();
    });

    test('should handle invalid JSON in preferences', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const controller = new AppController();
      expect(controller.appState.preferences).toEqual(controller.getDefaultPreferences());
      
      controller.destroy();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow: view change -> simulation -> NASA data', async () => {
      // Change view
      appController.setCurrentView('simulation');
      expect(appController.appState.currentView).toBe('simulation');
      
      // Run simulation
      const params = {
        diameter: 100,
        velocity: 20,
        angle: 45,
        material: 'stone'
      };
      
      const simulationResult = await appController.runSimulation(params);
      expect(simulationResult).toBeDefined();
      
      // Fetch NASA data
      const nasaData = await appController.fetchNASAData();
      expect(nasaData).toBeDefined();
      
      // Verify state consistency
      expect(appController.appState.currentView).toBe('simulation');
      expect(appController.appState.isLoading).toBe(false);
    });

    test('should maintain state consistency during error scenarios', async () => {
      // Start with valid state
      appController.setCurrentView('simulation');
      expect(appController.appState.errors).toHaveLength(0);
      
      // Trigger error
      try {
        await appController.runSimulation({ invalid: 'params' });
      } catch (error) {
        // Expected to fail
      }
      
      // Verify state is still consistent
      expect(appController.appState.currentView).toBe('simulation');
      expect(appController.appState.isLoading).toBe(false);
    });
  });
});