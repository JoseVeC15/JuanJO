-- ============================================
-- HARDENING CUMPLIMIENTO SIFEN / DNIT
-- Fecha: 2026-04-07
-- ============================================

-- 1) Tabla de numeracion secuencial por contribuyente y punto de expedicion
CREATE TABLE IF NOT EXISTS public.sifen_numeradores (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo_documento text NOT NULL,
    establecimiento text NOT NULL,
    punto_expedicion text NOT NULL,
    ultimo_numero integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, tipo_documento, establecimiento, punto_expedicion)
);

ALTER TABLE public.sifen_numeradores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant ve sus numeradores SIFEN" ON public.sifen_numeradores;
CREATE POLICY "Tenant ve sus numeradores SIFEN" ON public.sifen_numeradores
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2) Restricciones normativas minimas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'documentos_items_iva_tipo_chk'
    ) THEN
        ALTER TABLE public.documentos_items
            ADD CONSTRAINT documentos_items_iva_tipo_chk CHECK (iva_tipo IN (0, 5, 10));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'documentos_electronicos_tipo_documento_chk'
    ) THEN
        ALTER TABLE public.documentos_electronicos
            ADD CONSTRAINT documentos_electronicos_tipo_documento_chk CHECK (tipo_documento IN ('1', '2', '3', '4', '5'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'documentos_electronicos_condicion_operacion_chk'
    ) THEN
        ALTER TABLE public.documentos_electronicos
            ADD CONSTRAINT documentos_electronicos_condicion_operacion_chk CHECK (condicion_operacion IN ('contado', 'credito'));
    END IF;
END $$;

-- 3) Funcion para obtener proximo numero fiscal
CREATE OR REPLACE FUNCTION public.obtener_siguiente_numero_factura(
    p_tipo_documento text,
    p_establecimiento text,
    p_punto_expedicion text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_ultimo integer;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF p_tipo_documento NOT IN ('1', '2', '3', '4', '5') THEN
        RAISE EXCEPTION 'Tipo de documento no permitido: %', p_tipo_documento;
    END IF;

    IF p_establecimiento !~ '^[0-9]{3}$' THEN
        RAISE EXCEPTION 'Establecimiento debe tener 3 digitos';
    END IF;

    IF p_punto_expedicion !~ '^[0-9]{3}$' THEN
        RAISE EXCEPTION 'Punto de expedicion debe tener 3 digitos';
    END IF;

    INSERT INTO public.sifen_numeradores (
        user_id,
        tipo_documento,
        establecimiento,
        punto_expedicion,
        ultimo_numero,
        updated_at
    ) VALUES (
        v_user_id,
        p_tipo_documento,
        p_establecimiento,
        p_punto_expedicion,
        1,
        now()
    )
    ON CONFLICT (user_id, tipo_documento, establecimiento, punto_expedicion)
    DO UPDATE SET
        ultimo_numero = public.sifen_numeradores.ultimo_numero + 1,
        updated_at = now()
    RETURNING ultimo_numero INTO v_ultimo;

    RETURN p_establecimiento || '-' || p_punto_expedicion || '-' || lpad(v_ultimo::text, 7, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_siguiente_numero_factura(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_siguiente_numero_factura(text, text, text) TO authenticated;
