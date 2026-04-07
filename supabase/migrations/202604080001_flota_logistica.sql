-- ============================================
-- MODULO FLOTA LOGISTICA + MULTI-TENANT TIPO NEGOCIO
-- Fecha: 2026-04-08
-- ============================================

-- 1. TIPO_NEGOCIO EN PROFILES
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS tipo_negocio text DEFAULT 'audiovisual'
    CHECK (tipo_negocio IN ('audiovisual', 'logistica'));

-- 2. TABLA VEHICULOS
CREATE TABLE IF NOT EXISTS public.vehiculos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    patente text NOT NULL,
    marca_modelo text NOT NULL,
    anio integer,
    tipo_vehiculo text NOT NULL CHECK (tipo_vehiculo IN ('camion', 'camioneta', 'furgon', 'remolque', 'otro')),
    tipo_propiedad text NOT NULL CHECK (tipo_propiedad IN ('propietario', 'alquilado')),

    -- Propietario
    costo_adquisicion bigint,
    valor_actual bigint,
    fecha_compra date,

    -- Alquilado
    proveedor_alquiler text,
    costo_alquiler_diario bigint,
    costo_alquiler_mensual bigint,
    fecha_inicio_alquiler date,
    fecha_fin_alquiler date,

    -- Operativo
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'mantenimiento', 'fuera_servicio')),
    capacidad_carga_kg integer,
    km_actual integer,

    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehiculos_user ON public.vehiculos(user_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON public.vehiculos(patente);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado ON public.vehiculos(estado);

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve sus vehiculos" ON public.vehiculos;
CREATE POLICY "Solo el dueño ve sus vehiculos" ON public.vehiculos
    FOR ALL USING (auth.uid() = user_id);

-- 3. TABLA REGISTRO COMBUSTIBLE
CREATE TABLE IF NOT EXISTS public.registro_combustible (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vehiculo_id uuid REFERENCES public.vehiculos(id) ON DELETE CASCADE NOT NULL,

    fecha date NOT NULL,
    cantidad_litros numeric(10,2) NOT NULL,
    precio_total bigint NOT NULL,
    precio_por_litro bigint,
    estacion text,
    km_actual integer,

    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combustible_user ON public.registro_combustible(user_id);
CREATE INDEX IF NOT EXISTS idx_combustible_vehiculo ON public.registro_combustible(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_combustible_fecha ON public.registro_combustible(fecha);

ALTER TABLE public.registro_combustible ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve su combustible" ON public.registro_combustible;
CREATE POLICY "Solo el dueño ve su combustible" ON public.registro_combustible
    FOR ALL USING (auth.uid() = user_id);

-- 4. TABLA REGISTRO MANTENIMIENTO
CREATE TABLE IF NOT EXISTS public.registro_mantenimiento (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vehiculo_id uuid REFERENCES public.vehiculos(id) ON DELETE CASCADE NOT NULL,

    fecha date NOT NULL,
    tipo text NOT NULL CHECK (tipo IN ('preventivo', 'correctivo', 'neumaticos', 'aceite', 'frenos', 'otro')),
    descripcion text,
    costo bigint NOT NULL,
    proveedor text,
    km_actual integer,
    proximo_mantenimiento_km integer,
    proxima_fecha_mantenimiento date,

    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mantenimiento_user ON public.registro_mantenimiento(user_id);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_vehiculo ON public.registro_mantenimiento(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_fecha ON public.registro_mantenimiento(fecha);

ALTER TABLE public.registro_mantenimiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve su mantenimiento" ON public.registro_mantenimiento;
CREATE POLICY "Solo el dueño ve su mantenimiento" ON public.registro_mantenimiento
    FOR ALL USING (auth.uid() = user_id);

-- 5. TABLA VIAJES
CREATE TABLE IF NOT EXISTS public.viajes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vehiculo_id uuid REFERENCES public.vehiculos(id) ON DELETE CASCADE NOT NULL,

    cliente text NOT NULL,
    ruc_cliente text,
    origen text,
    destino text,
    fecha_salida date,
    fecha_llegada date,
    km_recorridos integer,
    ingreso_total bigint,
    estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'completado', 'facturado', 'anulado')),

    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_viajes_user ON public.viajes(user_id);
CREATE INDEX IF NOT EXISTS idx_viajes_vehiculo ON public.viajes(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_viajes_fecha ON public.viajes(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON public.viajes(estado);

ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo el dueño ve sus viajes" ON public.viajes;
CREATE POLICY "Solo el dueño ve sus viajes" ON public.viajes
    FOR ALL USING (auth.uid() = user_id);
