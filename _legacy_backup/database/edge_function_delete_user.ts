// supabase/functions/delete-client-user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
}

console.log("Iniciando función de eliminación de usuario...")

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

    // Validar que sea un POST
    if (req.method !== 'POST') {
       throw new Error("Mátodo no permitido")
    }

    const { userId } = await req.json()
    if (!userId) throw new Error("userId es requerido")

    console.log(`ELIMINANDO USUARIO: ${userId}`)

    // 1. Obtener datos del usuario antes de borrar (opcional, para el log)
    const { data: { user }, error: getError } = await supabaseClient.auth.admin.getUserById(userId)
    if (getError || !user) {
        console.warn("Usuario no encontrado en Auth, intentando borrar solo perfil")
    }

    // 2. Borrar de Auth (esto debería disparar el ON DELETE CASCADE en profiles si está configurado)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error("ERROR DELETE AUTH:", deleteError.message)
      throw deleteError
    }

    // 3. Asegurar limpieza en profiles (por si no hay cascada)
    await supabaseClient.from('profiles').delete().eq('id', userId)

    console.log("¡USUARIO ELIMINADO!")

    return new Response(
      JSON.stringify({ message: "Éxito", deletedId: userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("ERROR FINAL:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
