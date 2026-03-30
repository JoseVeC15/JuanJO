import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, preferred-timezone-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const body = await req.json()
    const { action, userId, data } = body

    if (action === 'delete_user') {
      const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)
      if (authError) throw authError
      
      const { error: dbError } = await supabaseClient.from('profiles').delete().eq('id', userId)
      if (dbError) throw dbError

      return new Response(JSON.stringify({ message: 'Usuario eliminado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'update_user') {
      const { error: dbError } = await supabaseClient
        .from('profiles')
        .update({ nombre_completo: data.nombre_completo })
        .eq('id', userId)
      
      if (dbError) throw dbError

      return new Response(JSON.stringify({ message: 'Usuario actualizado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'reset_password') {
      const { error: authError } = await supabaseClient.auth.admin.updateUserById(userId, {
        password: data.new_password
      })
      if (authError) throw authError

      return new Response(JSON.stringify({ message: 'Contraseña reseteada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'toggle_suspension') {
      // 1. Actualizar tabla profiles
      const { error: dbError } = await supabaseClient
        .from('profiles')
        .update({ estado: data.estado })
        .eq('id', userId)
      
      if (dbError) throw dbError

      // 2. (Opcional) Guardar en metadata de Auth para redundancia
      await supabaseClient.auth.admin.updateUserById(userId, {
        user_metadata: { estado: data.estado }
      })

      return new Response(JSON.stringify({ message: `Usuario ${data.estado}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Acción no válida')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
