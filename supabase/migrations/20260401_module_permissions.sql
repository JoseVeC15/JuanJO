-- ============================================
-- PERMISOS POR MODULO PARA CLIENTES
-- Fecha: 2026-04-01
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS modulos_habilitados text[];

UPDATE public.profiles
SET modulos_habilitados = CASE
  WHEN nivel_acceso = 1 THEN ARRAY['dashboard','gastos','ingresos','sifen','clientes','proyectos','inventario','reportes','settings']::text[]
  WHEN facturacion_habilitada = true THEN ARRAY['dashboard','gastos','ingresos','sifen','clientes','proyectos','inventario','reportes','settings']::text[]
  ELSE ARRAY['dashboard','gastos','proyectos','inventario','reportes','settings']::text[]
END
WHERE modulos_habilitados IS NULL OR array_length(modulos_habilitados, 1) IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN modulos_habilitados SET DEFAULT ARRAY['dashboard','gastos','proyectos','inventario','reportes','settings']::text[];

COMMENT ON COLUMN public.profiles.modulos_habilitados IS 'Lista de modulos visibles/habilitados para el usuario. Controla navegacion y rutas.';
