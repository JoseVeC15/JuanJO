-- Plantilla de rollback no destructivo
-- Usar solo tras validar impacto en staging.

BEGIN;

-- Ejemplo: desactivar metricas si fuese necesario
-- DROP TABLE IF EXISTS public.sifen_metricas_eventos;

-- Ejemplo: quitar columnas de observabilidad agregadas
-- ALTER TABLE public.documentos_xml_logs
--   DROP COLUMN IF EXISTS request_id,
--   DROP COLUMN IF EXISTS estado,
--   DROP COLUMN IF EXISTS error_code,
--   DROP COLUMN IF EXISTS error_message,
--   DROP COLUMN IF EXISTS latency_ms,
--   DROP COLUMN IF EXISTS reintentos;

COMMIT;
