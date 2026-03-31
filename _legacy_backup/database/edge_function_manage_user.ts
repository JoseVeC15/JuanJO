// supabase/functions/admin-manage-user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const { action, userId, payload } = await req.json()
    if (!action || !userId) throw new Error("Acción y userId son requeridos")

    console.log(`EJECUTANDO ACCION ADMIN: ${action} para ${userId}`)

    switch (action) {
      case 'DELETE':
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError
        // Sincronizar profiles por si falla la cascada
        await supabaseAdmin.from('profiles').delete().eq('id', userId)
        break;

      case 'UPDATE_NAME':
        if (!payload.nombre_completo) throw new Error("nombre_completo es requerido")
        // 1. Auth Metadata
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: payload.nombre_completo }
        })
        if (authUpdateError) throw authUpdateError
        // 2. Profiles Table (intentamos ambos nombres de columna)
        const { error: p1 } = await supabaseAdmin.from('profiles').update({ nombre_completo: payload.nombre_completo }).eq('id', userId)
        if (p1) {
             await supabaseAdmin.from('profiles').update({ "Nombre_completo": payload.nombre_completo }).eq('id', userId)
        }
        break;

      case 'RESET_PASSWORD':
        if (!payload.newPassword) throw new Error("newPassword es requerido")
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: payload.newPassword,
          user_metadata: { must_change_password: true } // Forzamos cambio al entrar
        })
        if (resetError) throw resetError
        break;

      default:
        throw new Error("Acción no reconocida")
    }

    return new Response(
      JSON.stringify({ message: "Operación exitosa" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("ADMIN ERROR:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
