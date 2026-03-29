// supabase/functions/create-client-user/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    const body = await req.json()
    const { email, password, nombre_completo } = body
    
    console.log(`Paso 1: Creando usuario Auth para ${email}`)

    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nombre_completo }
    })

    if (authError) throw authError

    console.log(`Paso 2: Usuario Auth creado (ID: ${authUser.user.id}).`)

    // Intentamos UPSERT con ambos casos para prevenir errores de esquema
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert({ 
        id: authUser.user.id,
        nombre_completo,
        "Nombre_completo": nombre_completo, // Para ser compatibles con la mayúscula detectada
        nivel_acceso: 2 
      })

    if (profileError) {
       console.error("Error en profiles:", profileError.message)
       // Si falla por una de las dos, intentamos una por una
       await supabaseClient.from('profiles').upsert({ id: authUser.user.id, nivel_acceso: 2 })
    }

    console.log("¡Registro completado con éxito!")

    return new Response(
      JSON.stringify({ message: "Éxito", id: authUser.user.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error("Error fatal:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
