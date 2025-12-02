-- ============================================
-- Migración: Permitir NULL en question_id de r4w_ia_daily_schedule
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Esta migración permite que question_id sea NULL para soportar carreras
-- que usan bank_question_id (como 24h_sprint) mientras mantiene compatibilidad
-- con carreras que usan question_id (como 7d_mvp).

-- 1) Permitir NULL en question_id
ALTER TABLE r4w_ia_daily_schedule
ALTER COLUMN question_id DROP NOT NULL;

-- 2) Borrar FK antiguo
ALTER TABLE r4w_ia_daily_schedule
DROP CONSTRAINT IF EXISTS fk_r4w_ia_daily_schedule_question;

-- 3) Crear nuevo FK que permite NULL
ALTER TABLE r4w_ia_daily_schedule
ADD CONSTRAINT fk_r4w_ia_daily_schedule_question
FOREIGN KEY (question_id)
REFERENCES r4w_ia_questions (id)
ON DELETE SET NULL;

-- ============================================
-- Verificación: comprobar que question_id acepta NULL
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'question_id';

-- ============================================
-- Verificación: comprobar que el nuevo FK existe
-- ============================================
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  confdeltype AS on_delete_action
FROM pg_constraint
WHERE conrelid = 'r4w_ia_daily_schedule'::regclass
  AND conname = 'fk_r4w_ia_daily_schedule_question';

-- ============================================
-- Nota: Esta migración NO modifica:
-- - Ningún dato existente en la tabla
-- - La estructura de otras columnas
-- - Los schedules existentes de 7d_mvp (siguen usando question_id normalmente)
-- ============================================


