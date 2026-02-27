import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformProvider } from '../platform';
import { webPlatform } from '../platform/webPlatform';
import App from '../popup/App';
import '../popup/styles.css';
import './web-overrides.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Selah Focus error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app app-web" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Something went wrong. Please refresh the page.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <PlatformProvider platform={webPlatform}>
      <div className="app-web">
        <App />
      </div>
    </PlatformProvider>
  </ErrorBoundary>
);
