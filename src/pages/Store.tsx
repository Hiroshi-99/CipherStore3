import React, { useState } from 'react';
import { ShoppingCart, Check, LogOut, Mail, Info } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { OrderModal } from '../components/OrderModal';
import { MailboxModal } from '../components/MailboxModal';
import { InfoModal } from '../components/InfoModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

function Store() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMailboxModalOpen, setIsMailboxModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      // Attempt to sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error.message);
      }
      
      // Whether successful or not, force a page reload to reset the UI state
      window.location.href = '/'; // Redirect to homepage and force a full refresh
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      // Force redirect anyway
      window.location.href = '/';
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
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://i.imgur.com/jbisbDs.jpeg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.8)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <h1 className="text-white text-3xl font-bold">STORE</h1>
          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMailboxModalOpen(true)}
                className="text-white/80 hover:text-white flex items-center gap-2"
              >
                <Mail size={20} />
                My Orders
              </button>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-white/80 hover:text-white flex items-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Minecraft Account</h2>
            
            <div className="text-5xl font-bold text-emerald-400 mb-8">
              $9.99
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-white gap-3">
                <Check className="text-emerald-400" size={24} />
                <span>Full Access</span>
              </div>
              <div className="flex items-center text-white gap-3">
                <Check className="text-emerald-400" size={24} />
                <span>Possible Capes</span>
              </div>
              <div className="flex items-center text-white gap-3">
                <Check className="text-emerald-400" size={24} />
                <span>Dedicated Support</span>
              </div>
            </div>

            <button 
              onClick={handlePurchaseClick}
              className="w-full bg-gray-700/80 hover:bg-gray-600/80 text-white rounded-lg py-3 px-6 flex items-center justify-center gap-2 transition duration-300"
            >
              <ShoppingCart size={20} />
              {user ? 'Purchase' : 'Login to Purchase'}
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-white/80 text-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm flex items-center gap-1.5"
            >
              <Info size={16} />
              <span>About Us</span>
            </button>
            <div>Copyright © 2024-2025 Cipher. All Rights Reserved.</div>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />

      <MailboxModal
        isOpen={isMailboxModalOpen}
        onClose={() => setIsMailboxModalOpen(false)}
      />

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}

export default Store;