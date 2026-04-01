-- ============================================
-- MÓDULO DE CLIENTES (DIRECTORIO FISCAL) 🇵🇾🛡️
-- REESTRUCTURACIÓN INTEGRAL A ESPAÑOL - v1.0.0
-- ============================================

-- 1. TABLA DE CLIENTES (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ruc text NOT NULL,
    razon_social text NOT NULL,
    direccion text,
    telefono text,
    email text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Un usuario no puede tener dos clientes con el mismo RUC (índice único compuesto)
    UNIQUE(user_id, ruc)
);

-- 2. SEGURIDAD RLS (ROW LEVEL SECURITY)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACCESO
DROP POLICY IF EXISTS "Usuarios ven sus propios clientes" ON public.clientes;
CREATE POLICY "Usuarios ven sus propios clientes" ON public.clientes 
    FOR ALL USING (auth.uid() = user_id);

-- 4. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_ruc ON public.clientes(ruc);
CREATE INDEX IF NOT EXISTS idx_clientes_razon_social ON public.clientes(razon_social);
