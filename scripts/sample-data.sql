-- ============================================
-- DATOS DE EJEMPLO - SaaS Financiero Freelancer Audiovisual
-- ============================================

-- ⚠️ IMPORTANTE: Este script necesita un usuario que exista en auth.users.
-- 
-- PASOS PARA EJECUTAR:
-- 1. Ve a Supabase Dashboard > Authentication > Users
-- 2. Si no tienes usuarios, haz clic en "Invite User" y crea uno
-- 3. Copia el UUID del usuario (columna "User UID")
-- 4. Reemplaza el UUID abajo en v_user_id
--
-- O ejecuta esta query para ver tus usuarios:
-- SELECT id, email FROM auth.users;

-- PASO 2: Reemplaza con el UUID de tu usuario
DO $$
DECLARE
    -- ⚠️ REEMPLAZA con el UUID real de tu usuario de Supabase Auth
    -- Para ver tus usuarios ejecuta: SELECT id, email FROM auth.users;
    v_user_id UUID := 'af341d31-c861-4242-950c-7f21be0b13b7';
    
    -- IDs para proyectos (puedes dejar estos)
    v_proj1_id UUID := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01';
    v_proj2_id UUID := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02';
    v_proj3_id UUID := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03';
    v_proj4_id UUID := 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04';
BEGIN
    -- Insertar perfil de usuario (solo si el usuario existe en auth.users)
    -- Si el usuario no existe en auth.users, esta línea fallará
    INSERT INTO profiles (id, nombre_completo, telefono, rfc)
    VALUES (v_user_id, 'Juan Pérez García', '+52 55 1234 5678', 'PEGJ850215ABC')
    ON CONFLICT (id) DO UPDATE SET
        nombre_completo = EXCLUDED.nombre_completo,
        telefono = EXCLUDED.telefono,
        rfc = EXCLUDED.rfc;

    -- Insertar proyectos de ejemplo
    INSERT INTO proyectos (
        id, user_id, nombre_cliente, tipo_servicio, descripcion,
        fecha_inicio, fecha_entrega, monto_presupuestado, estado
    ) VALUES 
    -- Proyecto 1: Comercial de televisión
    (
        v_proj1_id,
        v_user_id,
        'Café Luna MX',
        'produccion_completa',
        'Comercial de 30 segundos para campaña de verano. Incluye filmación, edición, motion graphics y masterización.',
        '2026-03-15',
        '2026-03-30',
        85000.00,
        'en_progreso'
    ),
    -- Proyecto 2: Sesión de fotos de producto
    (
        v_proj2_id,
        v_user_id,
        'Moda Urbana SA',
        'fotografia',
        'Sesión de fotos para catálogo de primavera-verano. 50 productos, fondo blanco y lifestyle.',
        '2026-03-10',
        '2026-03-20',
        25000.00,
        'entregado'
    ),
    -- Proyecto 3: Evento en vivo
    (
        v_proj3_id,
        v_user_id,
        'TechConf 2026',
        'live_streaming',
        'Streaming en vivo de conferencia de tecnología. 3 cámaras, audio profesional, gráficos en tiempo real.',
        '2026-04-01',
        '2026-04-03',
        45000.00,
        'cotizacion'
    ),
    -- Proyecto 4: Video institucional
    (
        v_proj4_id,
        v_user_id,
        'Hospital San José',
        'edicion',
        'Edición de video institucional. Material entregado por el cliente. Incluye motion graphics y color grading.',
        '2026-02-15',
        '2026-02-28',
        18000.00,
        'pagado'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insertar facturas/gastos de ejemplo
    INSERT INTO facturas_gastos (
        id, user_id, proyecto_id, imagen_url, monto, fecha_factura,
        proveedor, concepto_ocr, tipo_gasto, es_deducible, metodo_pago, estado
    ) VALUES
    -- Gastos del proyecto Café Luna MX
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        v_user_id,
        v_proj1_id,
        v_user_id::text || '/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01/receipt-001.jpg',
        1250.00,
        '2026-03-15',
        'Café Azteca',
        'Café Azteca\nRFC: CAZA850215XX\nTotal: $1,250.00\nFecha: 15/03/2026\nServicio de catering día 1 de filmación',
        'alimentacion',
        true,
        'tarjeta_credito',
        'pagada'
    ),
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        v_user_id,
        v_proj1_id,
        v_user_id::text || '/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02/receipt-002.jpg',
        3500.00,
        '2026-03-16',
        'Uber México',
        'Uber México\nServicio de transporte\nTotal: $3,500.00\n16/03/2026\nTransporte equipo y personal',
        'transporte',
        true,
        'tarjeta_debito',
        'pagada'
    ),
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        v_user_id,
        v_proj1_id,
        v_user_id::text || '/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03/receipt-003.jpg',
        8500.00,
        '2026-03-17',
        'Rentadora Cine',
        'Rentadora Cine SA de CV\nRFC: RICA900101XX\nAlquiler equipo audiovisual\nTotal: $8,500.00',
        'alquiler_equipo',
        true,
        'transferencia',
        'pagada'
    ),
    -- Gastos del proyecto Moda Urbana
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
        v_user_id,
        v_proj2_id,
        v_user_id::text || '/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04/receipt-004.jpg',
        2200.00,
        '2026-03-12',
        'Paper Studio',
        'Papelería y materiales\nFondos para fotografía\nTotal: $2,200.00',
        'material_produccion',
        true,
        'efectivo',
        'pagada'
    ),
    -- Gastos sin proyecto
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
        v_user_id,
        NULL,
        v_user_id::text || '/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a05/receipt-005.jpg',
        1500.00,
        '2026-03-20',
        'Adobe México',
        'Adobe Creative Cloud\nSuscripción mensual\nTotal: $1,500.00',
        'software_licencias',
        true,
        'tarjeta_credito',
        'pagada'
    ),
    (
        'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
        v_user_id,
        NULL,
        v_user_id::text || '/c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a06/receipt-006.jpg',
        350.00,
        '2026-03-21',
        'Starbucks',
        'Starbucks Café\nGastos de oficina\nTotal: $350.00',
        'oficina',
        true,
        'tarjeta_debito',
        'pagada'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insertar inventario de equipo
    INSERT INTO inventario_equipo (
        id, user_id, nombre, tipo, marca_modelo, numero_serie,
        condicion, fecha_compra, costo_compra, vida_util_meses,
        tipo_propiedad, valor_actual, ubicacion
    ) VALUES
    -- Equipos propios
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        v_user_id,
        'Canon EOS R5',
        'camara',
        'Canon EOS R5 Body',
        'CER5-123456',
        'bueno',
        '2024-06-15',
        89999.00,
        60,
        'PROPIO',
        76499.15,
        'en_proyecto'
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        v_user_id,
        'Lente 24-70mm f/2.8',
        'lente',
        'Canon RF 24-70mm f/2.8L',
        'CRL2470-789012',
        'nuevo',
        '2024-08-20',
        52999.00,
        60,
        'PROPIO',
        46699.12,
        'en_stock'
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        v_user_id,
        'Aputure 300D II',
        'iluminacion',
        'Aputure Light Storm 300D II',
        'APL300-345678',
        'bueno',
        '2025-01-10',
        15999.00,
        60,
        'PROPIO',
        14799.11,
        'en_stock'
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
        v_user_id,
        'Rode NTG5',
        'audio',
        'Rode NTG5 Shotgun',
        'RNTG5-901234',
        'bueno',
        '2025-03-05',
        8499.00,
        60,
        'PROPIO',
        8073.95,
        'en_proyecto'
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
        v_user_id,
        'DJI Mini 4 Pro',
        'drone',
        'DJI Mini 4 Pro Fly More',
        'DJIM4P-567890',
        'nuevo',
        '2025-06-01',
        24999.00,
        36,
        'PROPIO',
        21873.61,
        'en_stock'
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
        v_user_id,
        'MacBook Pro M3 Max',
        'computo',
        'MacBook Pro 16" M3 Max',
        'MBPM3-234567',
        'bueno',
        '2024-09-15',
        79999.00,
        48,
        'PROPIO',
        69999.13,
        'en_stock'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insertar equipos rentados
    INSERT INTO inventario_equipo (
        id, user_id, nombre, tipo, marca_modelo,
        condicion, tipo_propiedad,
        proveedor_renta, costo_renta_dia,
        fecha_inicio_renta, fecha_fin_renta,
        alerta_enviada, ubicacion, proyecto_actual_id
    ) VALUES
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        v_user_id,
        'Sony FX6',
        'camara',
        'Sony FX6 Full Frame',
        'bueno',
        'RENTADO',
        'CineRent MX',
        1800.00,
        '2026-03-15',
        '2026-03-25',
        false,
        'en_proyecto',
        v_proj1_id
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        v_user_id,
        'Ronin 4D',
        'estabilizador',
        'DJI Ronin 4D 8K',
        'bueno',
        'RENTADO',
        'DroneRent Pro',
        2500.00,
        '2026-03-20',
        '2026-03-30',
        false,
        'en_proyecto',
        v_proj1_id
    ),
    (
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        v_user_id,
        'Arri SkyPanel S60',
        'iluminacion',
        'Arri SkyPanel S60-C',
        'bueno',
        'RENTADO',
        'Luz Cine SA',
        1200.00,
        '2026-03-22',
        '2026-03-28',
        false,
        'en_stock',
        NULL
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insertar uso de equipo en proyectos
    INSERT INTO uso_equipo_proyecto (
        id, equipo_id, proyecto_id, fecha_inicio_uso, fecha_fin_uso, costo_imputado
    ) VALUES
    -- Canon R5 en Café Luna MX (equipo_id = e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01)
    (
        'aaaaaaaa-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        v_proj1_id,
        '2026-03-15',
        '2026-03-25',
        3055.60
    ),
    -- Rode NTG5 en Café Luna MX (equipo_id = e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04)
    (
        'bbbbbbbb-cccc-cccc-cccc-cccccccccccc',
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
        v_proj1_id,
        '2026-03-15',
        '2026-03-25',
        1497.75
    ),
    -- Sony FX6 (rentado) en Café Luna MX (equipo_id = e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11)
    (
        'cccccccc-dddd-dddd-dddd-dddddddddddd',
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        v_proj1_id,
        '2026-03-15',
        '2026-03-25',
        19800.00
    ),
    -- Ronin 4D (rentado) en Café Luna MX (equipo_id = e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12)
    (
        'dddddddd-eeee-eeee-eeee-eeeeeeeeeeee',
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        v_proj1_id,
        '2026-03-20',
        '2026-03-25',
        12500.00
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insertar ingresos
    INSERT INTO ingresos (
        id, user_id, proyecto_id, cliente, monto, fecha_emision,
        fecha_pago_real, estado, metodo_pago, notas
    ) VALUES
    -- Café Luna MX - Anticipo
    (
        'aaaaaaaa-cccc-cccc-cccc-cccccccccccc',
        v_user_id,
        v_proj1_id,
        'Café Luna MX',
        42500.00,
        '2026-03-10',
        '2026-03-12',
        'pagado',
        'transferencia',
        'Anticipo 50% del proyecto'
    ),
    -- Moda Urbana SA - Pago completo
    (
        'bbbbbbbb-dddd-dddd-dddd-dddddddddddd',
        v_user_id,
        v_proj2_id,
        'Moda Urbana SA',
        25000.00,
        '2026-03-05',
        '2026-03-15',
        'pagado',
        'transferencia',
        'Pago completo - Sesión de fotos'
    ),
    -- Hospital San José - Pago completo
    (
        'cccccccc-eeee-eeee-eeee-eeeeeeeeeeee',
        v_user_id,
        v_proj4_id,
        'Hospital San José',
        18000.00,
        '2026-02-20',
        '2026-03-01',
        'pagado',
        'transferencia',
        'Video institucional - Edición'
    ),
    -- Café Luna MX - Pendiente
    (
        'dddddddd-ffff-ffff-ffff-ffffffffffff',
        v_user_id,
        v_proj1_id,
        'Café Luna MX',
        42500.00,
        '2026-03-28',
        NULL,
        'pendiente',
        NULL,
        'Resto 50% - Factura emitida'
    ),
    -- TechConf 2026 - Pendiente (cotización)
    (
        'eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        v_user_id,
        v_proj3_id,
        'TechConf 2026',
        22500.00,
        '2026-03-20',
        NULL,
        'pendiente',
        NULL,
        'Anticipo 50% - Por confirmar'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insertar alertas programadas de ejemplo
    INSERT INTO alertas_programadas (
        id, user_id, tipo_alerta, referencia_id, fecha_ejecucion, enviada
    ) VALUES
    -- Alerta de equipo rentado venciendo (referencia a Arri SkyPanel S60)
    (
        'ffffffff-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        v_user_id,
        'renta_vence_manana',
        'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        '2026-03-27',
        false
    ),
    -- Alerta de pago pendiente (referencia a ingreso Café Luna MX)
    (
        'aaaaaaaa-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        v_user_id,
        'pago_pendiente_30dias',
        'dddddddd-ffff-ffff-ffff-ffffffffffff',
        '2026-04-01',
        false
    )
    ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================

-- Ver resumen financiero del mes actual
SELECT 
    'Ingresos' as concepto,
    COALESCE(SUM(monto), 0) as total
FROM ingresos 
WHERE fecha_emision >= DATE_TRUNC('month', CURRENT_DATE)
    AND estado = 'pagado'
UNION ALL
SELECT 
    'Gastos' as concepto,
    COALESCE(SUM(monto), 0) as total
FROM facturas_gastos 
WHERE fecha_factura >= DATE_TRUNC('month', CURRENT_DATE)
    AND estado = 'pagada';

-- Ver proyectos con su margen
SELECT 
    p.nombre_cliente,
    p.tipo_servicio,
    p.monto_presupuestado,
    COALESCE(SUM(i.monto), 0) as ingresos,
    COALESCE(SUM(f.monto), 0) as gastos,
    COALESCE(SUM(i.monto), 0) - COALESCE(SUM(f.monto), 0) as margen,
    ROUND(
        ((COALESCE(SUM(i.monto), 0) - COALESCE(SUM(f.monto), 0)) / 
         NULLIF(COALESCE(SUM(i.monto), 0), 0)) * 100, 2
    ) as margen_porcentaje
FROM proyectos p
LEFT JOIN ingresos i ON i.proyecto_id = p.id AND i.estado = 'pagado'
LEFT JOIN facturas_gastos f ON f.proyecto_id = p.id AND f.estado = 'pagada'
GROUP BY p.id, p.nombre_cliente, p.tipo_servicio, p.monto_presupuestado
ORDER BY margen DESC;

-- Ver estado del inventario
SELECT 
    nombre,
    tipo,
    tipo_propiedad,
    CASE 
        WHEN tipo_propiedad = 'PROPIO' THEN valor_actual
        ELSE NULL
    END as valor_actual,
    CASE 
        WHEN tipo_propiedad = 'RENTADO' THEN fecha_fin_renta
        ELSE NULL
    END as fecha_devolucion,
    ubicacion
FROM inventario_equipo
ORDER BY tipo_propiedad, tipo;

-- Equipos próximos a vencer (rentados)
SELECT 
    nombre,
    proveedor_renta,
    fecha_fin_renta,
    costo_renta_dia,
    CASE 
        WHEN fecha_fin_renta = CURRENT_DATE THEN '🔴 VENCE HOY'
        WHEN fecha_fin_renta = CURRENT_DATE + 1 THEN '🟠 VENCE MAÑANA'
        WHEN fecha_fin_renta <= CURRENT_DATE + 7 THEN '🟡 PRÓXIMAMENTE'
        ELSE '🟢 OK'
    END as estado
FROM inventario_equipo
WHERE tipo_propiedad = 'RENTADO' 
    AND fecha_fin_renta IS NOT NULL
    AND fecha_fin_renta >= CURRENT_DATE
ORDER BY fecha_fin_renta;