-- ============================================
-- CUMPLIMIENTO FISCAL SIFEN (DNIT Paraguay)
-- Fecha: 2026-04-02
-- ============================================

-- Agregar columnas obligatorias para emisión legal según SIFEN v1.50
ALTER TABLE public.documentos_electronicos
ADD COLUMN IF NOT EXISTS condicion_operacion text DEFAULT 'contado',
ADD COLUMN IF NOT EXISTS receptor_email text,
ADD COLUMN IF NOT EXISTS receptor_direccion text;

-- Asegurar que los ítems existentes tengan un valor por defecto para liquidación de IVA
-- (En Paraguay es 10, 5 o 0)
ALTER TABLE public.documentos_items
ALTER COLUMN iva_tipo SET DEFAULT 10;
