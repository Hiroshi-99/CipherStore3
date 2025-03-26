import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import Store from './pages/Store';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, authLoaded } = useAuth();
  
  // Wait until auth is fully loaded before making any decisions
  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={40} className="mx-auto text-emerald-400 animate-spin mb-4" />
          <div className="text-white text-lg">Verifying admin access...</div>
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