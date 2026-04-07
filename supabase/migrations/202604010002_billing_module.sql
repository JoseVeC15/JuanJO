-- ============================================
-- MODULO DE FACTURACIÓN ELECTRÓNICA SIFEN 🇵🇾🛡️
-- REESTRUCTURACIÓN INTEGRAL A ESPAÑOL - v1.2.0
-- ============================================

-- 1. LIMPIEZA DE ESTRUCTURA ANTIGUA
-- Usamos CASCADE para asegurar que las dependencias (FKs) se eliminen correctamente.
DROP TABLE IF EXISTS public.electronic_document_xml CASCADE;
DROP TABLE IF EXISTS public.electronic_document_items CASCADE;
DROP TABLE IF EXISTS public.electronic_documents CASCADE;
DROP TABLE IF EXISTS public.tenant_sifen_config CASCADE;
DROP TABLE IF EXISTS public.tenant_certificates CASCADE;
DROP TABLE IF EXISTS public.tenant_fiscal_profile CASCADE;

-- 2. TABLAS DE IDENTIDAD FISCAL (ESPAÑOL)
CREATE TABLE IF NOT EXISTS public.perfiles_fiscales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ruc text NOT NULL,
    dv integer NOT NULL,
    razon_social text NOT NULL,
    nombre_fantasia text,
    direccion text NOT NULL,
    telefono text,
    email_fiscal text,
    ambiente text DEFAULT 'test' CHECK (ambiente IN ('test', 'prod')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.certificados_digitales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    certificado_base64 text NOT NULL,
    password_cifrada text NOT NULL,
    vencimiento date NOT NULL,
    alias text,
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'revocado')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. CONFIGURACIÓN TÉCNICA SIFEN
CREATE TABLE IF NOT EXISTS public.configuracion_sifen (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    csc text NOT NULL, -- Código de Seguridad del Contribuyente
    id_csc integer NOT NULL, -- ID del CSC
    timbrado text NOT NULL,
    establecimiento text NOT NULL DEFAULT '001',
    punto_expedicion text NOT NULL DEFAULT '001',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, establecimiento, punto_expedicion)
);

-- 4. DOCUMENTOS ELECTRÓNICOS (VENTAS SIFEN)
CREATE TABLE IF NOT EXISTS public.documentos_electronicos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    cdc text UNIQUE, -- 44 dígitos
    tipo_documento text NOT NULL, -- 1: Factura, 2: NC, etc.
    numero_factura text NOT NULL,
    monto_total bigint NOT NULL, -- En Guaraníes
    receptor_ruc text,
    receptor_razon_social text NOT NULL,
    estado_sifen text DEFAULT 'pendiente' CHECK (estado_sifen IN ('pendiente', 'aprobado', 'rechazado', 'anulado')),
    id_lote text, -- Para seguimiento de certificación
    fecha_emision timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documentos_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    documento_id uuid REFERENCES public.documentos_electronicos(id) ON DELETE CASCADE NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric(12,4) NOT NULL,
    precio_unitario bigint NOT NULL,
    iva_tipo integer NOT NULL, -- 10, 5, 0
    monto_total_item bigint NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documentos_xml_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    documento_id uuid REFERENCES public.documentos_electronicos(id) ON DELETE CASCADE NOT NULL,
    xml_generado text,
    xml_firmado text,
    respuesta_sifen jsonb,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE public.perfiles_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados_digitales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sifen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_electronicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_xml_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS MULTI-TENANT (IDEMPOTENTES)
DROP POLICY IF EXISTS "Solo el dueño ve su perfil fiscal" ON public.perfiles_fiscales;
CREATE POLICY "Solo el dueño ve su perfil fiscal" ON public.perfiles_fiscales FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo el dueño ve sus certificados" ON public.certificados_digitales;
CREATE POLICY "Solo el dueño ve sus certificados" ON public.certificados_digitales FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Solo el dueño ve su config sifen" ON public.configuracion_sifen;
CREATE POLICY "Solo el dueño ve su config sifen" ON public.configuracion_sifen FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tenant ve sus facturas SIFEN" ON public.documentos_electronicos;
CREATE POLICY "Tenant ve sus facturas SIFEN" ON public.documentos_electronicos FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tenant ve sus items de factura" ON public.documentos_items;
CREATE POLICY "Tenant ve sus items de factura" ON public.documentos_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.documentos_electronicos WHERE id = documentos_items.documento_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Tenant ve sus logs XML" ON public.documentos_xml_logs;
CREATE POLICY "Tenant ve sus logs XML" ON public.documentos_xml_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.documentos_electronicos WHERE id = documentos_xml_logs.documento_id AND user_id = auth.uid())
);
