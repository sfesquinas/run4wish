-- ============================================
-- Migración: Extender r4w_ia_daily_schedule para soportar schedules por usuario
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- 1) Añadir columna user_id (nullable) para schedules personalizados
ALTER TABLE r4w_ia_daily_schedule
ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2) Añadir comentario explicativo
COMMENT ON COLUMN r4w_ia_daily_schedule.user_id IS 
  'NULL = schedule global, UUID = schedule personalizado para ese usuario';

-- 3) Crear índice compuesto para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_user_race_date
ON r4w_ia_daily_schedule(race_type, user_id, run_date);

-- 4) Añadir constraint para evitar duplicados de schedule personalizado
-- (un usuario no puede tener dos schedules para el mismo día y race_type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_user_unique
ON r4w_ia_daily_schedule(race_type, user_id, day_number, run_date)
WHERE user_id IS NOT NULL;

-- ============================================
-- Verificación (opcional)
-- ============================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'r4w_ia_daily_schedule'
-- ORDER BY ordinal_position;


