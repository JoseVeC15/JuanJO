// supabase/functions/create-client-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, password, nombre_completo } = await req.json();

    if (!email || !password || !nombre_completo) {
      throw new Error('Email, password and name are required');
    }

    // 1. Crear el usuario en Auth
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre_completo }
    });

    if (authError) throw authError;

    const user = userData.user;

    // 2. Crear el perfil en public.profiles
    // Nota: El trigger handle_new_user puede que ya lo cree, pero lo forzamos 
    // para asegurar que el nombre esté sincronizado inmediatamente.
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
      // Si falla el perfil, borramos el usuario creado para evitar rastro sucio
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    console.log(`✅ Usuario creado: ${email} (${user.id})`);

    return new Response(
      JSON.stringify({ message: 'Usuario registrado con éxito', user_id: user.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error en create-client-user:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
