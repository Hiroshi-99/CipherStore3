import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import Store from './pages/Store';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, authLoaded } = useAuth();
  const [timeoutExpired, setTimeoutExpired] = useState(false);
  
  // Set a timeout to avoid infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoaded) {
        console.warn("Auth loading timeout expired - forcing navigation");
        setTimeoutExpired(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [authLoaded]);
  
  // If auth is taking too long, redirect to home
  if (timeoutExpired && !authLoaded) {
    console.error("Auth verification timed out");
    return <Navigate to="/" replace />;
  }
  
  // Wait until auth is fully loaded before making any decisions
  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto text-emerald-400 animate-spin mb-4" />
          <div className="text-white text-lg">Verifying admin access...</div>
          <div className="text-gray-400 mt-2 text-sm">This should only take a moment</div>
        </div>
      </div>
    );
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-center" />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;