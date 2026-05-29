import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loginAsSandboxUser: (name: string, email: string) => void;
  isSandbox: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    // If sandbox user was stored in localStorage
    const savedSandboxUser = localStorage.getItem('tripsplit_sandbox_user');
    if (savedSandboxUser) {
      try {
        const parsed = JSON.parse(savedSandboxUser);
        setProfile(parsed);
        setUser({
          id: parsed.id,
          email: parsed.email,
          user_metadata: { name: parsed.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any);
        setIsSandbox(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('tripsplit_sandbox_user');
      }
    }

    // Standard Supabase Auth Flow
    let active = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && active) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error fetching auth session', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
      } else if (error) {
        console.warn('Profile not found in database, waiting for trigger sync...');
      }
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  }

  async function signIn(email: string, password: string) {
    localStorage.removeItem('tripsplit_sandbox_user');
    setIsSandbox(false);
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp(email: string, password: string, name: string) {
    localStorage.removeItem('tripsplit_sandbox_user');
    setIsSandbox(false);
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
  }

  async function signOut() {
    localStorage.removeItem('tripsplit_sandbox_user');
    setIsSandbox(false);
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  }

  // Helper for sandbox mode to immediately preview the application
  function loginAsSandboxUser(name: string, email: string) {
    // Generate a fixed-length UUID for sandbox based on email
    const uuid = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    const newProfile: UserProfile = {
      id: uuid,
      name,
      email,
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    };
    localStorage.setItem('tripsplit_sandbox_user', JSON.stringify(newProfile));
    setProfile(newProfile);
    setUser({
      id: uuid,
      email,
      user_metadata: { name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any);
    setIsSandbox(true);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        loginAsSandboxUser,
        isSandbox,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
