import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  // For simplifying conditionals in the render method
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot';
  const isResetPassword = mode === 'reset';
  
  // Check for reset token when component mounts or when isOpen changes
  useEffect(() => {
    if (isOpen) {
      checkForResetToken();
    }
  }, [isOpen]);
  
  // Extract reset token from URL if present
  const checkForResetToken = () => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Extract token from URL
      const tokenMatch = hash.match(/access_token=([^&]*)/);
      if (tokenMatch && tokenMatch[1]) {
        setResetToken(tokenMatch[1]);
        switchMode('reset');
      }
    }
  };
  
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
      // Use a specific path for password reset according to Supabase docs
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset instructions sent to your email');
      toast.success('Please check your email for the reset link', { duration: 5000 });
      switchMode('login');
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

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!validatePassword(password)) {
      toast.error(passwordError);
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully! You can now log in.');
      switchMode('login');
      
      // Clear the URL hash to remove the token
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update password. Please try again or request a new reset link.'
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

    if (isRegister && !validatePassword(password)) {
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
    setConfirmPassword('');
    setPasswordError('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
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
            : isResetPassword
              ? 'Set New Password'
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
        ) : isResetPassword ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              {passwordError && (
                <p className="text-red-400 text-xs mt-1">{passwordError}</p>
              )}
              {!passwordError && password && (
                <p className="text-green-400 text-xs mt-1">Password meets requirements</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {password && confirmPassword && password === confirmPassword && (
                <p className="text-green-400 text-xs mt-1">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 px-4 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
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
              {isRegister && passwordError && (
                <p className="text-red-400 text-xs mt-1">{passwordError}</p>
              )}
              {isRegister && !passwordError && password && (
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

// Create a separate component to handle recovery URLs
export function PasswordResetHandler() {
  const [modalOpen, setModalOpen] = useState(false);
  
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setModalOpen(true);
    }
  }, []);
  
  return (
    <AuthModal 
      isOpen={modalOpen} 
      onClose={() => setModalOpen(false)}
      initialMode="reset"
    />
  );
}