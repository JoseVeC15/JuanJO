-- ============================================
-- CONTROL DE ACCESO A MÓDULOS PREMIUM 🛡️🚀
-- REESTRUCTURACIÓN INTEGRAL - v1.0.0
-- ============================================

-- 1. ADICIÓN DE FLAG DE FACTURACIÓN EN PERFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS facturacion_habilitada BOOLEAN DEFAULT false;

-- 2. COMENTARIO DE DOCUMENTACIÓN
COMMENT ON COLUMN public.profiles.facturacion_habilitada IS 'Indica si el usuario tiene acceso a los módulos de Facturación SIFEN, Clientes e Ingresos.';

-- 3. HABILITAR AUTOMÁTICAMENTE A ADMINISTRADORES (OPCIONAL)
-- UPDATE public.profiles SET facturacion_habilitada = true WHERE nivel_acceso = 1;
