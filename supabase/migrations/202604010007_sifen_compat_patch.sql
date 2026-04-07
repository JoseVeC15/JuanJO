-- ============================================
-- SIFEN COMPAT PATCH (frontend/edge alignment)
-- Fecha: 2026-04-01
-- ============================================
-- Este parche agrega columnas legacy opcionales para evitar fallos
-- si tu entorno productivo aún usa nombres anteriores.

ALTER TABLE public.documentos_electronicos
ADD COLUMN IF NOT EXISTS nro_documento integer,
ADD COLUMN IF NOT EXISTS punto_establecimiento text,
ADD COLUMN IF NOT EXISTS codigo_seguridad text;

ALTER TABLE public.certificados_digitales
ADD COLUMN IF NOT EXISTS certificate_base64 text,
ADD COLUMN IF NOT EXISTS password_p12 text;

-- Backfill opcional hacia columnas legacy (si quieres compatibilidad temporal)
UPDATE public.documentos_electronicos
SET nro_documento = COALESCE(nro_documento, NULLIF(split_part(numero_factura, '-', 3), '')::integer)
WHERE numero_factura IS NOT NULL;

UPDATE public.documentos_electronicos d
SET punto_establecimiento = COALESCE(d.punto_establecimiento, c.establecimiento),
    codigo_seguridad = COALESCE(d.codigo_seguridad, c.id_csc::text)
FROM public.configuracion_sifen c
WHERE c.user_id = d.user_id;

UPDATE public.certificados_digitales
SET certificate_base64 = COALESCE(certificate_base64, certificado_base64),
    password_p12 = COALESCE(password_p12, password_cifrada);
