import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        return checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('Checking admin status for user:', userId); // Debug log
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is the error for no rows returned
        console.error('Admin check error:', error);
        throw error;
      }
      
      const isUserAdmin = !!data;
      console.log('User is admin:', isUserAdmin); // Debug log
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);