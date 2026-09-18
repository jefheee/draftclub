'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  AuthSession, 
  DEMO_USERS, 
  getStoredSession, 
  setStoredSession, 
  clearStoredSession 
} from '@/lib/auth';

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  loginAsDemo: (demoKey: keyof typeof DEMO_USERS) => void;
  loginWithSupabase: (email: string, pass: string) => Promise<{ error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isCaptain: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  loginAsDemo: () => {},
  loginWithSupabase: async () => ({}),
  logout: () => {},
  isAdmin: false,
  isCaptain: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Verificar sessão armazenada localmente
    const local = getStoredSession();
    if (local) {
      setSession(local);
      setLoading(false);
      return;
    }

    // 2. Verificar sessão real do Supabase Auth
    async function checkSupabaseSession() {
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (sbSession?.user) {
          const email = sbSession.user.email || '';
          const role = email.includes('admin') ? 'admin' : 'captain';
          const newSession: AuthSession = {
            userId: sbSession.user.id,
            email,
            name: sbSession.user.user_metadata?.name || email.split('@')[0],
            role,
            tournamentId: '11111111-1111-1111-1111-111111111111',
          };
          setStoredSession(newSession);
          setSession(newSession);
        }
      } catch (err) {
        console.warn('Erro ao checar Supabase auth:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSupabaseSession();
  }, []);

  const loginAsDemo = (demoKey: keyof typeof DEMO_USERS) => {
    const user = DEMO_USERS[demoKey];
    if (!user) return;
    setStoredSession(user);
    setSession(user);
    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/captain');
    }
  };

  const loginWithSupabase = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.user) {
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'captain';
        const newSession: AuthSession = {
          userId: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role,
          tournamentId: '11111111-1111-1111-1111-111111111111',
        };
        setStoredSession(newSession);
        setSession(newSession);

        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/captain');
        }
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Falha na autenticação.' };
    }
  };

  const logout = () => {
    clearStoredSession();
    supabase.auth.signOut().catch(() => {});
    setSession(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        loginAsDemo,
        loginWithSupabase,
        logout,
        isAdmin: session?.role === 'admin',
        isCaptain: session?.role === 'captain' || session?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
