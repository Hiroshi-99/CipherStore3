import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { checkTelegramConfig } from './lib/telegramNotifications';

// Lazy load pages for better code splitting
const Store = lazy(() => import('./pages/Store'));
const Admin = lazy(() => import('./pages/Admin'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
    <p>Loading...</p>
  </div>
);

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <LoadingFallback />;
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
  }, []);
  
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
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