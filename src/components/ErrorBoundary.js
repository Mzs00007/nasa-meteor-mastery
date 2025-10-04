import PropTypes from 'prop-types';
import React from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // You can also log the error to an error reporting service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className='error-boundary'>
          <div className='error-boundary__container'>
            <div className='error-boundary__icon'>⚠️</div>
            <h2 className='error-boundary__title'>
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className='error-boundary__message'>
              {this.props.message ||
                'An unexpected error occurred. Please try refreshing the page.'}
            </p>

            {this.props.showDetails && this.state.error && (
              <details className='error-boundary__details'>
                <summary>Error Details</summary>
                <pre className='error-boundary__error-text'>
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className='error-boundary__actions'>
              <button
                onClick={this.handleRetry}
                className='error-boundary__retry-btn'
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className='error-boundary__reload-btn'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  title: PropTypes.string,
  message: PropTypes.string,
  showDetails: PropTypes.bool,
  onError: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
};

export default ErrorBoundary;
