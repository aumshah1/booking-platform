'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import api from '@/lib/axios';

interface User {
  id: string;
  email: string;
  user_metadata: {
    role?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setSessionData: (session: any, user: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user as User);
        // Sync token to axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      setLoading(false);

      // Listen for changes on auth state (signOut, signIn)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session) {
            setUser(session.user as User);
            api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          } else {
            setUser(null);
            delete api.defaults.headers.common['Authorization'];
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  const setSessionData = async (sessionData: any, userData: any) => {
    if (sessionData) {
      await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
      });
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Backend logout failed', error);
    } finally {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setSessionData, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
