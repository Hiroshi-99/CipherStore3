const fs = require('fs');
const path = require('path');

// In CommonJS, __filename and __dirname are already available globally
// No need to use fileURLToPath or import.meta.url

// Copy the service worker to dist
const srcFile = path.resolve(__dirname, '../src/service-worker.ts');
const destFile = path.resolve(__dirname, '../dist/service-worker.js');

fs.copyFileSync(srcFile, destFile);
console.log('✓ Service worker copied to dist/service-worker.js'); 