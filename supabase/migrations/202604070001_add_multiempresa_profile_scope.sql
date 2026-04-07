-- ============================================
-- MULTIEMPRESA EN PROFILES
-- Fecha: 2026-04-07
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS empresas_permitidas text[] DEFAULT '{}'::text[];

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS empresa_activa text;

UPDATE public.profiles
SET empresas_permitidas = COALESCE(empresas_permitidas, '{}'::text[])
WHERE empresas_permitidas IS NULL;

COMMENT ON COLUMN public.profiles.empresas_permitidas IS 'Lista de entidades/razones sociales habilitadas para el usuario en modo multiempresa.';
COMMENT ON COLUMN public.profiles.empresa_activa IS 'Entidad actualmente seleccionada por el usuario para filtrar datos multiempresa.';