-- 1. FIX INMEDIATO PARA EL CACHÉ (Soluciona el error actual de columna 'codigo')
NOTIFY pgrst, 'reload schema';

-- 2. TABLA MAESTRA DEL CATÁLOGO DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos_catalogo (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    codigo text NOT NULL,
    descripcion text NOT NULL,
    precio_unitario numeric NOT NULL,
    iva_tipo numeric DEFAULT 10 NOT NULL,
    stock_actual numeric DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    
    UNIQUE (user_id, codigo) -- Un código no puede repetirse por inquilino
);

-- Enable RLS
ALTER TABLE public.productos_catalogo ENABLE ROW LEVEL SECURITY;

-- Policies for catalog
DROP POLICY IF EXISTS "Users can manage their own product catalog" ON public.productos_catalogo;

CREATE POLICY "Users can manage their own product catalog"
    ON public.productos_catalogo
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. TRIGGER AUTOMÁTICO DE DESCUENTO DE STOCK
-- Esta función restará el stock_actual del catálogo siempre que se haga una Factura
CREATE OR REPLACE FUNCTION update_stock_autoimpresor()
RETURNS trigger AS $$
BEGIN
    UPDATE public.productos_catalogo
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE codigo = NEW.codigo 
      AND user_id = (SELECT user_id FROM public.facturas_virtuales WHERE id = NEW.factura_id)
      AND NEW.codigo IS NOT NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_descontar_stock ON public.facturas_virtuales_items;

CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON public.facturas_virtuales_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_autoimpresor();

-- Notificar nuevamente para registrar la tabla nueva
NOTIFY pgrst, 'reload schema';
