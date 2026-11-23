import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SiteCMSProvider } from './context/SiteCMSContext';
import { installGlobalErrorGuards, recordDiagnosticError } from './utils/errorDiagnostics';
import { DEFAULT_THEME_CONFIG } from './data/themePresets';
import { applySiteTheme } from './utils/themeEngine';
import './index.css';

installGlobalErrorGuards();
applySiteTheme(DEFAULT_THEME_CONFIG);

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('Root mount container (#root) was not found in index.html');
  }

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary scope="app" moduleName="Application Root">
        <SiteCMSProvider>
          <App />
        </SiteCMSProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  recordDiagnosticError({
    module: 'main.tsx',
    action: 'bootstrapReactApp',
    error,
    severity: 'critical',
  });
}
