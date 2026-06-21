import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import ErrorBoundary from './components/layout/ErrorBoundary.jsx'
import './index.css'

// Suppress harmless third-party and Vercel injected console warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Default export is deprecated')) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('InvalidNodeTypeError')) return;
  if (args[0] && args[0].toString().includes('InvalidNodeTypeError')) return;
  originalError(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ErrorBoundary>
)