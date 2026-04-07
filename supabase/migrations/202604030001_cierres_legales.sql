-- ============================================
-- MODULO DE CIERRES MENSUALES LEGALES (SET/DNIT) 🇵🇾🛡️
-- Fecha: 2026-04-03
-- ============================================

-- 1. TABLA DE CIERRES MENSUALES (SET/DNIT compatible)
CREATE TABLE IF NOT EXISTS public.cierres_periodos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
    anio integer NOT NULL CHECK (anio >= 2020),
    
    -- Totales de Ventas (Base Imponible)
    ventas_10 bigint DEFAULT 0,
    ventas_5 bigint DEFAULT 0,
    ventas_exentas bigint DEFAULT 0,
    
    -- Totales de Compras (Crédito Fiscal)
    compras_10 bigint DEFAULT 0,
    compras_5 bigint DEFAULT 0,
    compras_exentas bigint DEFAULT 0,
    
    -- Resultado Fiscal
    iva_debito_total bigint DEFAULT 0,
    iva_credito_total bigint DEFAULT 0,
    saldo_a_favor_contribuyente bigint DEFAULT 0,
    saldo_a_favor_fisco bigint DEFAULT 0,
    
    -- Estado y Auditoría
    bloqueado boolean DEFAULT true,
    cerrado_at timestamptz DEFAULT now(),
    cerrado_by uuid REFERENCES auth.users(id),
    
    UNIQUE(user_id, mes, anio)
);

-- 2. BITÁCORA DE AUDITORÍA DE CIERRES (Para reaperturas de Superadmin)
CREATE TABLE IF NOT EXISTS public.bitacora_cierres (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cierre_id uuid REFERENCES public.cierres_periodos(id) ON DELETE CASCADE NOT NULL,
    accion text NOT NULL, -- 'CIERRE' | 'REAPERTURA'
    motivo text,
    realizado_by uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. SEGURIDAD RLS
ALTER TABLE public.cierres_periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitacora_cierres ENABLE ROW LEVEL SECURITY;

-- Políticas para cierres
DROP POLICY IF EXISTS "Usuarios ven sus propios cierres" ON public.cierres_periodos;
CREATE POLICY "Usuarios ven sus propios cierres" ON public.cierres_periodos FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Superadmin gestiona cierres" ON public.cierres_periodos;
CREATE POLICY "Superadmin gestiona cierres" ON public.cierres_periodos FOR ALL USING (
    auth.uid() = user_id OR (SELECT nivel_acceso FROM public.profiles WHERE id = auth.uid()) = 1
);

-- Políticas para bitácora
DROP POLICY IF EXISTS "Usuarios ven su propia bitácora" ON public.bitacora_cierres;
CREATE POLICY "Usuarios ven su propia bitácora" ON public.bitacora_cierres FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.cierres_periodos WHERE id = bitacora_cierres.cierre_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Superadmin inserta en bitácora" ON public.bitacora_cierres;
CREATE POLICY "Superadmin inserta en bitácora" ON public.bitacora_cierres FOR INSERT WITH CHECK (
    (SELECT nivel_acceso FROM public.profiles WHERE id = auth.uid()) = 1
);

-- ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_cierres_user_periodo ON public.cierres_periodos(user_id, anio, mes);
