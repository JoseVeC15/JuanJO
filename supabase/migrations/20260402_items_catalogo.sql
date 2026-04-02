-- ============================================
-- CATÁLOGO DE SERVICIOS Y PRODUCTOS 🇵🇾🛡️
-- Fecha: 2026-04-02
-- ============================================

-- 1. TABLA DE CATÁLOGO (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.items_catalogo (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre text NOT NULL,
    descripcion_larga text,
    precio_sugerido bigint NOT NULL DEFAULT 0,
    iva_tipo integer NOT NULL DEFAULT 10, -- 10, 5, 0 (Exenta)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Un usuario no puede tener dos items con el mismo nombre exacto
    UNIQUE(user_id, nombre)
);

-- 2. SEGURIDAD RLS
ALTER TABLE public.items_catalogo ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACCESO
DROP POLICY IF EXISTS "Solo el dueño ve su catálogo" ON public.items_catalogo;
CREATE POLICY "Solo el dueño ve su catálogo" ON public.items_catalogo 
    FOR ALL USING (auth.uid() = user_id);

-- 4. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_items_catalogo_user_id ON public.items_catalogo(user_id);
CREATE INDEX IF NOT EXISTS idx_items_catalogo_nombre ON public.items_catalogo(nombre);
