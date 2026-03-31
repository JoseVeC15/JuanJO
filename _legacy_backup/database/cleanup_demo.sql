-- ============================================
-- SCRIPT DE LIMPIEZA DE DATOS (RESET)
-- ============================================
-- ADVERTENCIA: Este script borrará todos los datos de las tablas principales.
-- Úsalo para limpiar los datos de prueba y empezar de cero.

BEGIN;

-- Desactivar triggers temporalmente para evitar efectos en cascada complejos
SET session_replication_role = 'replica';

-- Limpiar tablas en orden de dependencia
TRUNCATE TABLE alertas_programadas RESTART IDENTITY CASCADE;
TRUNCATE TABLE uso_equipo_proyecto RESTART IDENTITY CASCADE;
TRUNCATE TABLE inventario_equipo RESTART IDENTITY CASCADE;
TRUNCATE TABLE ingresos RESTART IDENTITY CASCADE;
TRUNCATE TABLE facturas_gastos RESTART IDENTITY CASCADE;
TRUNCATE TABLE proyectos RESTART IDENTITY CASCADE;

-- Restaurar triggers
SET session_replication_role = 'origin';

COMMIT;

-- Mensaje de confirmación
-- SELECT 'Base de datos limpia y lista para datos reales.' as resultado;
