-- ============================================
-- MÓDULO DE FICHAS DE SERVICIO (CRM & WORKFLOW)
-- Fecha: 2026-04-02
-- ============================================

CREATE TABLE IF NOT EXISTS public.fichas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_ficha text NOT NULL,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre text,
    cliente_ruc text,
    tipo_servicio text,
    descripcion_trabajo text,
    estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'facturado', 'cancelado')),
    fecha_ingreso timestamp with time zone DEFAULT now(),
    fecha_entrega_estimada timestamp with time zone,
    fecha_cierre timestamp with time zone,
    monto_estimado numeric DEFAULT 0,
    monto_final numeric DEFAULT 0,
    items jsonb DEFAULT '[]'::jsonb,
    notas text,
    factura_generada boolean DEFAULT false
);

-- Habilitar RLS
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Aislamiento por Usuario)
CREATE POLICY "Usuarios pueden ver sus propias fichas" 
ON public.fichas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias fichas" 
ON public.fichas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias fichas" 
ON public.fichas FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias fichas" 
ON public.fichas FOR DELETE 
USING (auth.uid() = user_id);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_fichas_user_id ON public.fichas(user_id);
CREATE INDEX IF NOT EXISTS idx_fichas_cliente_id ON public.fichas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fichas_estado ON public.fichas(estado);
