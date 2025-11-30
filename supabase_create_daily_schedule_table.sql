-- ============================================
-- Script: Crear tabla r4w_ia_daily_schedule
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Este script crea la tabla r4w_ia_daily_schedule si no existe
-- y todas sus columnas necesarias

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS r4w_ia_daily_schedule (
  id SERIAL PRIMARY KEY,
  race_type VARCHAR(50) NOT NULL,
  day_number INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  run_date DATE NOT NULL,
  window_start TIME NOT NULL,
  window_end TIME NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir comentarios a las columnas
COMMENT ON TABLE r4w_ia_daily_schedule IS 'Schedules diarios de preguntas para carreras. user_id NULL = schedule global, UUID = schedule personalizado';
COMMENT ON COLUMN r4w_ia_daily_schedule.race_type IS 'Tipo de carrera (ej: 7d_mvp)';
COMMENT ON COLUMN r4w_ia_daily_schedule.day_number IS 'Número del día (1-7 para carrera de 7 días)';
COMMENT ON COLUMN r4w_ia_daily_schedule.question_id IS 'ID de la pregunta asociada (FK a r4w_ia_questions)';
COMMENT ON COLUMN r4w_ia_daily_schedule.run_date IS 'Fecha en la que se ejecuta esta pregunta';
COMMENT ON COLUMN r4w_ia_daily_schedule.window_start IS 'Hora de inicio de la ventana horaria (HH:MM:SS)';
COMMENT ON COLUMN r4w_ia_daily_schedule.window_end IS 'Hora de fin de la ventana horaria (HH:MM:SS)';
COMMENT ON COLUMN r4w_ia_daily_schedule.user_id IS 'NULL = schedule global, UUID = schedule personalizado para ese usuario';

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_race_type 
ON r4w_ia_daily_schedule(race_type);

CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_user_id 
ON r4w_ia_daily_schedule(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_run_date 
ON r4w_ia_daily_schedule(run_date);

CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_race_user_date 
ON r4w_ia_daily_schedule(race_type, user_id, run_date);

CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_question_id 
ON r4w_ia_daily_schedule(question_id);

-- Crear índice único para evitar duplicados de schedule personalizado
-- (un usuario no puede tener dos schedules para el mismo día y race_type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_user_unique
ON r4w_ia_daily_schedule(race_type, user_id, day_number, run_date)
WHERE user_id IS NOT NULL;

-- Crear índice único para schedules globales (sin user_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_global_unique
ON r4w_ia_daily_schedule(race_type, day_number, run_date)
WHERE user_id IS NULL;

-- Añadir foreign key a r4w_ia_questions (si la tabla existe)
-- Si la tabla r4w_ia_questions no existe, este comando fallará silenciosamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'r4w_ia_questions') THEN
    ALTER TABLE r4w_ia_daily_schedule
    ADD CONSTRAINT fk_r4w_ia_daily_schedule_question
    FOREIGN KEY (question_id) 
    REFERENCES r4w_ia_questions(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Añadir foreign key a r4w_profiles (si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'r4w_profiles') THEN
    ALTER TABLE r4w_ia_daily_schedule
    ADD CONSTRAINT fk_r4w_ia_daily_schedule_user
    FOREIGN KEY (user_id) 
    REFERENCES r4w_profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Verificar que la tabla se creó correctamente
SELECT 
  'VERIFICACIÓN' as paso,
  COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule';

-- Mostrar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
ORDER BY ordinal_position;

-- ============================================
-- Nota: Después de ejecutar este script, la tabla r4w_ia_daily_schedule
-- estará lista para usar. Puedes ejecutar luego:
-- 1. supabase_migration_user_schedules.sql (si aún no lo has ejecutado)
-- 2. /api/admin/generate-questions (para crear las preguntas)
-- 3. Los schedules se crearán automáticamente cuando los usuarios se registren
-- ============================================

