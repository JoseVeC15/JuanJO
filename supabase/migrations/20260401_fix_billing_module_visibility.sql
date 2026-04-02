-- ============================================
-- NORMALIZACION DE MODULOS PARA USUARIOS CON FACTURACION
-- Fecha: 2026-04-01
-- ============================================

UPDATE public.profiles
SET modulos_habilitados = ARRAY(
  SELECT DISTINCT modulo
  FROM unnest(
    COALESCE(modulos_habilitados, ARRAY[]::text[]) ||
    ARRAY['sifen', 'clientes']::text[]
  ) AS modulo
)
WHERE facturacion_habilitada = true;
