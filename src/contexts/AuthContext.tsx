import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mustChangePassword: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    // Escuchar cambios de estado (incluyendo el retorno de OAuth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event);
      if (session) {
        setUser(session.user);
        setMustChangePassword(!!session.user.user_metadata?.must_change_password);
      } else {
        setUser(null);
        setMustChangePassword(false);
      }
      setLoading(false);

      // Limpiar URL si hay fragmentos de autenticación (evita colisiones)
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Verificación inicial de sesión
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) console.error('Error al recuperar usuario:', error.message);
      if (user) {
        setUser(user);
        setMustChangePassword(!!user.user_metadata?.must_change_password);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, mustChangePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
