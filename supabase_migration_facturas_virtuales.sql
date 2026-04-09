-- Migration for Facturación Virtual / Autoimpresor

-- 1. Table for Virtual Invoices / Notes
CREATE TABLE public.facturas_virtuales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    tipo_documento integer NOT NULL, -- 1: Factura, 2: AutoFactura, 5: Nota Débito, 6: Nota Crédito
    numero_documento text NOT NULL, -- Format: 001-001-0000001
    timbrado text NOT NULL, -- 8 digits
    fecha_emision date NOT NULL,
    
    condicion_venta text DEFAULT 'contado', -- contado / credito
    
    cliente_razon_social text NOT NULL,
    cliente_ruc text NOT NULL,
    cliente_direccion text,
    
    moneda text DEFAULT 'PYG' NOT NULL,
    tasa_cambio numeric DEFAULT 1 NOT NULL,
    
    -- Totales (siempre guardados internamente en moneda origen, la UI los formatea)
    monto_total numeric NOT NULL,
    total_iva_10 numeric DEFAULT 0,
    total_iva_5 numeric DEFAULT 0,
    total_exenta numeric DEFAULT 0,
    
    -- Datos Documento Asociado (Para Notas de Crédito / Débito)
    asociado_timbrado text,
    asociado_numero text,
    asociado_fecha date,
    motivo_modificacion text,
    
    estado text DEFAULT 'emitido' -- emitido, anulado
);

-- 2. Table for Invoice Items
CREATE TABLE public.facturas_virtuales_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    factura_id uuid REFERENCES public.facturas_virtuales(id) ON DELETE CASCADE NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric NOT NULL,
    precio_unitario numeric NOT NULL,
    iva_tipo numeric NOT NULL, -- 10, 5, 0
    monto_total_item numeric NOT NULL
);

-- Enable RLS
ALTER TABLE public.facturas_virtuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_virtuales_items ENABLE ROW LEVEL SECURITY;

-- Policies for facturas_virtuales
CREATE POLICY "Users can manage their own virtual invoices"
    ON public.facturas_virtuales
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policies for facturas_virtuales_items
CREATE POLICY "Users can manage items of their own virtual invoices"
    ON public.facturas_virtuales_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.facturas_virtuales fv
            WHERE fv.id = facturas_virtuales_items.factura_id
            AND fv.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.facturas_virtuales fv
            WHERE fv.id = facturas_virtuales_items.factura_id
            AND fv.user_id = auth.uid()
        )
    );
