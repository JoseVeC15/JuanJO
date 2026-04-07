-- ============================================
-- MULTIEMPRESA: ENTITY SCOPE + RLS
-- Fecha: 2026-04-07
-- ============================================

-- 1. COLUMNAS DE ALCANCE POR ENTIDAD
ALTER TABLE IF EXISTS public.proyectos
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.ingresos
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.facturas_gastos
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.clientes
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.vehiculos
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.registro_combustible
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.registro_mantenimiento
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

ALTER TABLE IF EXISTS public.viajes
ADD COLUMN IF NOT EXISTS empresa_id text,
ADD COLUMN IF NOT EXISTS empresa_origen text,
ADD COLUMN IF NOT EXISTS unidad_negocio text;

-- 2. ÍNDICES BÁSICOS DE CONSULTA
CREATE INDEX IF NOT EXISTS idx_proyectos_user_empresa_id ON public.proyectos(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_user_empresa_id ON public.ingresos(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_gastos_user_empresa_id ON public.facturas_gastos(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_empresa_id ON public.clientes(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_user_empresa_id ON public.vehiculos(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_registro_combustible_user_empresa_id ON public.registro_combustible(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_registro_mantenimiento_user_empresa_id ON public.registro_mantenimiento(user_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_viajes_user_empresa_id ON public.viajes(user_id, empresa_id);

-- 3. FUNCIÓN COMÚN DE AUTORIZACIÓN POR ENTIDAD
CREATE OR REPLACE FUNCTION public.can_access_entity_scope(
  row_user_id uuid,
  row_empresa_id text DEFAULT NULL,
  row_empresa_origen text DEFAULT NULL,
  row_unidad_negocio text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_profile AS (
    SELECT
      p.id,
      p.nivel_acceso,
      COALESCE(p.service_type, 'freelancer') AS service_type,
      COALESCE(p.empresas_permitidas, '{}'::text[]) AS empresas_permitidas
    FROM public.profiles p
    WHERE p.id = auth.uid()
  )
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN EXISTS (SELECT 1 FROM current_profile cp WHERE cp.nivel_acceso = 1) THEN true
    WHEN auth.uid() <> row_user_id THEN false
    WHEN EXISTS (SELECT 1 FROM current_profile cp WHERE cp.service_type <> 'multiempresa') THEN true
    ELSE EXISTS (
      SELECT 1
      FROM current_profile cp
      WHERE COALESCE(NULLIF(row_empresa_id, ''), NULLIF(row_empresa_origen, ''), NULLIF(row_unidad_negocio, '')) = ANY (cp.empresas_permitidas)
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.can_access_entity_scope(uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.can_access_entity_scope(uuid, text, text, text)
IS 'Evalúa acceso a una fila según owner, service_type y entidades permitidas del perfil autenticado.';

-- 4. POLÍTICAS RLS POR ENTIDAD
ALTER TABLE IF EXISTS public.proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus propios proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a sus proyectos por entidad" ON public.proyectos;
CREATE POLICY "Usuarios multiempresa acceden a sus proyectos por entidad" ON public.proyectos
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.ingresos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus propios ingresos" ON public.ingresos;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a sus ingresos por entidad" ON public.ingresos;
CREATE POLICY "Usuarios multiempresa acceden a sus ingresos por entidad" ON public.ingresos
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.facturas_gastos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus propios gastos" ON public.facturas_gastos;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a sus gastos por entidad" ON public.facturas_gastos;
CREATE POLICY "Usuarios multiempresa acceden a sus gastos por entidad" ON public.facturas_gastos
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus propios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a sus clientes por entidad" ON public.clientes;
CREATE POLICY "Usuarios multiempresa acceden a sus clientes por entidad" ON public.clientes
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.vehiculos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve sus vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a sus vehiculos por entidad" ON public.vehiculos;
CREATE POLICY "Usuarios multiempresa acceden a sus vehiculos por entidad" ON public.vehiculos
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.registro_combustible ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve su combustible" ON public.registro_combustible;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a su combustible por entidad" ON public.registro_combustible;
CREATE POLICY "Usuarios multiempresa acceden a su combustible por entidad" ON public.registro_combustible
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.registro_mantenimiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve su mantenimiento" ON public.registro_mantenimiento;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a su mantenimiento por entidad" ON public.registro_mantenimiento;
CREATE POLICY "Usuarios multiempresa acceden a su mantenimiento por entidad" ON public.registro_mantenimiento
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));

ALTER TABLE IF EXISTS public.viajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve sus viajes" ON public.viajes;
DROP POLICY IF EXISTS "Usuarios multiempresa acceden a sus viajes por entidad" ON public.viajes;
CREATE POLICY "Usuarios multiempresa acceden a sus viajes por entidad" ON public.viajes
  FOR ALL
  USING (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio))
  WITH CHECK (public.can_access_entity_scope(user_id, empresa_id, empresa_origen, unidad_negocio));