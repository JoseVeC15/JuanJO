-- ============================================
-- MODULO DE FACTURACIÓN ELECTRÓNICA SIFEN
-- ============================================

-- 1. Perfil Fiscal del Tenant
CREATE TABLE IF NOT EXISTS public.tenant_fiscal_profile (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ruc text NOT NULL,
    dv integer NOT NULL,
    razon_social text NOT NULL,
    nombre_fantasia text,
    direccion text NOT NULL,
    telefono text,
    email_fiscal text,
    actividades_economicas jsonb DEFAULT '[]',
    ambiente text DEFAULT 'test' CHECK (ambiente IN ('test', 'prod')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Bóveda de Certificados Digitales (P12)
CREATE TABLE IF NOT EXISTS public.tenant_certificates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    certificate_base64 text NOT NULL, -- Almacenado como string base64 / Considerar Supabase Vault en prod
    password_encrypted text NOT NULL, 
    vencimiento date NOT NULL,
    alias text,
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'revocado')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Configuración Técnica SIFEN (CSC, Timbrado)
CREATE TABLE IF NOT EXISTS public.tenant_sifen_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    csc text NOT NULL, -- Código de Seguridad del Contribuyente (SIFEN)
    id_csc integer NOT NULL, -- ID del CSC
    timbrado text NOT NULL,
    establecimiento text NOT NULL DEFAULT '001',
    punto_expedicion text NOT NULL DEFAULT '001',
    tipos_documentos_habilitados text[] DEFAULT '{factura, nota_credito, nota_debito}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, establecimiento, punto_expedicion)
);

-- 4. Cabecera de Documentos Electrónicos (DE/DTE)
CREATE TABLE IF NOT EXISTS public.electronic_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo_documento text NOT NULL, -- 1: Factura, 2: Nota de Crédito, etc.
    numero_factura text NOT NULL, -- Formato XXX-XXX-XXXXXXX
    cdc text UNIQUE, -- Código de Control del Documento
    estado_sifen text DEFAULT 'pendiente' CHECK (estado_sifen IN ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'no_enviado')),
    monto_total bigint NOT NULL, -- Monto en Guaraníes (enteros)
    receptor_ruc text,
    receptor_razon_social text,
    fecha_emision timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- 5. Ítems de Documentos Electrónicos
CREATE TABLE IF NOT EXISTS public.electronic_document_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.electronic_documents(id) ON DELETE CASCADE NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric(12,4) NOT NULL,
    precio_unitario bigint NOT NULL,
    iva_tipo integer NOT NULL, -- 10, 5, 0 (Exenta)
    monto_total_item bigint NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. Almacenamiento de XML y Respuestas
CREATE TABLE IF NOT EXISTS public.electronic_document_xml (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.electronic_documents(id) ON DELETE CASCADE NOT NULL,
    xml_generado text,
    xml_firmado text,
    respuesta_sifen jsonb,
    kude_url text,
    qr_data text,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- POLÍTICAS DE RLS (AISLAMIENTO TOTAL POR TENANT)
-- ============================================

ALTER TABLE public.tenant_fiscal_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_sifen_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_document_xml ENABLE ROW LEVEL SECURITY;

-- Políticas de Usuarios Autenticados
CREATE POLICY "Tenants can only see their own fiscal profile" ON public.tenant_fiscal_profile
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tenants can only see their own certificates" ON public.tenant_certificates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tenants can only see their own sifen config" ON public.tenant_sifen_config
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tenants can only see their own electronic documents" ON public.electronic_documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tenants can only see their own document items" ON public.electronic_document_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.electronic_documents WHERE id = electronic_document_items.document_id AND user_id = auth.uid()
    ));

CREATE POLICY "Tenants can only see their own document XMLs" ON public.electronic_document_xml
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.electronic_documents WHERE id = electronic_document_xml.document_id AND user_id = auth.uid()
    ));
