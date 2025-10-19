import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Gestionnaire global pour filtrer les erreurs des extensions de navigateur
const filterBrowserExtensionErrors = () => {
  // Filtrer les erreurs JavaScript
  window.addEventListener('error', (event) => {
    // Ignorer les erreurs des extensions de navigateur
    if (event.filename && (
      event.filename.includes('content-all.js') ||
      event.filename.includes('extension://') ||
      event.filename.includes('chrome-extension://') ||
      event.filename.includes('moz-extension://')
    )) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    // Ignore benign ResizeObserver loop errors (common in dev with some chart libs)
    if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Filtrer les promesses rejetées des extensions
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && (
      event.reason.message.includes('translate-page') ||
      event.reason.message.includes('save-page') ||
      event.reason.message.includes('Cannot find menu item') ||
      event.reason.message.includes('content-all.js')
    )) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Supprimer les erreurs de la console (méthode avancée)
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    // Ignore extension noise and ResizeObserver loop warnings that are benign in dev
    if (message.includes('content-all.js') || 
        message.includes('translate-page') || 
        message.includes('save-page') ||
        message.includes('Cannot find menu item') ||
        message.includes('ResizeObserver loop completed with undelivered notifications')) {
      return; // Ignorer ces erreurs
    }
    originalConsoleError.apply(console, args);
  };
};

// Appliquer le filtre immédiatement
filterBrowserExtensionErrors();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
