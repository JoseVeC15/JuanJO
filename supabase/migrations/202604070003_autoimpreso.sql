-- ============================================
-- MODULO DE FACTURA AUTOIMPRESO DNIT/SET 🇵🇾
-- Fecha: 2026-04-07
-- Regulacion: Decretos 8345/06, 10797/13
-- ============================================

CREATE TABLE IF NOT EXISTS public.facturas_autoimpreso (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Tipo de comprobante fiscal
    tipo_comprobante text NOT NULL CHECK (tipo_comprobante IN ('factura_comercial', 'nota_credito', 'nota_debito', 'recibo')),

    -- Identificacion del documento
    numero_documento text NOT NULL, -- Formato XXX-XXX-XXXXXXX
    timbrado text NOT NULL,
    vencimiento_timbrado date,

    -- Datos fiscales
    fecha_emision date NOT NULL,
    razon_social text NOT NULL, -- Receptor (cliente)
    ruc text NOT NULL,
    condicion_operacion text DEFAULT 'contado' CHECK (condicion_operacion IN ('contado', 'credito')),

    -- Montos en Guaranies
    monto_total bigint NOT NULL DEFAULT 0,
    iva_10 bigint DEFAULT 0,
    iva_5 bigint DEFAULT 0,
    exentas bigint DEFAULT 0,

    -- Ubicacion fiscal
    establecimiento text NOT NULL DEFAULT '001',
    punto_expedicion text NOT NULL DEFAULT '001',

    -- Estado
    estado text DEFAULT 'emitido' CHECK (estado IN ('emitido', 'anulado')),

    -- Extras
    imagen_url text,
    notas text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autoimpreso_user ON public.facturas_autoimpreso(user_id);
CREATE INDEX IF NOT EXISTS idx_autoimpreso_fecha ON public.facturas_autoimpreso(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_autoimpreso_estado ON public.facturas_autoimpreso(estado);

-- Row Level Security
ALTER TABLE public.facturas_autoimpreso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Solo el dueño ve sus autoimpresos" ON public.facturas_autoimpreso;
CREATE POLICY "Solo el dueño ve sus autoimpresos" ON public.facturas_autoimpreso
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Adicional: agregar tipo_comprobante a ingresos
-- para consistencia fiscal
-- ============================================
ALTER TABLE public.ingresos
    ADD COLUMN IF NOT EXISTS tipo_comprobante text DEFAULT 'factura_comercial'
    CHECK (tipo_comprobante IN ('factura_comercial', 'nota_credito', 'nota_debito', 'recibo', 'factura_electronica'));
