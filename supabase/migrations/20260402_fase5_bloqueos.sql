-- FASE 5: TABLA DE BLOQUEOS (OFFTIME)
-- Permite al freelancer marcar días como no laborables

CREATE TABLE IF NOT EXISTS public.calendario_bloqueos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL, -- 'vacacion', 'feriado', 'enfermedad', 'personal'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES
ALTER TABLE public.calendario_bloqueos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios bloqueos" 
ON public.calendario_bloqueos FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios bloqueos" 
ON public.calendario_bloqueos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden borrar sus propios bloqueos" 
ON public.calendario_bloqueos FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_bloqueos_user ON public.calendario_bloqueos (user_id);
CREATE INDEX IF NOT EXISTS idx_bloqueos_date ON public.calendario_bloqueos (date);
