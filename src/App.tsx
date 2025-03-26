import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Store from './pages/Store';
import Admin from './pages/Admin';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  
  console.log('Protected Route Check:', { user, isAdmin });
  
  if (!user) {
    console.log('Redirecting: No user found');
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    console.log('Redirecting: User is not admin');
    return <Navigate to="/" replace />;
  }
  
  console.log('Admin access granted');
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
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