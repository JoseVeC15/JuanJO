// supabase/functions/create-client-user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, preferred-timezone-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
}

console.log("Iniciando instancia de la función...")

Deno.serve(async (req) => {
  // LOG INICIAL CRÍTICO
  console.log(`METODO: ${req.method} | URL: ${req.url}`)

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
    const { email, password, nombre_completo } = body
    
    console.log(`EJECUTANDO REGISTRO: ${email}`)

    // 1. Crear usuario
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nombre_completo }
    })

    if (authError) {
      console.error("ERROR AUTH:", authError.message)
      throw authError
    }

    // 2. Sincronizar perfil (intentamos ambos nombres de columna por si acaso)
    const profileData = { 
      id: authUser.user.id,
      nombre_completo: nombre_completo,
      "Nombre_completo": nombre_completo,
      nivel_acceso: 2 
    }

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert(profileData)

    if (profileError) {
       console.warn("UPSERT falló, reintentando básico:", profileError.message)
       await supabaseClient.from('profiles').upsert({ id: authUser.user.id, nivel_acceso: 2 })
    }

    console.log("¡TODO OK!")

    return new Response(
      JSON.stringify({ message: "Éxito", id: authUser.user.id }),
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
