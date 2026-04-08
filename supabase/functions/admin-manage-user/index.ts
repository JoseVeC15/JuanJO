import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, preferred-timezone-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
};

const ALLOWED_MODULES = new Set([
  'dashboard',
  'analizador-ia',
  'gastos',
  'ingresos',
  'gestion-freelancer',
  'cobros',
  'agenda',
  'planificacion',
  'set',
  'conciliacion',
  'cierre',
  'sifen',
  'clientes',
  'proyectos',
  'servicios',
  'inventario',
  'catalog',
  'reportes',
  'settings',
]);

const BILLING_MODULES = new Set(['ingresos', 'sifen', 'clientes']);

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error('El valor debe ser un array');
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  );
}

function normalizeModules(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error('modulos_habilitados debe ser un array');
  }

  const cleaned = value
    .map((m) => String(m).trim())
    .filter((m) => ALLOWED_MODULES.has(m));

  return Array.from(new Set(cleaned));
}

Deno.serve(async (req: Request) => {
  // Manejo de pre-vuelo para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Configuración incompleta: faltan secretos (SUPABASE_URL, SERVICE_ROLE_KEY).');
    }

    // Cliente administrativo con SERVICE_ROLE para validaciones y DB
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // --- VALIDACIÓN DE USUARIO (Robustez mejorada contra Gateway 401) ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No autorizado: falta token de sesión');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    // Validamos el usuario directamente decodificando el JWT con el servicio de Auth de Supabase
    // usando la clave de servicio. Esto es infalible si el token es válido internamente.
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('❌ Error validando usuario con Token:', userError?.message);
      throw new Error(`Acceso denegado: Sesión inválida (${userError?.message || 'Token expirado'}). Vuelve a iniciar sesión.`);
    }

    // Verificamos nivel de acceso en el perfil (debe ser Superadmin = 1)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('nivel_acceso')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.nivel_acceso !== 1) {
      console.error('❌ Intento de acceso no autorizado:', { userId: user.id, profile });
      throw new Error('No tienes permisos de administrador para realizar esta operación.');
    }

    console.log(`✅ Acceso concedido para admin: ${user.email}`);

    // --- PROCESAMIENTO DE ACCIONES ---
    const body = await req.json();
    console.log('📦 [Backend] Body recibido:', JSON.stringify(body, null, 2));
    const { action, userId, data = {} } = body;

    if (!action || !userId) {
      throw new Error('Faltan action o userId en la petición');
    }

    // --- ACCIÓN: ACTUALIZAR PERFIL ---
    if (action === 'update_user') {
      console.log(`📝 Actualizando perfil para: ${userId}`);
      const updates: Record<string, unknown> = {};

      if (typeof data.nombre_completo === 'string' && data.nombre_completo.trim().length >= 2) {
        updates.nombre_completo = data.nombre_completo.trim();
      }

      if (data.modulos_habilitados !== undefined) {
        const modules = normalizeModules(data.modulos_habilitados);
        if (modules.length === 0) {
          throw new Error('Debes habilitar al menos un módulo válido.');
        }
        updates.modulos_habilitados = modules;
        updates.facturacion_habilitada = modules.some((m) => BILLING_MODULES.has(m));
      }

      if (typeof data.service_type === 'string') {
        updates.service_type = data.service_type.trim();
      }

      if (data.empresas_permitidas !== undefined) {
        updates.empresas_permitidas = normalizeTextArray(data.empresas_permitidas);
      }

      if (data.empresa_activa !== undefined) {
        updates.empresa_activa = data.empresa_activa ? String(data.empresa_activa).trim() : null;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No se enviaron campos válidos para actualizar.');
      }

      console.log('💾 Aplicando cambios en DB:', updates);
      const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Perfil actualizado con éxito', 
        updates 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- ACCIÓN: RESETEAR CONTRASEÑA ---
    if (action === 'reset_password') {
      if (!data.new_password || String(data.new_password).length < 8) {
        throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.new_password,
        user_metadata: { must_change_password: true },
      });
      if (authError) throw authError;

      return new Response(JSON.stringify({ success: true, message: 'Contraseña reseteada con éxito' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- ACCIÓN: ELIMINAR USUARIO ---
    if (action === 'delete_user') {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      const { error: dbError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true, message: 'Usuario eliminado con éxito' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Acción administrativa no válida');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    const status = (error as any)?.status || 400;
    
    console.error(`🚨 Error en Edge Function [${status}]:`, message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: message,
      code: status,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Devolvemos 200 para que el frontend pueda leer el JSON de error
    });
  }
});
