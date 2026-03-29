// supabase/functions/create-client-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usar la clave maestra de forma segura en el servidor
      { auth: { persistSession: false } }
    )

    // Obtener datos del cuerpo
    const { email, password, nombre_completo } = await req.json()

    // 1. Crear el usuario en Auth (Service Role)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirmar automáticamente para que el cliente entre directo
    })

    if (authError) throw authError

    // 2. Actualizar el perfil con el nombre y nivel de acceso (Nivel 2 = Cliente)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ 
        nombre_completo, 
        nivel_acceso: 2 
      })
      .eq('id', authUser.user.id)

    if (profileError) throw profileError

    return new Response(
      JSON.stringify({ message: "Usuario creado con éxito", userId: authUser.user.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
