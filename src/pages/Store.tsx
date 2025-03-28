import React, { useState, lazy, Suspense } from 'react';
import { ShoppingCart, Check, LogOut, Mail, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Lazy load modals to improve initial load performance
const AuthModal = lazy(() => import('../components/AuthModal').then(module => ({ default: module.AuthModal })));
const OrderModal = lazy(() => import('../components/OrderModal').then(module => ({ default: module.OrderModal })));
const MailboxModal = lazy(() => import('../components/MailboxModal').then(module => ({ default: module.MailboxModal })));
const InfoModal = lazy(() => import('../components/InfoModal').then(module => ({ default: module.InfoModal })));

function Store() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      // First, try the standard method
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    } finally {
      // Force clear local storage to remove any auth tokens
      localStorage.removeItem('supabase.auth.token');
      
      // If using persist session in localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear session storage as well
      sessionStorage.clear();
      
      // Reload the page to reset all state
      window.location.reload();
    }
  };

  const handlePurchaseClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setIsOrderModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen relative">
      <SEO 
        title="Minecraft Accounts Store | Premium Accounts" 
        description="Buy premium Minecraft accounts with full access, possible capes, and dedicated support. Secure payments and instant delivery."
      />
      
      {/* Background Image with proper alt text */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://i.imgur.com/jbisbDs.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.8)'
        }}
        role="img"
        aria-label="Minecraft game world background"
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header - improved with semantic HTML */}
        <header className="p-6 flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold">STORE</h1>
          {user && (
            <nav className="flex items-center gap-4" aria-label="User navigation">
              <button
                onClick={() => setIsMailboxModalOpen(true)}
                className="text-white/80 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-md flex items-center gap-2"
                aria-label="View my orders"
              >
                <Mail size={20} aria-hidden="true" />
                <span>My Orders</span>
              </button>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-md flex items-center gap-2"
                  aria-label="Admin Dashboard"
                >
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-md flex items-center gap-2"
                aria-label="Log out of account"
              >
                <LogOut size={20} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Minecraft Account</h2>
            
            <div className="text-5xl font-bold text-emerald-400 mb-8" aria-label="Price: $9.99">
              $9.99
            </div>

            <ul className="space-y-4 mb-8 list-none">
              <li className="flex items-center text-white gap-3">
                <Check className="text-emerald-400" size={24} aria-hidden="true" />
                <span>Full Access</span>
              </li>
              <li className="flex items-center text-white gap-3">
                <Check className="text-emerald-400" size={24} aria-hidden="true" />
                <span>Possible Capes</span>
              </li>
              <li className="flex items-center text-white gap-3">
                <Check className="text-emerald-400" size={24} aria-hidden="true" />
                <span>Dedicated Support</span>
              </li>
            </ul>

            <button 
              onClick={handlePurchaseClick}
              className="w-full bg-gray-700/80 hover:bg-gray-600/80 focus:bg-gray-600/80 text-white rounded-lg py-3 px-6 flex items-center justify-center gap-2 transition duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              aria-label={user ? "Purchase Minecraft account" : "Login to purchase Minecraft account"}
            >
              <ShoppingCart size={20} aria-hidden="true" />
              {user ? 'Purchase' : 'Login to Purchase'}
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-white/80 text-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 transition-colors text-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-md p-1"
              aria-label="About our store"
            >
              <Info size={16} aria-hidden="true" />
              <span>About Us</span>
            </button>
            {/* Add additional footer information */}
            <p>© {new Date().getFullYear()} Minecraft Store. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Modals with Suspense fallback for lazy loading */}
      <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
        {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
        {isOrderModalOpen && <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />}
        {isMailboxModalOpen && <MailboxModal isOpen={isMailboxModalOpen} onClose={() => setIsMailboxModalOpen(false)} />}
        {isInfoModalOpen && <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />}
      </Suspense>
    </div>
  );
}

export default Store;