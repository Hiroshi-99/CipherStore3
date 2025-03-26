import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import eruda from 'eruda';

// Only initialize in development
eruda.init();
console.log('Mobile debugger initialized');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 