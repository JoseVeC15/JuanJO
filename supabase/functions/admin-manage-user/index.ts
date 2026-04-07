import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, preferred-timezone-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
};

const ALLOWED_MODULES = new Set([
  'dashboard',
  'gastos',
  'ingresos',
  'cobros',
  'agenda',
  'planificacion',
  'set',
  'conciliacion',
  'cierre',
  'sifen',
  'clientes',
  'proyectos',
  'fichas',
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Configuración incompleta de secretos en Edge Function (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado: falta token Bearer.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Cliente del usuario llamante (JWT del frontend) para autenticar y autorizar.
    const supabaseCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: callerAuth, error: callerError } = await supabaseCaller.auth.getUser();
    if (callerError || !callerAuth.user) {
      return new Response(JSON.stringify({ error: `No autorizado: JWT inválido o expirado. ${callerError?.message || ''}`.trim() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Cliente administrativo con SERVICE_ROLE
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: callerProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('nivel_acceso')
      .eq('id', callerAuth.user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: `No se pudo validar permisos del solicitante: ${profileError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (callerProfile?.nivel_acceso !== 1) {
      return new Response(JSON.stringify({ error: 'No autorizado: se requiere nivel_acceso=1 (Super Admin).' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json();
    console.log('📦 [Backend] Body recibido:', JSON.stringify(body, null, 2));
    const { action, userId, data = {} } = body;

    if (!action || !userId) {
      throw new Error('Faltan action o userId');
    }

    // --- ACCIÓN: ELIMINAR USUARIO ---
    if (action === 'delete_user') {
      const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      const { error: dbError } = await supabaseClient.from('profiles').delete().eq('id', userId);
      if (dbError) throw dbError;

      return new Response(JSON.stringify({ message: 'Usuario eliminado con éxito' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- ACCIÓN: ACTUALIZAR PERFIL ---
    if (action === 'update_user') {
      const updates: Record<string, unknown> = {};

      if (typeof data.nombre_completo === 'string' && data.nombre_completo.trim().length >= 2) {
        updates.nombre_completo = data.nombre_completo.trim();
      }

      if (data.modulos_habilitados !== undefined) {
        const modules = normalizeModules(data.modulos_habilitados);
        if (modules.length === 0) throw new Error('Debes habilitar al menos un módulo válido');

        updates.modulos_habilitados = modules;
        updates.facturacion_habilitada = modules.some((m) => BILLING_MODULES.has(m));
      } else if (typeof data.facturacion_habilitada === 'boolean') {
        updates.facturacion_habilitada = data.facturacion_habilitada;
      }

      if (typeof data.service_type === 'string' && data.service_type.trim().length > 0) {
        updates.service_type = data.service_type.trim();
      }

      if (data.empresas_permitidas !== undefined) {
        updates.empresas_permitidas = normalizeTextArray(data.empresas_permitidas);
      }

      if (data.empresa_activa !== undefined) {
        updates.empresa_activa = data.empresa_activa ? String(data.empresa_activa).trim() : null;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      const { error: dbError } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ message: 'Perfil actualizado con éxito', updates }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- ACCIÓN: RESETEAR CONTRASEÑA ---
    if (action === 'reset_password') {
      if (!data.new_password || String(data.new_password).length < 8) {
        throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
      }

      const { error: authError } = await supabaseClient.auth.admin.updateUserById(userId, {
        password: data.new_password,
        user_metadata: { must_change_password: true },
      });
      if (authError) throw authError;

      return new Response(JSON.stringify({ message: 'Contraseña reseteada con éxito' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- ACCIÓN: SUSPENDER / ACTIVAR ---
    if (action === 'toggle_suspension') {
      if (!['activo', 'suspendido'].includes(String(data.estado))) {
        throw new Error('Estado inválido');
      }

      const { error: dbError } = await supabaseClient
        .from('profiles')
        .update({ estado: data.estado })
        .eq('id', userId);

      if (dbError) throw dbError;

      // Sincronizar en metadata de Auth para capas extra de seguridad
      await supabaseClient.auth.admin.updateUserById(userId, {
        user_metadata: { estado: data.estado },
      });

      return new Response(JSON.stringify({ message: `Estado cambiado a: ${data.estado}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Acción administrativa no válida');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('error fatal en admin-manage-user:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
