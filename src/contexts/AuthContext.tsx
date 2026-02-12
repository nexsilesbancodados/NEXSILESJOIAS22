import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-db';
import { useQueryClient } from '@tanstack/react-query';

const db = supabase;
interface Profile {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'revendedora';
  nome: string;
  telefone?: string;
  email?: string;
  comissao?: number;
  avatar_url?: string;
  ativo?: boolean;
  senha_portal?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
            } else {
              setSession(null);
              setUser(null);
              setProfile(null);
              setIsAdmin(false);
            }
          });
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfileAndRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndRole = async (userId: string) => {
    try {
      // Fetch profile and role in parallel
      // Check for admin OR gerente role - both get full access
      const [profileResult, adminResult, gerenteResult] = await Promise.all([
        db.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        db.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
        db.from('user_roles').select('role').eq('user_id', userId).eq('role', 'gerente').maybeSingle(),
      ]);

      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
        setProfile(null);
      } else if (profileResult.data) {
        setProfile(profileResult.data as Profile);
      } else {
        console.log('Profile not found, may be created by trigger');
        setProfile(null);
      }

      // Gerentes have the same rights as admins/owners
      setIsAdmin(!!adminResult.data || !!gerenteResult.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome,
            role: 'admin',
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = useCallback(async () => {
    queryClient.clear();
    localStorage.removeItem('nexsiles-storage');
    localStorage.removeItem('menuMode');
    localStorage.removeItem('sidebarExpanded');
    localStorage.removeItem('sidebarPinned');
    // Use local scope so other devices/tabs stay logged in
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setSession(null);
    setProfile(null);
  }, [queryClient]);

  

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAdmin,
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
