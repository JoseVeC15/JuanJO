-- ============================================
-- SERVICE_TYPE EN PROFILES
-- Fecha: 2026-04-07
-- ============================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS service_type text;

UPDATE public.profiles
SET service_type = CASE
  WHEN service_type = 'comercio' THEN 'comercio_minorista'
  WHEN service_type = 'sifen' THEN 'sifen_empresarial'
  WHEN service_type = 'logistica' THEN 'distribucion_flota'
  WHEN service_type IS NULL AND tipo_negocio = 'comercio' THEN 'comercio_minorista'
  WHEN service_type IS NULL AND tipo_negocio = 'logistica' THEN 'distribucion_flota'
  WHEN service_type IS NULL AND tipo_negocio = 'sifen' THEN 'sifen_empresarial'
  WHEN service_type IS NULL AND tipo_negocio IN ('audiovisual', 'salud', 'educacion') THEN tipo_negocio
  WHEN service_type IS NULL THEN 'freelancer'
  ELSE service_type
END;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_service_type_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_service_type_check
CHECK (service_type IN (
  'freelancer',
  'servicios_profesionales',
  'sifen_empresarial',
  'autofactura_guiada',
  'distribucion_flota',
  'comercio_minorista',
  'multiempresa',
  'audiovisual',
  'salud',
  'educacion'
));

ALTER TABLE public.profiles
ALTER COLUMN service_type SET DEFAULT 'freelancer';

COMMENT ON COLUMN public.profiles.service_type IS 'Perfil funcional del SaaS para render dinámico de módulos, dashboard y reportes.';
