import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initDebugger } from './utils/debugger';

// Initialize the mobile debugger
initDebugger();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
