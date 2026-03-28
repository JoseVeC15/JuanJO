-- ============================================
-- ESQUEMA COMPLETO - SaaS Financiero Freelancer Audiovisual
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Tipos de servicio audiovisual
CREATE TYPE tipo_servicio AS ENUM (
    'filmacion',
    'edicion', 
    'produccion_completa',
    'fotografia',
    'motion_graphics',
    'drone',
    'live_streaming',
    'otro'
);

-- Estados de proyecto
CREATE TYPE estado_proyecto AS ENUM (
    'cotizacion',
    'en_progreso',
    'entregado',
    'facturado',
    'pagado',
    'cancelado'
);

-- Tipos de gasto
CREATE TYPE tipo_gasto AS ENUM (
    'equipamiento_compra',
    'alquiler_equipo',
    'transporte',
    'alimentacion',
    'software_licencias',
    'subcontratacion',
    'material_produccion',
    'marketing',
    'oficina',
    'capacitacion',
    'impuestos',
    'otros'
);

-- Métodos de pago
CREATE TYPE metodo_pago AS ENUM (
    'efectivo',
    'transferencia',
    'tarjeta_credito',
    'tarjeta_debito',
    'deposito'
);

-- Estados de factura/gasto
CREATE TYPE estado_gasto AS ENUM (
    'pendiente_clasificar',
    'registrada',
    'en_proceso_pago',
    'pagada'
);

-- Tipos de equipo
CREATE TYPE tipo_equipo AS ENUM (
    'camara',
    'lente',
    'iluminacion',
    'audio',
    'estabilizador',
    'drone',
    'accesorios',
    'computo',
    'otro'
);

-- Condición del equipo
CREATE TYPE condicion_equipo AS ENUM (
    'nuevo',
    'bueno',
    'regular',
    'reparacion'
);

-- Tipo de propiedad del equipo
CREATE TYPE tipo_propiedad AS ENUM (
    'PROPIO',
    'RENTADO'
);

-- Ubicación del equipo
CREATE TYPE ubicacion_equipo AS ENUM (
    'en_stock',
    'en_proyecto',
    'mantenimiento',
    'prestado',
    'vendido'
);

-- Estados de ingreso
CREATE TYPE estado_ingreso AS ENUM (
    'pendiente',
    'pagado',
    'parcial',
    'vencido',
    'cancelado'
);

-- Tipos de alerta
CREATE TYPE tipo_alerta AS ENUM (
    'renta_vence_manana',
    'renta_vence_hoy',
    'pago_pendiente_30dias',
    'proyecto_sin_facturar',
    'equipo_mantenimiento'
);

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- 1. profiles (Auth extendido)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    telefono TEXT,
    rfc TEXT, -- para facturación MX
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. proyectos
CREATE TABLE proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_cliente TEXT NOT NULL,
    tipo_servicio tipo_servicio NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_entrega DATE NOT NULL,
    monto_presupuestado DECIMAL(12,2) NOT NULL DEFAULT 0,
    monto_facturado DECIMAL(12,2) DEFAULT 0,
    estado estado_proyecto DEFAULT 'cotizacion',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_fechas CHECK (fecha_entrega >= fecha_inicio),
    CONSTRAINT check_montos CHECK (monto_presupuestado >= 0 AND monto_facturado >= 0)
);

-- Índices para proyectos
CREATE INDEX idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_fecha_entrega ON proyectos(fecha_entrega);

-- 3. facturas_gastos
CREATE TABLE facturas_gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
    imagen_url TEXT,
    monto DECIMAL(12,2),
    fecha_factura DATE,
    proveedor TEXT,
    ruc_proveedor TEXT,
    numero_factura TEXT,
    timbrado TEXT,
    iva_10 DECIMAL(12,2) DEFAULT 0,
    concepto_ocr TEXT,
    tipo_gasto tipo_gasto DEFAULT 'otros',
    es_deducible BOOLEAN DEFAULT true,
    metodo_pago metodo_pago,
    estado estado_gasto DEFAULT 'pendiente_clasificar',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by_n8n BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT check_monto_gasto CHECK (monto >= 0)
);

-- Índices para facturas_gastos
CREATE INDEX idx_facturas_gastos_user_id ON facturas_gastos(user_id);
CREATE INDEX idx_facturas_gastos_proyecto_id ON facturas_gastos(proyecto_id);
CREATE INDEX idx_facturas_gastos_estado ON facturas_gastos(estado);
CREATE INDEX idx_facturas_gastos_fecha ON facturas_gastos(fecha_factura);
CREATE INDEX idx_facturas_gastos_tipo_gasto ON facturas_gastos(tipo_gasto);

-- 4. inventario_equipo
CREATE TABLE inventario_equipo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo tipo_equipo NOT NULL,
    marca_modelo TEXT,
    numero_serie TEXT,
    condicion condicion_equipo DEFAULT 'bueno',
    fecha_compra DATE,
    costo_compra DECIMAL(12,2),
    vida_util_meses INTEGER DEFAULT 60, -- 5 años depreciación
    depreciacion_mensual DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN costo_compra IS NOT NULL AND vida_util_meses > 0 
            THEN costo_compra / vida_util_meses
            ELSE 0
        END
    ) STORED,
    tipo_propiedad tipo_propiedad NOT NULL DEFAULT 'PROPIO',
    
    -- Campos si es PROPIO
    valor_actual DECIMAL(12,2),
    ubicacion ubicacion_equipo DEFAULT 'en_stock',
    proyecto_actual_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
    fecha_disponibilidad DATE,
    
    -- Campos si es RENTADO
    proveedor_renta TEXT,
    costo_renta_dia DECIMAL(12,2),
    fecha_inicio_renta DATE,
    fecha_fin_renta DATE,
    contrato_url TEXT,
    alerta_enviada BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_costo_compra CHECK (costo_compra >= 0),
    CONSTRAINT check_costo_renta CHECK (costo_renta_dia >= 0),
    CONSTRAINT check_renta_fields CHECK (
        (tipo_propiedad = 'PROPIO') OR 
        (tipo_propiedad = 'RENTADO' AND proveedor_renta IS NOT NULL AND costo_renta_dia IS NOT NULL)
    )
);

-- Índices para inventario_equipo
CREATE INDEX idx_inventario_user_id ON inventario_equipo(user_id);
CREATE INDEX idx_inventario_tipo ON inventario_equipo(tipo);
CREATE INDEX idx_inventario_tipo_propiedad ON inventario_equipo(tipo_propiedad);
CREATE INDEX idx_inventario_ubicacion ON inventario_equipo(ubicacion);
CREATE INDEX idx_inventario_fecha_fin_renta ON inventario_equipo(fecha_fin_renta) WHERE tipo_propiedad = 'RENTADO';

-- 5. uso_equipo_proyecto (tabla pivote)
CREATE TABLE uso_equipo_proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipo_id UUID NOT NULL REFERENCES inventario_equipo(id) ON DELETE CASCADE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    fecha_inicio_uso DATE NOT NULL,
    fecha_fin_uso DATE,
    dias_uso INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN fecha_fin_uso IS NOT NULL 
            THEN fecha_fin_uso - fecha_inicio_uso + 1
            ELSE NULL
        END
    ) STORED,
    costo_imputado DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_fechas_uso CHECK (fecha_fin_uso >= fecha_inicio_uso)
);

-- Índices para uso_equipo_proyecto
CREATE INDEX idx_uso_equipo_id ON uso_equipo_proyecto(equipo_id);
CREATE INDEX idx_uso_proyecto_id ON uso_equipo_proyecto(proyecto_id);
CREATE INDEX idx_uso_fechas ON uso_equipo_proyecto(fecha_inicio_uso, fecha_fin_uso);

-- 6. ingresos
CREATE TABLE ingresos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    cliente TEXT NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_pago_real DATE,
    estado estado_ingreso DEFAULT 'pendiente',
    metodo_pago metodo_pago,
    dias_retraso INTEGER DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_monto_ingreso CHECK (monto > 0)
);

-- Índices para ingresos
CREATE INDEX idx_ingresos_user_id ON ingresos(user_id);
CREATE INDEX idx_ingresos_proyecto_id ON ingresos(proyecto_id);
CREATE INDEX idx_ingresos_estado ON ingresos(estado);
CREATE INDEX idx_ingresos_fecha_emision ON ingresos(fecha_emision);
CREATE INDEX idx_ingresos_fecha_pago_real ON ingresos(fecha_pago_real);

-- 7. alertas_programadas (para n8n)
CREATE TABLE alertas_programadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo_alerta tipo_alerta NOT NULL,
    referencia_id UUID NOT NULL, -- ID del registro relacionado
    fecha_ejecucion DATE NOT NULL,
    enviada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para alertas_programadas
CREATE INDEX idx_alertas_user_id ON alertas_programadas(user_id);
CREATE INDEX idx_alertas_tipo ON alertas_programadas(tipo_alerta);
CREATE INDEX idx_alertas_fecha_ejecucion ON alertas_programadas(fecha_ejecucion);
CREATE INDEX idx_alertas_enviada ON alertas_programadas(enviada);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para calcular valor actual de equipo propio
CREATE OR REPLACE FUNCTION calcular_valor_actual_equipo(
    costo_compra DECIMAL,
    fecha_compra DATE,
    vida_util_meses INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    meses_transcurridos INTEGER;
    depreciacion_acumulada DECIMAL;
BEGIN
    IF costo_compra IS NULL OR fecha_compra IS NULL THEN
        RETURN NULL;
    END IF;
    
    meses_transcurridos := EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_compra)) * 12 + 
                          EXTRACT(MONTH FROM AGE(CURRENT_DATE, fecha_compra));
    
    depreciacion_acumulada := (costo_compra / vida_util_meses) * meses_transcurridos;
    
    RETURN GREATEST(0, costo_compra - depreciacion_acumulada);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener resumen financiero de proyecto
CREATE OR REPLACE FUNCTION resumen_financiero_proyecto(
    p_proyecto_id UUID
) RETURNS TABLE(
    total_ingresos DECIMAL,
    total_gastos DECIMAL,
    margen_bruto DECIMAL,
    margen_porcentaje DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.monto), 0) as total_ingresos,
        COALESCE(SUM(f.monto), 0) as total_gastos,
        COALESCE(SUM(i.monto), 0) - COALESCE(SUM(f.monto), 0) as margen_bruto,
        CASE 
            WHEN COALESCE(SUM(i.monto), 0) > 0 
            THEN ((COALESCE(SUM(i.monto), 0) - COALESCE(SUM(f.monto), 0)) / COALESCE(SUM(i.monto), 0)) * 100
            ELSE 0
        END as margen_porcentaje
    FROM proyectos p
    LEFT JOIN ingresos i ON i.proyecto_id = p.id
    LEFT JOIN facturas_gastos f ON f.proyecto_id = p.id
    WHERE p.id = p_proyecto_id
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar monto_facturado en proyectos
CREATE OR REPLACE FUNCTION actualizar_monto_facturado_proyecto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE proyectos 
    SET monto_facturado = (
        SELECT COALESCE(SUM(monto), 0) 
        FROM facturas_gastos 
        WHERE proyecto_id = NEW.proyecto_id
    )
    WHERE id = NEW.proyecto_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_monto_facturado
AFTER INSERT OR UPDATE OR DELETE ON facturas_gastos
FOR EACH ROW
EXECUTE FUNCTION actualizar_monto_facturado_proyecto();

-- Trigger para actualizar estado de proyecto cuando se marca como pagado
CREATE OR REPLACE FUNCTION actualizar_estado_proyecto_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'pagado' THEN
        UPDATE proyectos 
        SET estado = 'pagado'
        WHERE id = NEW.proyecto_id 
        AND estado NOT IN ('cancelado');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estado_proyecto
AFTER UPDATE ON ingresos
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_proyecto_pago();

-- Trigger para calcular dias_retraso en ingresos
CREATE OR REPLACE FUNCTION calcular_dias_retraso_ingreso()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_pago_real IS NULL AND NEW.estado != 'pagado' THEN
        NEW.dias_retraso := CURRENT_DATE - NEW.fecha_emision;
    ELSIF NEW.fecha_pago_real IS NOT NULL AND NEW.estado = 'pagado' THEN
        NEW.dias_retraso := NEW.fecha_pago_real - NEW.fecha_emision;
    ELSE
        NEW.dias_retraso := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_dias_retraso
BEFORE INSERT OR UPDATE ON ingresos
FOR EACH ROW
EXECUTE FUNCTION calcular_dias_retraso_ingreso();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de resumen mensual
CREATE VIEW resumen_mensual AS
SELECT 
    DATE_TRUNC('month', CURRENT_DATE) as mes,
    u.id as user_id,
    u.email,
    COALESCE(SUM(i.monto), 0) as ingresos_totales,
    COALESCE(SUM(f.monto), 0) as gastos_totales,
    COALESCE(SUM(i.monto), 0) - COALESCE(SUM(f.monto), 0) as utilidad_neta
FROM auth.users u
LEFT JOIN ingresos i ON i.user_id = u.id 
    AND DATE_TRUNC('month', i.fecha_emision) = DATE_TRUNC('month', CURRENT_DATE)
    AND i.estado = 'pagado'
LEFT JOIN facturas_gastos f ON f.user_id = u.id 
    AND DATE_TRUNC('month', f.fecha_factura) = DATE_TRUNC('month', CURRENT_DATE)
    AND f.estado = 'pagada'
GROUP BY u.id, u.email;

-- Vista de equipos por vencer (rentados)
CREATE VIEW equipos_renta_por_vencer AS
SELECT 
    e.*,
    pr.nombre_cliente,
    p.nombre_completo as usuario_nombre,
    CASE 
        WHEN e.fecha_fin_renta = CURRENT_DATE THEN 'vence_hoy'
        WHEN e.fecha_fin_renta = CURRENT_DATE + INTERVAL '1 day' THEN 'vence_manana'
        WHEN e.fecha_fin_renta < CURRENT_DATE THEN 'vencido'
        ELSE 'ok'
    END as estado_renta
FROM inventario_equipo e
LEFT JOIN proyectos pr ON e.proyecto_actual_id = pr.id
LEFT JOIN profiles p ON pr.user_id = p.id
WHERE e.tipo_propiedad = 'RENTADO' 
AND e.fecha_fin_renta IS NOT NULL
AND e.fecha_fin_renta <= CURRENT_DATE + INTERVAL '2 days'
AND e.ubicacion != 'en_stock';

-- Vista de proyectos pendientes de facturar
CREATE VIEW proyectos_pendientes_facturar AS
SELECT 
    p.*,
    pr.nombre_completo as usuario_nombre
FROM proyectos p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.estado = 'entregado'
AND NOT EXISTS (
    SELECT 1 FROM ingresos i 
    WHERE i.proyecto_id = p.id 
    AND i.estado != 'cancelado'
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE uso_equipo_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_programadas ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can only access their own profile" ON profiles
FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own projects" ON proyectos
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own invoices" ON facturas_gastos
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own equipment" ON inventario_equipo
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own equipment usage" ON uso_equipo_proyecto
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM inventario_equipo 
        WHERE id = equipo_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can only access their own income" ON ingresos
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own alerts" ON alertas_programadas
FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- CONFIGURACIÓN DE STORAGE
-- ============================================

-- Bucket para facturas (privado)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('facturas', 'facturas', false);

-- Política para bucket de facturas
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

-- ============================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Insertar profile automático cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nombre_completo)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentarios para documentación
COMMENT ON TABLE profiles IS 'Perfiles extendidos de usuarios del sistema';
COMMENT ON TABLE proyectos IS 'Proyectos audiovisuales de los freelancers';
COMMENT ON TABLE facturas_gastos IS 'Facturas y gastos con OCR automático';
COMMENT ON TABLE inventario_equipo IS 'Inventario de equipo audiovisual (propio y rentado)';
COMMENT ON TABLE uso_equipo_proyecto IS 'Relación entre equipo y proyectos';
COMMENT ON TABLE ingresos IS 'Ingresos y pagos de proyectos';
COMMENT ON TABLE alertas_programadas IS 'Alertas programadas para n8n';