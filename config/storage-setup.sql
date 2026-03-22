-- ============================================
-- CONFIGURACIÓN DE STORAGE - Supabase
-- ============================================

-- Habilitar extensión de storage si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- BUCKET: facturas (privado)
-- ============================================

-- Crear bucket para facturas (privado por defecto)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'facturas',
    'facturas',
    false,
    10485760, -- 10MB límite
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- ============================================
-- BUCKET: equipos (privado)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'equipos',
    'equipos',
    false,
    5242880, -- 5MB límite
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================
-- BUCKET: contratos (privado)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contratos',
    'contratos',
    false,
    20971520, -- 20MB límite
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];

-- ============================================
-- POLÍTICAS DE SEGURIDAD PARA STORAGE
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can upload their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON storage.objects;

-- Políticas para bucket 'facturas'
CREATE POLICY "Users can upload their own invoices" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'facturas' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own invoices" ON storage.objects
FOR SELECT USING (
    bucket_id = 'facturas' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own invoices" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'facturas' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own invoices" ON storage.objects
FOR DELETE USING (
    bucket_id = 'facturas' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para bucket 'equipos'
DROP POLICY IF EXISTS "Users can upload their own equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own equipment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own equipment images" ON storage.objects;

CREATE POLICY "Users can upload their own equipment images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'equipos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own equipment images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'equipos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own equipment images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'equipos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own equipment images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'equipos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para bucket 'contratos'
DROP POLICY IF EXISTS "Users can upload their own contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own contracts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON storage.objects;

CREATE POLICY "Users can upload their own contracts" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'contratos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own contracts" ON storage.objects
FOR SELECT USING (
    bucket_id = 'contratos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own contracts" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'contratos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own contracts" ON storage.objects
FOR DELETE USING (
    bucket_id = 'contratos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- FUNCIONES AUXILIARES PARA STORAGE
-- ============================================

-- Función para generar URL firmada de factura (válida por 1 hora)
CREATE OR REPLACE FUNCTION get_signed_invoice_url(
    invoice_path TEXT,
    expires_in_seconds INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
    signed_url TEXT;
BEGIN
    -- Esta función debe ser implementada con la API de Supabase Storage
    -- o usando el cliente de storage en tu aplicación
    -- Por ahora retornamos el path, la URL firmada se generará desde el cliente
    RETURN invoice_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de storage de un usuario
CREATE OR REPLACE FUNCTION get_user_storage_stats(user_uuid UUID)
RETURNS TABLE(
    bucket_name TEXT,
    file_count BIGINT,
    total_size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.bucket_id::TEXT,
        COUNT(*) as file_count,
        COALESCE(SUM(o.metadata->>'size')::BIGINT, 0) as total_size
    FROM storage.objects o
    WHERE o.owner = user_uuid
    GROUP BY o.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS PARA STORAGE
-- ============================================

-- Trigger para actualizar updated_at en objetos de storage
-- (Supabase no tiene updated_at nativo, pero podemos crear una tabla de metadatos)

CREATE TABLE IF NOT EXISTS storage_metadata (
    object_id UUID PRIMARY KEY REFERENCES storage.objects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id),
    upload_ip INET,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para registrar metadatos al subir archivo
CREATE OR REPLACE FUNCTION register_storage_metadata()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO storage_metadata (object_id, uploaded_by)
    VALUES (NEW.id, auth.uid())
    ON CONFLICT (object_id) DO UPDATE SET
        last_accessed = NOW(),
        access_count = storage_metadata.access_count + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar metadatos
CREATE TRIGGER trigger_register_storage_metadata
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION register_storage_metadata();

-- ============================================
-- VISTAS PARA STORAGE
-- ============================================

-- Vista para archivos recientes del usuario
CREATE VIEW user_recent_files AS
SELECT 
    o.id,
    o.name,
    o.bucket_id,
    o.metadata->>'size' as file_size,
    o.metadata->>'mimetype' as mime_type,
    o.created_at,
    sm.last_accessed,
    sm.access_count
FROM storage.objects o
LEFT JOIN storage_metadata sm ON o.id = sm.object_id
WHERE o.owner = auth.uid()
ORDER BY o.created_at DESC;

-- Vista para estadísticas de storage por usuario
CREATE VIEW user_storage_summary AS
SELECT 
    auth.uid() as user_id,
    bucket_id,
    COUNT(*) as file_count,
    SUM((metadata->>'size')::BIGINT) as total_bytes,
    pg_size_pretty(SUM((metadata->>'size')::BIGINT)) as total_size,
    MIN(created_at) as first_upload,
    MAX(created_at) as last_upload
FROM storage.objects
WHERE owner = auth.uid()
GROUP BY auth.uid(), bucket_id;

-- ============================================
-- LIMPIEZA DE ARCHIVOS ANTIGUOS
-- ============================================

-- Función para limpiar archivos de facturas sin referencia en la base de datos
-- Ejecutar periódicamente para mantener limpio el storage
CREATE OR REPLACE FUNCTION cleanup_orphaned_invoices()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Eliminar archivos de facturas que no tienen referencia en facturas_gastos
    WITH orphaned_files AS (
        SELECT o.id
        FROM storage.objects o
        LEFT JOIN facturas_gastos fg ON o.name = fg.imagen_url
        WHERE o.bucket_id = 'facturas'
            AND fg.id IS NULL
            AND o.created_at < NOW() - INTERVAL '7 days'
        LIMIT 100 -- Procesar en lotes
    )
    DELETE FROM storage.objects
    WHERE id IN (SELECT id FROM orphaned_files);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CONFIGURACIÓN DE CORS (si es necesario)
-- ============================================

-- Nota: La configuración de CORS se hace desde el dashboard de Supabase
-- o usando la CLI de Supabase. Estos son los headers recomendados:
-- 
-- Access-Control-Allow-Origin: https://your-app.com
-- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
-- Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
-- Access-Control-Max-Age: 86400

-- ============================================
-- INFORMACIÓN DE CONFIGURACIÓN
-- ============================================
-- Nota: Los buckets se crean desde el dashboard de Supabase
-- o usando la API de storage. La configuración de comentarios
-- se hace desde la interfaz de Supabase.

COMMENT ON TABLE storage_metadata IS 'Metadatos adicionales para objetos de storage, útil para auditoría y estadísticas';