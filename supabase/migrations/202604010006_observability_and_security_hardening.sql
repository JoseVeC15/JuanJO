-- ============================================
-- OBSERVABILITY + SECURITY HARDENING
-- Fecha: 2026-04-01
-- ============================================

-- 1) Extensiones de trazabilidad para logs de documentos SIFEN
ALTER TABLE public.documentos_xml_logs
ADD COLUMN IF NOT EXISTS request_id text,
ADD COLUMN IF NOT EXISTS estado text,
ADD COLUMN IF NOT EXISTS error_code text,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS latency_ms integer,
ADD COLUMN IF NOT EXISTS reintentos integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_documentos_xml_logs_request_id ON public.documentos_xml_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_documentos_xml_logs_estado ON public.documentos_xml_logs(estado);

-- 2) Metricas minimas por emision (exito/fallo/latencia)
CREATE TABLE IF NOT EXISTS public.sifen_metricas_eventos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id text,
    documento_id uuid REFERENCES public.documentos_electronicos(id) ON DELETE SET NULL,
    ok boolean NOT NULL,
    latency_ms integer NOT NULL,
    error_code text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sifen_metricas_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant ve sus metricas SIFEN" ON public.sifen_metricas_eventos;
CREATE POLICY "Tenant ve sus metricas SIFEN" ON public.sifen_metricas_eventos
    FOR SELECT USING (
        documento_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.documentos_electronicos d
            WHERE d.id = sifen_metricas_eventos.documento_id
            AND d.user_id = auth.uid()
        )
    );

-- Escritura exclusiva para service role/edge functions.
DROP POLICY IF EXISTS "Service role escribe metricas SIFEN" ON public.sifen_metricas_eventos;
CREATE POLICY "Service role escribe metricas SIFEN" ON public.sifen_metricas_eventos
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 3) Auditoria de rotacion de secretos
CREATE TABLE IF NOT EXISTS public.secret_rotation_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    secret_scope text NOT NULL,
    rotated_at timestamptz DEFAULT now(),
    notes text
);

ALTER TABLE public.secret_rotation_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve su auditoria de secretos" ON public.secret_rotation_audit;
CREATE POLICY "Usuario ve su auditoria de secretos" ON public.secret_rotation_audit
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario registra rotacion de secretos" ON public.secret_rotation_audit;
CREATE POLICY "Usuario registra rotacion de secretos" ON public.secret_rotation_audit
    FOR INSERT WITH CHECK (auth.uid() = user_id);
