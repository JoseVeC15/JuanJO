-- 1. Actualizar nivel y forzar columna
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nivel_acceso INTEGER DEFAULT 2;
UPDATE profiles SET nivel_acceso = 1 WHERE id IN (SELECT id FROM auth.users WHERE email = 'tu-correo@gmail.com');

-- 2. FUNCIÓN DE SEGURIDAD (Para evitar el Error 500 Recursivo)
CREATE OR REPLACE FUNCTION public.check_is_admin() 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND nivel_acceso = 1
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Borrar políticas viejas
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- 4. Nueva política fija
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (check_is_admin());

-- Forzar refresco del sistema
NOTIFY pgrst, 'reload schema';
