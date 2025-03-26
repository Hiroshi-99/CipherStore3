import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  if (!isOpen) return null;

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email');
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to send reset instructions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Input validation
    if (!email.trim()) {
      toast.error('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!isLogin && !validatePassword(password)) {
      toast.error(passwordError);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          throw error;
        }
        
        toast.success('Successfully logged in!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please login instead.');
          }
          throw error;
        }
        
        toast.success('Registration successful! Please check your email to verify your account.');
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPasswordError('');
  };

  const switchMode = (mode: 'login' | 'register' | 'forgot') => {
    resetForm();
    if (mode === 'login') {
      setIsLogin(true);
      setIsForgotPassword(false);
    } else if (mode === 'register') {
      setIsLogin(false);
      setIsForgotPassword(false);
    } else {
      setIsForgotPassword(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800/95 rounded-2xl p-8 max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {isForgotPassword 
            ? 'Reset Password' 
            : isLogin 
              ? 'Login' 
              : 'Register'}
        </h2>

        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 px-4 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>

            <p className="text-center text-gray-400 text-sm">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Back to Login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              {!isLogin && passwordError && (
                <p className="text-red-400 text-xs mt-1">{passwordError}</p>
              )}
              {!isLogin && !passwordError && password && (
                <p className="text-green-400 text-xs mt-1">Password meets requirements</p>
              )}
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 px-4 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </button>

            <p className="text-center text-gray-400 text-sm">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(isLogin ? 'register' : 'login')}
                className="text-emerald-400 hover:text-emerald-300"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}