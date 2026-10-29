// Suppress external browser extension injection errors (e.g. MetaMask inpage scripts)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const errorMsg = String(event.message || event.error?.message || '');
      const filename = String(event.filename || event.error?.stack || '');
      if (
        filename.includes('chrome-extension://') ||
        filename.includes('moz-extension://') ||
        errorMsg.includes('MetaMask') ||
        errorMsg.includes('ethereum')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reasonStr = String(
        event.reason?.stack || event.reason?.message || event.reason || ''
      );
      if (
        reasonStr.includes('chrome-extension://') ||
        reasonStr.includes('moz-extension://') ||
        reasonStr.includes('MetaMask') ||
        reasonStr.includes('ethereum')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

