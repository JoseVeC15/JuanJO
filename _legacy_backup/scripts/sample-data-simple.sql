-- ============================================
-- DATOS DE EJEMPLO SIMPLIFICADO (sin profiles)
-- ============================================
-- Usa este script si ya tienes un usuario en auth.users
-- pero no quieres insertar en la tabla profiles

-- ⚠️ IMPORTANTE: Reemplaza el UUID con tu usuario real de Supabase Auth
-- Ejecuta: SELECT id, email FROM auth.users; para ver tus usuarios

DO $$
DECLARE
    -- ⚠️ REEMPLAZA con el UUID real de tu usuario de Supabase Auth
    v_user_id UUID := 'af341d31-c861-4242-950c-7f21be0b13b7';
    
    -- UUIDs válidos para proyectos (solo hex: 0-9, a-f)
    v_proj1_id UUID := '11111111-1111-1111-1111-111111111111';
    v_proj2_id UUID := '22222222-2222-2222-2222-222222222222';
    v_proj3_id UUID := '33333333-3333-3333-3333-333333333333';
    v_proj4_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- NO insertamos en profiles (usa el trigger automático o créalo manualmente)

    -- Insertar proyectos
    INSERT INTO proyectos (id, user_id, nombre_cliente, tipo_servicio, descripcion, fecha_inicio, fecha_entrega, monto_presupuestado, estado)
    VALUES 
    (v_proj1_id, v_user_id, 'Café Luna MX', 'produccion_completa', 'Comercial de 30 segundos', '2026-03-15', '2026-03-30', 85000.00, 'en_progreso'),
    (v_proj2_id, v_user_id, 'Moda Urbana SA', 'fotografia', 'Sesión de fotos catálogo', '2026-03-10', '2026-03-20', 25000.00, 'entregado'),
    (v_proj3_id, v_user_id, 'TechConf 2026', 'live_streaming', 'Streaming conferencia', '2026-04-01', '2026-04-03', 45000.00, 'cotizacion'),
    (v_proj4_id, v_user_id, 'Hospital San José', 'edicion', 'Video institucional', '2026-02-15', '2026-02-28', 18000.00, 'pagado')
    ON CONFLICT (id) DO NOTHING;

    -- Insertar gastos
    INSERT INTO facturas_gastos (id, user_id, proyecto_id, monto, fecha_factura, proveedor, tipo_gasto, estado)
    VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_user_id, v_proj1_id, 1250.00, '2026-03-15', 'Café Azteca', 'alimentacion', 'pagada'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_user_id, v_proj1_id, 3500.00, '2026-03-16', 'Uber México', 'transporte', 'pagada'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', v_user_id, v_proj1_id, 8500.00, '2026-03-17', 'Rentadora Cine', 'alquiler_equipo', 'pagada'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', v_user_id, v_proj2_id, 2200.00, '2026-03-12', 'Paper Studio', 'material_produccion', 'pagada'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', v_user_id, NULL, 1500.00, '2026-03-20', 'Adobe México', 'software_licencias', 'pagada')
    ON CONFLICT (id) DO NOTHING;

    -- Insertar equipos propios
    INSERT INTO inventario_equipo (id, user_id, nombre, tipo, marca_modelo, condicion, fecha_compra, costo_compra, vida_util_meses, tipo_propiedad, valor_actual, ubicacion)
    VALUES 
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_user_id, 'Canon EOS R5', 'camara', 'Canon EOS R5 Body', 'bueno', '2024-06-15', 89999.00, 60, 'PROPIO', 76499.15, 'en_proyecto'),
    ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_user_id, 'Lente 24-70mm', 'lente', 'Canon RF 24-70mm f/2.8L', 'nuevo', '2024-08-20', 52999.00, 60, 'PROPIO', 46699.12, 'en_stock'),
    ('33333333-cccc-cccc-cccc-cccccccccccc', v_user_id, 'Aputure 300D II', 'iluminacion', 'Aputure Light Storm', 'bueno', '2025-01-10', 15999.00, 60, 'PROPIO', 14799.11, 'en_stock')
    ON CONFLICT (id) DO NOTHING;

    -- Insertar equipos rentados
    INSERT INTO inventario_equipo (id, user_id, nombre, tipo, marca_modelo, condicion, tipo_propiedad, proveedor_renta, costo_renta_dia, fecha_inicio_renta, fecha_fin_renta, ubicacion, proyecto_actual_id)
    VALUES 
    ('44444444-dddd-dddd-dddd-dddddddddddd', v_user_id, 'Sony FX6', 'camara', 'Sony FX6', 'bueno', 'RENTADO', 'CineRent MX', 1800.00, '2026-03-15', '2026-03-25', 'en_proyecto', v_proj1_id),
    ('55555555-eeee-eeee-eeee-eeeeeeeeeeee', v_user_id, 'Ronin 4D', 'estabilizador', 'DJI Ronin 4D', 'bueno', 'RENTADO', 'DroneRent Pro', 2500.00, '2026-03-20', '2026-03-30', 'en_proyecto', v_proj1_id)
    ON CONFLICT (id) DO NOTHING;

    -- Insertar ingresos
    INSERT INTO ingresos (id, user_id, proyecto_id, cliente, monto, fecha_emision, fecha_pago_real, estado, metodo_pago)
    VALUES 
    ('aaaaaaaa-1111-1111-1111-111111111111', v_user_id, v_proj1_id, 'Café Luna MX', 42500.00, '2026-03-10', '2026-03-12', 'pagado', 'transferencia'),
    ('bbbbbbbb-2222-2222-2222-222222222222', v_user_id, v_proj2_id, 'Moda Urbana SA', 25000.00, '2026-03-05', '2026-03-15', 'pagado', 'transferencia'),
    ('cccccccc-3333-3333-3333-333333333333', v_user_id, v_proj4_id, 'Hospital San José', 18000.00, '2026-02-20', '2026-03-01', 'pagado', 'transferencia'),
    ('dddddddd-4444-4444-4444-444444444444', v_user_id, v_proj1_id, 'Café Luna MX', 42500.00, '2026-03-28', NULL, 'pendiente', NULL),
    ('eeeeeeee-5555-5555-5555-555555555555', v_user_id, v_proj3_id, 'TechConf 2026', 22500.00, '2026-03-20', NULL, 'pendiente', NULL)
    ON CONFLICT (id) DO NOTHING;

END $$;

-- Consultas de verificación
SELECT 'Proyectos' as tabla, COUNT(*) as total FROM proyectos WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
UNION ALL
SELECT 'Gastos', COUNT(*) FROM facturas_gastos WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
UNION ALL
SELECT 'Equipos', COUNT(*) FROM inventario_equipo WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
UNION ALL
SELECT 'Ingresos', COUNT(*) FROM ingresos WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Ver datos insertados
SELECT nombre_cliente, tipo_servicio, monto_presupuestado, estado FROM proyectos WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';