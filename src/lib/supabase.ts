/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Usamos las variables de entorno _LIVE para producción seguras
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_LIVE;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_LIVE;

if (!supabaseUrl || !supabaseAnonKey) {
  // En desarrollo esto ayuda a detectar qué falta
  console.warn('⚠️ ADVERTENCIA: Faltan variables de entorno de Supabase (URL o Anon Key).');
}

// Configuración robusta del cliente conforme a los estándares de seguridad 2026
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder', 
  {
    auth: {
      flowType: 'pkce', // Mayor seguridad contra interceptación de tokens
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storageKey: 'fp_session'
    },
    global: {
      headers: { 'x-client-info': 'finance-pro-web@2.0.0' }
    }
  }
);

// Helper para verificar conexión (útil para debug de "Failed to fetch")
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('❌ Error de conexión con Supabase:', err);
    return false;
  }
};
