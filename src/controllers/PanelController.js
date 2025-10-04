/**
 * Centralized Panel Controller
 * Manages all panels, sliders, dropdowns, and UI component states
 * for the Meteor Madness application
 */

import React, { useState, useCallback } from 'react';

class PanelController {
  constructor() {
    this.panelStates = new Map();
    this.sliderValues = new Map();
    this.dropdownStates = new Map();
    this.toggleStates = new Map();
    this.validationRules = new Map();
    this.changeHandlers = new Map();
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

  // Set app context for cross-controller communication
  setAppContext(appController) {
    this.appController = appController;
  }

  // Panel Management
  setPanelState(panelId, isOpen) {
    this.panelStates.set(panelId, isOpen);
    this.notifyChange('panel', panelId, isOpen);
  }

  getPanelState(panelId) {
    return this.panelStates.get(panelId) || false;
  }

  togglePanel(panelId) {
    const currentState = this.getPanelState(panelId);
    this.setPanelState(panelId, !currentState);
  }

  showPanel(panelId) {
    this.setPanelState(panelId, true);
  }

  hidePanel(panelId) {
    this.setPanelState(panelId, false);
  }

  closeAllPanels() {
    this.panelStates.forEach((_, panelId) => {
      this.setPanelState(panelId, false);
    });
  }

  // Slider Management
  setSliderValue(sliderId, value, min = 0, max = 100) {
    // Validate range
    const clampedValue = Math.max(min, Math.min(max, value));
    this.sliderValues.set(sliderId, clampedValue);
    this.notifyChange('slider', sliderId, clampedValue);
    return clampedValue;
  }

  getSliderValue(sliderId) {
    return this.sliderValues.get(sliderId) || 0;
  }

  setSliderRange(sliderId, min, max, step = 1) {
    const config = { min, max, step };
    this.validationRules.set(sliderId, config);
    return config;
  }

  getSliderRange(sliderId) {
    return this.validationRules.get(sliderId) || { min: 0, max: 100, step: 1 };
  }

  // Dropdown Management
  setDropdownValue(dropdownId, value) {
    this.dropdownStates.set(dropdownId, value);
    this.notifyChange('dropdown', dropdownId, value);
  }

  getDropdownValue(dropdownId) {
    return this.dropdownStates.get(dropdownId) || '';
  }

  // Toggle Management
  setToggleState(toggleId, isOn) {
    this.toggleStates.set(toggleId, isOn);
    this.notifyChange('toggle', toggleId, isOn);
  }

  getToggleState(toggleId) {
    return this.toggleStates.get(toggleId) || false;
  }

  toggleState(toggleId) {
    const currentState = this.getToggleState(toggleId);
    this.setToggleState(toggleId, !currentState);
  }

  // Change notification system
  registerChangeHandler(type, id, handler) {
    const key = `${type}-${id}`;
    this.changeHandlers.set(key, handler);
  }

  notifyChange(type, id, value) {
    const key = `${type}-${id}`;
    const handler = this.changeHandlers.get(key);
    if (handler) {
      handler(value);
    }
  }

  // Preset configurations for common panels
  setupSimulationPanels() {
    // Asteroid parameters panel
    this.setPanelState('asteroid-params', true);
    this.setSliderValue('asteroid-size', 50, 1, 1000);
    this.setSliderRange('asteroid-size', 1, 1000, 1);

    this.setSliderValue('asteroid-velocity', 20, 11, 72);
    this.setSliderRange('asteroid-velocity', 11, 72, 0.1);

    this.setSliderValue('asteroid-angle', 45, 0, 90);
    this.setSliderRange('asteroid-angle', 0, 90, 1);

    // Material selection
    this.setDropdownValue('asteroid-material', 'stone');

    // Simulation controls panel
    this.setPanelState('simulation-controls', true);
    this.setToggleState('real-time-mode', false);
    this.setToggleState('show-trajectory', true);
    this.setToggleState('show-impact-zone', true);

    // Results panel
    this.setPanelState('results-panel', false);

    // NASA data panel
    this.setPanelState('nasa-data', false);
  }

  setupVisualizationPanels() {
    // View controls
    this.setPanelState('view-controls', true);
    this.setToggleState('3d-view', true);
    this.setToggleState('2d-view', false);

    // Camera controls
    this.setSliderValue('camera-zoom', 50, 1, 100);
    this.setSliderRange('camera-zoom', 1, 100, 1);

    this.setSliderValue('camera-rotation', 0, 0, 360);
    this.setSliderRange('camera-rotation', 0, 360, 1);

    // Lighting controls
    this.setSliderValue('ambient-light', 30, 0, 100);
    this.setSliderRange('ambient-light', 0, 100, 1);

    this.setSliderValue('directional-light', 70, 0, 100);
    this.setSliderRange('directional-light', 0, 100, 1);
  }

  setupNASAPanels() {
    // NASA data filters
    this.setPanelState('nasa-filters', true);
    this.setToggleState('potentially-hazardous-only', false);
    this.setSliderValue('min-diameter', 10, 1, 1000);
    this.setSliderRange('min-diameter', 1, 1000, 1);

    this.setSliderValue('max-distance', 100, 1, 1000);
    this.setSliderRange('max-distance', 1, 1000, 1);

    // Real-time data panel
    this.setPanelState('real-time-data', true);
    this.setToggleState('auto-refresh', true);
    this.setSliderValue('refresh-interval', 60, 10, 300);
    this.setSliderRange('refresh-interval', 10, 300, 10);
  }

  // Validation methods
  validateSliderValue(sliderId, value) {
    const rules = this.getSliderRange(sliderId);
    return value >= rules.min && value <= rules.max;
  }

  // Bulk operations
  getAllPanelStates() {
    return Object.fromEntries(this.panelStates);
  }

  getAllSliderValues() {
    return Object.fromEntries(this.sliderValues);
  }

  getAllDropdownValues() {
    return Object.fromEntries(this.dropdownStates);
  }

  getAllToggleStates() {
    return Object.fromEntries(this.toggleStates);
  }

  // Export/Import configurations
  exportConfiguration() {
    return {
      panels: this.getAllPanelStates(),
      sliders: this.getAllSliderValues(),
      dropdowns: this.getAllDropdownValues(),
      toggles: this.getAllToggleStates(),
      timestamp: new Date().toISOString(),
    };
  }

  importConfiguration(config) {
    if (config.panels) {
      Object.entries(config.panels).forEach(([id, state]) => {
        this.setPanelState(id, state);
      });
    }

    if (config.sliders) {
      Object.entries(config.sliders).forEach(([id, value]) => {
        this.sliderValues.set(id, value);
      });
    }

    if (config.dropdowns) {
      Object.entries(config.dropdowns).forEach(([id, value]) => {
        this.setDropdownValue(id, value);
      });
    }

    if (config.toggles) {
      Object.entries(config.toggles).forEach(([id, state]) => {
        this.setToggleState(id, state);
      });
    }
  }

  // Reset methods
  resetAllSliders() {
    this.sliderValues.clear();
  }

  resetAllPanels() {
    this.panelStates.clear();
  }

  resetAllStates() {
    this.panelStates.clear();
    this.sliderValues.clear();
    this.dropdownStates.clear();
    this.toggleStates.clear();
  }

  // Debug methods
  debugState(type, id) {
    switch (type) {
      case 'panel':
        console.log(`Panel ${id}:`, this.getPanelState(id));
        break;
      case 'slider':
        console.log(`Slider ${id}:`, {
          value: this.getSliderValue(id),
          range: this.getSliderRange(id),
        });
        break;
      case 'dropdown':
        console.log(`Dropdown ${id}:`, this.getDropdownValue(id));
        break;
      case 'toggle':
        console.log(`Toggle ${id}:`, this.getToggleState(id));
        break;
      default:
        console.log('All states:', {
          panels: this.getAllPanelStates(),
          sliders: this.getAllSliderValues(),
          dropdowns: this.getAllDropdownValues(),
          toggles: this.getAllToggleStates(),
        });
    }
  }

  // Methods called by AppController
  handleViewChange(view) {
    // Close all panels when view changes
    this.closeAllPanels();

    // Setup panels based on view
    switch (view) {
      case 'simulation':
        this.setupSimulationPanels();
        break;
      case 'visualization':
        this.setupVisualizationPanels();
        break;
      case 'nasa':
        this.setupNASAPanels();
        break;
    }

    this.emit('viewChanged', view);
  }

  applyPreset(preset) {
    // Apply preset configuration
    if (preset && preset.panels) {
      Object.entries(preset.panels).forEach(([panelId, state]) => {
        this.setPanelState(panelId, state);
      });
    }

    if (preset && preset.sliders) {
      Object.entries(preset.sliders).forEach(([sliderId, value]) => {
        this.setSliderValue(sliderId, value);
      });
    }

    if (preset && preset.dropdowns) {
      Object.entries(preset.dropdowns).forEach(([dropdownId, value]) => {
        this.setDropdownValue(dropdownId, value);
      });
    }

    this.emit('presetApplied', preset);
  }
}

// Create singleton instance
const panelController = new PanelController();

export { panelController };

// React hook for using panel controller
export const usePanelController = () => {
  const [, forceUpdate] = useState({});

  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);

  // Register refresh handler for all changes
  React.useEffect(() => {
    const handleChange = () => refresh();

    // Register handlers for all types
    ['panel', 'slider', 'dropdown', 'toggle'].forEach(type => {
      panelController.registerChangeHandler(type, 'global', handleChange);
    });
  }, [refresh]);

  return {
    // Panel methods
    setPanelState: panelController.setPanelState.bind(panelController),
    getPanelState: panelController.getPanelState.bind(panelController),
    togglePanel: panelController.togglePanel.bind(panelController),
    closeAllPanels: panelController.closeAllPanels.bind(panelController),

    // Slider methods
    setSliderValue: panelController.setSliderValue.bind(panelController),
    getSliderValue: panelController.getSliderValue.bind(panelController),
    setSliderRange: panelController.setSliderRange.bind(panelController),
    getSliderRange: panelController.getSliderRange.bind(panelController),

    // Dropdown methods
    setDropdownValue: panelController.setDropdownValue.bind(panelController),
    getDropdownValue: panelController.getDropdownValue.bind(panelController),

    // Toggle methods
    setToggleState: panelController.setToggleState.bind(panelController),
    getToggleState: panelController.getToggleState.bind(panelController),
    toggleState: panelController.toggleState.bind(panelController),

    // Setup methods
    setupSimulationPanels:
      panelController.setupSimulationPanels.bind(panelController),
    setupVisualizationPanels:
      panelController.setupVisualizationPanels.bind(panelController),
    setupNASAPanels: panelController.setupNASAPanels.bind(panelController),

    // Utility methods
    exportConfiguration:
      panelController.exportConfiguration.bind(panelController),
    importConfiguration:
      panelController.importConfiguration.bind(panelController),
    resetAllStates: panelController.resetAllStates.bind(panelController),
    debugState: panelController.debugState.bind(panelController),
  };
};

export default PanelController;
