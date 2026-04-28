-- ============================================================
-- REGULATORY COMPLIANCE: facturas_virtuales
-- Decreto 8345/06, 10797/13 - DNIT Paraguay
-- 2026-04-28
-- ============================================================

-- Campos del emisor: obligatorios para que el comprobante sea
-- auto-contenido (el RUC/razón social del emisor al momento de emision).
ALTER TABLE public.facturas_virtuales
  ADD COLUMN IF NOT EXISTS vencimiento_timbrado date,
  ADD COLUMN IF NOT EXISTS emisor_razon_social text,
  ADD COLUMN IF NOT EXISTS emisor_ruc text,
  ADD COLUMN IF NOT EXISTS emisor_direccion text,
  ADD COLUMN IF NOT EXISTS emisor_telefono text;

-- Constraint de estado
ALTER TABLE public.facturas_virtuales
  DROP CONSTRAINT IF EXISTS facturas_virtuales_estado_check;
ALTER TABLE public.facturas_virtuales
  ADD CONSTRAINT facturas_virtuales_estado_check
  CHECK (estado IN ('emitido', 'anulado'));
