import React from 'react';
import { motion } from 'framer-motion';

class CalculationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      calculationType: null,
      invalidParameters: [],
      suggestions: []
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Analyze the error to provide specific guidance
    const analysisResult = this.analyzeCalculationError(error);
    
    this.setState({
      error,
      hasError: true,
      calculationType: analysisResult.type,
      invalidParameters: analysisResult.invalidParams,
      suggestions: analysisResult.suggestions
    });

    console.error('Calculation Error:', error, errorInfo);
  }

  analyzeCalculationError = (error) => {
    const errorMessage = error.message?.toLowerCase() || '';
    let type = 'unknown';
    let invalidParams = [];
    let suggestions = [];

    // Analyze error patterns
    if (errorMessage.includes('crater') || errorMessage.includes('diameter')) {
      type = 'crater_calculation';
      suggestions = [
        'Check if asteroid diameter is positive and reasonable (1m - 100km)',
        'Verify velocity is within realistic range (1-100 km/s)',
        'Ensure impact angle is between 0-90 degrees'
      ];
    } else if (errorMessage.includes('energy') || errorMessage.includes('kinetic')) {
      type = 'energy_calculation';
      suggestions = [
        'Verify asteroid mass parameters are positive',
        'Check if velocity values are realistic',
        'Ensure composition type is valid (iron, stone, ice)'
      ];
    } else if (errorMessage.includes('fireball') || errorMessage.includes('thermal')) {
      type = 'thermal_calculation';
      suggestions = [
        'Check if energy values are within calculable range',
        'Verify atmospheric conditions are realistic',
        'Ensure distance calculations are positive'
      ];
    } else if (errorMessage.includes('shockwave') || errorMessage.includes('pressure')) {
      type = 'shockwave_calculation';
      suggestions = [
        'Verify energy input is positive and finite',
        'Check distance parameters for shockwave propagation',
        'Ensure atmospheric density values are realistic'
      ];
    } else if (errorMessage.includes('wind') || errorMessage.includes('blast')) {
      type = 'wind_calculation';
      suggestions = [
        'Check if energy and distance values are positive',
        'Verify atmospheric conditions',
        'Ensure calculation doesn\'t result in infinite values'
      ];
    } else if (errorMessage.includes('earthquake') || errorMessage.includes('seismic')) {
      type = 'seismic_calculation';
      suggestions = [
        'Verify impact energy is within seismic calculation range',
        'Check if geological parameters are realistic',
        'Ensure magnitude calculations don\'t exceed limits'
      ];
    } else {
      suggestions = [
        'Check all input parameters for valid ranges',
        'Ensure no division by zero occurs',
        'Verify all numerical inputs are finite',
        'Check for negative values where positive expected'
      ];
    }

    // Check for common parameter issues
    if (errorMessage.includes('nan') || errorMessage.includes('infinity')) {
      invalidParams.push('Mathematical overflow or invalid calculation');
      suggestions.unshift('Check for extremely large or small values that cause mathematical overflow');
    }

    if (errorMessage.includes('negative')) {
      invalidParams.push('Negative values in calculations requiring positive inputs');
    }

    return { type, invalidParams, suggestions };
  };

  handleRecalculate = () => {
    this.setState({
      hasError: false,
      error: null,
      calculationType: null,
      invalidParameters: [],
      suggestions: []
    });

    if (this.props.onRecalculate) {
      this.props.onRecalculate();
    }
  };

  getCalculationTypeIcon = (type) => {
    const icons = {
      crater_calculation: '🕳️',
      energy_calculation: '⚡',
      thermal_calculation: '🔥',
      shockwave_calculation: '💥',
      wind_calculation: '💨',
      seismic_calculation: '🌍',
      unknown: '🔢'
    };
    return icons[type] || icons.unknown;
  };

  getCalculationTypeName = (type) => {
    const names = {
      crater_calculation: 'Crater Formation',
      energy_calculation: 'Energy Calculation',
      thermal_calculation: 'Thermal Effects',
      shockwave_calculation: 'Shockwave Analysis',
      wind_calculation: 'Wind Blast Effects',
      seismic_calculation: 'Seismic Effects',
      unknown: 'Mathematical Calculation'
    };
    return names[type] || names.unknown;
  };

  render() {
    if (this.state.hasError) {
      const { calculationType, suggestions, invalidParameters } = this.state;
      const icon = this.getCalculationTypeIcon(calculationType);
      const typeName = this.getCalculationTypeName(calculationType);

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-900/20 backdrop-blur-md border border-orange-500/30 rounded-xl p-6 m-4"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="text-xl font-bold text-orange-400">
                {typeName} Error
              </h3>
              <p className="text-gray-400 text-sm">
                Mathematical calculation failed
              </p>
            </div>
          </div>

          {/* Error Description */}
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm">
              {this.state.error?.message || 'An unknown calculation error occurred'}
            </p>
          </div>

          {/* Invalid Parameters */}
          {invalidParameters.length > 0 && (
            <div className="mb-4">
              <h4 className="text-orange-400 font-semibold mb-2">⚠️ Issues Detected:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {invalidParameters.map((param, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-400">•</span>
                    {param}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-blue-400 font-semibold mb-2">💡 Suggestions:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={this.handleRecalculate}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              🔄 Retry Calculation
            </button>
            
            {this.props.onResetParameters && (
              <button
                onClick={this.props.onResetParameters}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                ⚙️ Reset Parameters
              </button>
            )}
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default CalculationErrorBoundary;