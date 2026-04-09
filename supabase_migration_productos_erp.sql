-- 1. TABLAS SATÉLITES PARA CLASIFICACIÓN (Marcas, Familias, Grupos)
CREATE TABLE IF NOT EXISTS public.productos_marcas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    nombre text NOT NULL,
    UNIQUE (user_id, nombre)
);

CREATE TABLE IF NOT EXISTS public.productos_familias (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    nombre text NOT NULL,
    UNIQUE (user_id, nombre)
);

CREATE TABLE IF NOT EXISTS public.productos_grupos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    familia_id uuid REFERENCES public.productos_familias(id),
    nombre text NOT NULL,
    UNIQUE (user_id, nombre)
);

-- 2. TABLA DE CUENTAS CONTABLES (Ocultas por ahora, pero preparadas)
CREATE TABLE IF NOT EXISTS public.contabilidad_cuentas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    codigo text,
    nombre text NOT NULL,
    tipo text NOT NULL, -- ej: Activo, Ingreso, Gasto
    activa boolean DEFAULT true
);

-- RLS para las nuevas tablas
ALTER TABLE public.productos_marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contabilidad_cuentas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marcas tenant" ON public.productos_marcas;
CREATE POLICY "Marcas tenant" ON public.productos_marcas FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Familias tenant" ON public.productos_familias;
CREATE POLICY "Familias tenant" ON public.productos_familias FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Grupos tenant" ON public.productos_grupos;
CREATE POLICY "Grupos tenant" ON public.productos_grupos FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cuentas tenant" ON public.contabilidad_cuentas;
CREATE POLICY "Cuentas tenant" ON public.contabilidad_cuentas FOR ALL USING (auth.uid() = user_id);

-- 3. EXTENDER TABLA MAESTRA productos_catalogo
DO $$ 
BEGIN
    -- General y Clasificación
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS codigo_barras text;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS descripcion_tecnica text;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS marca_id uuid REFERENCES public.productos_marcas(id);
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS familia_id uuid REFERENCES public.productos_familias(id);
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS grupo_id uuid REFERENCES public.productos_grupos(id);
    
    -- Empaque y Unidades
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS unidad_medida text DEFAULT 'UN';
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS contenido numeric DEFAULT 0;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS cantidad_por_caja numeric DEFAULT 1;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS factor_conversion numeric DEFAULT 1;

    -- Inventario
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS stock_minimo numeric DEFAULT 0;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS controla_inventario boolean DEFAULT true;

    -- Costos (Gs)
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS costo_promedio numeric DEFAULT 0;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS costo_ultimo numeric DEFAULT 0;

    -- Precios Límites
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS precio_minimo numeric DEFAULT 0;
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS precio_maximo numeric DEFAULT 0;

    -- Integración Contable
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS cuenta_compras_id uuid REFERENCES public.contabilidad_cuentas(id);
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS cuenta_ventas_id uuid REFERENCES public.contabilidad_cuentas(id);
    ALTER TABLE public.productos_catalogo ADD COLUMN IF NOT EXISTS cuenta_inventario_id uuid REFERENCES public.contabilidad_cuentas(id);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Alguna columna ya existe o hubo un error: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
