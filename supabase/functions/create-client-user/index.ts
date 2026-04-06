// supabase/functions/create-client-user/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // CORS Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // 0. Validar configuración de red/secretos básica
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Falta configuración de SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Configuración de servidor incompleta (Secretos no configurados/inválidos)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { email, password, nombre_completo } = await req.json();

    if (!email || !password || !nombre_completo) {
      throw new Error('Email, password and name are required');
    }

    console.log(`🚀 Intentando crear usuario: ${email}`);

    // 1. Crear el usuario en Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo }
    });

    if (authError) {
      console.error('❌ Error Auth:', authError.message);
      throw authError; // El catch lo manejará
    }

    const user = userData.user;

    // 2. Crear el perfil en public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        email: email,
        nombre_completo: nombre_completo,
        nivel_acceso: 3, // Acceso standard por defecto
        modulos_habilitados: ['dashboard', 'config'], // Módulos básicos
        facturacion_habilitada: false
      });

    if (profileError) {
      console.error('❌ Error Perfil DB:', profileError.message);
      // Rollback del usuario para mantener integridad
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    console.log(`✅ Usuario y perfil creados con éxito: ${email}`);

    return new Response(
      JSON.stringify({ message: 'Usuario registrado con éxito', user_id: user.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error fatal en create-client-user:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
