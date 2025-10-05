import React from 'react';
import { motion } from 'framer-motion';

class SimulationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      maxRetries: 3
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Log error for debugging
    console.error('Simulation Error Boundary caught an error:', error, errorInfo);
    
    // You could also log this to an error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.state.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const { componentName = 'Simulation Component', showDetails = false } = this.props;
      const canRetry = this.state.retryCount < this.state.maxRetries;

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-xl p-8 max-w-2xl w-full text-center">
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl mb-6"
            >
              ⚠️
            </motion.div>

            {/* Error Title */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-red-400 mb-4"
            >
              {componentName} Error
            </motion.h2>

            {/* Error Message */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 mb-6"
            >
              Something went wrong while processing the simulation data. 
              This could be due to invalid parameters, calculation errors, or system issues.
            </motion.p>

            {/* Error Details (if enabled) */}
            {showDetails && this.state.error && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-black/30 rounded-lg p-4 mb-6 text-left"
              >
                <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
                <pre className="text-xs text-gray-400 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </motion.div>
            )}

            {/* Retry Information */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-400 mb-6"
            >
              Retry attempts: {this.state.retryCount} / {this.state.maxRetries}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-4 justify-center"
            >
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  🔄 Retry ({this.state.maxRetries - this.state.retryCount} left)
                </button>
              )}
              
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                🔄 Reset Component
              </button>

              {this.props.onNavigateHome && (
                <button
                  onClick={this.props.onNavigateHome}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  🏠 Go Home
                </button>
              )}
            </motion.div>

            {/* Helpful Tips */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
            >
              <h3 className="text-blue-400 font-semibold mb-2">💡 Troubleshooting Tips:</h3>
              <ul className="text-sm text-gray-300 text-left space-y-1">
                <li>• Check if your asteroid parameters are within valid ranges</li>
                <li>• Ensure your internet connection is stable</li>
                <li>• Try refreshing the page if the error persists</li>
                <li>• Contact support if you continue experiencing issues</li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default SimulationErrorBoundary;