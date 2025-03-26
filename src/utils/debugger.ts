// Skip including Eruda in production builds
if (process.env.NODE_ENV === 'production') {
  export const initDebugger = () => {
    // Do nothing in production
  };
} else {
  // Development version
  import eruda from 'eruda';
  
  export const initDebugger = () => {
    eruda.init();
    console.log('Mobile debugger initialized');
  };
} 