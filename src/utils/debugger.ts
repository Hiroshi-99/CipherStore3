import eruda from 'eruda';

export const initDebugger = () => {
  // Only initialize in development mode
  if (import.meta.env.DEV) {
    eruda.init();
    
    // You can customize which panels to show
    // eruda.show('console').show();
    
    console.log('Mobile debugger initialized');
  }
}; 