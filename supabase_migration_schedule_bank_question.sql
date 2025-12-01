-- ============================================
-- Migración: Añadir columna bank_question_id a r4w_ia_daily_schedule
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Esta migración añade soporte para preguntas del banco maestro (r4w_question_bank)
-- en la tabla de schedules, permitiendo que la carrera 24h_sprint use preguntas
-- del banco mientras que 7d_mvp sigue usando r4w_ia_questions.

-- 1) Añadir la columna bank_question_id si no existe
ALTER TABLE r4w_ia_daily_schedule
ADD COLUMN IF NOT EXISTS bank_question_id UUID NULL;

-- 2) Añadir comentario explicativo
COMMENT ON COLUMN r4w_ia_daily_schedule.bank_question_id IS
  'ID de pregunta del banco maestro (r4w_question_bank). Usado para carreras tipo 24h_sprint. NULL para carreras que usan question_id (ej: 7d_mvp).';

-- 3) Crear foreign key constraint hacia r4w_question_bank si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_r4w_ia_daily_schedule_bank_question'
  ) THEN
    ALTER TABLE r4w_ia_daily_schedule
    ADD CONSTRAINT fk_r4w_ia_daily_schedule_bank_question
    FOREIGN KEY (bank_question_id)
    REFERENCES r4w_question_bank(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Verificación: comprobar que la columna existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'bank_question_id';

-- 5) Verificación: comprobar que el constraint FK existe
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'r4w_ia_daily_schedule'::regclass
  AND conname = 'fk_r4w_ia_daily_schedule_bank_question';

-- ============================================
-- Nota: Esta migración NO modifica:
-- - El constraint existente fk_r4w_ia_daily_schedule_question (para 7d_mvp)
-- - Ningún dato existente en la tabla
-- - La estructura de otras columnas
-- ============================================

