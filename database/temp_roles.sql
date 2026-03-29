-- 1. Añadir columna de nivel de acceso
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nivel_acceso INTEGER DEFAULT 2;

-- 2. Promover al usuario actual a Nivel 1 (Super Admin)
-- Nota: Ejecuta esto para tu ID de usuario específico
UPDATE profiles SET nivel_acceso = 1 WHERE id = auth.uid();

-- 3. Habilitar que los Admins vean todos los perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND nivel_acceso = 1
  )
);
