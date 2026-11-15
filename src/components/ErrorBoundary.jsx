import React from 'react';

/**
 * Simple error boundary that catches rendering errors in its children.
 * It logs the error to the console and displays a fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Trigger a render with fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You could send error details to an external monitoring service here.
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ color: 'red' }}>{this.state.error?.toString()}</pre>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

