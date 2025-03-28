import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { testTelegramNotification, checkTelegramConfig } from './lib/telegramNotifications';

// Replace static imports with lazy loading
const Store = lazy(() => import('./pages/Store'));
const Admin = lazy(() => import('./pages/Admin'));

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <p>Loading...</p>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    // Check if Telegram config is present
    const config = checkTelegramConfig();
    console.log('Telegram configuration:', config);
    
    // Uncomment to send a test notification once when the app loads
    // if (config.hasToken && config.hasChatId) {
    //   testTelegramNotification().then(success => {
    //     console.log('Test notification sent:', success);
    //   });
    // }
  }, []);
  
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="text-white">Loading...</div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Store />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;