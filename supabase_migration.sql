-- ============================================
-- Migración para agregar columnas a r4w_profiles
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- 1) Agregar columna 'country' (texto, nullable)
ALTER TABLE r4w_profiles
ADD COLUMN IF NOT EXISTS country TEXT;

-- 2) Agregar columna 'avatar_id' (texto, nullable)
ALTER TABLE r4w_profiles
ADD COLUMN IF NOT EXISTS avatar_id TEXT;

-- 3) Crear índice único en 'username' para garantizar que sea único
-- (Solo si no existe ya una constraint UNIQUE en username)
-- Primero verificar si ya existe una constraint única
-- Si username ya tiene una constraint UNIQUE, esta línea fallará pero no es crítico

-- Crear índice único en username (ignora duplicados si ya existe)
CREATE UNIQUE INDEX IF NOT EXISTS r4w_profiles_username_unique 
ON r4w_profiles(username) 
WHERE username IS NOT NULL;

-- Nota: Si prefieres usar una constraint UNIQUE en lugar de un índice único,
-- puedes usar esta alternativa (comentar la línea anterior y descomentar esta):
-- ALTER TABLE r4w_profiles
-- ADD CONSTRAINT r4w_profiles_username_unique UNIQUE (username);

-- ============================================
-- Verificación (opcional, para comprobar que se crearon correctamente)
-- ============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'r4w_profiles'
-- ORDER BY ordinal_position;



