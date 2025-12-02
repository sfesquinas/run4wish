-- ============================================
-- Migración: Forzar permitir NULL en question_id de r4w_ia_daily_schedule
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Esta migración asegura que question_id puede ser NULL para soportar
-- carreras que usan bank_question_id (24h_sprint) mientras mantiene
-- compatibilidad con carreras que usan question_id (7d_mvp).

-- Asegurar que question_id permite NULL
ALTER TABLE r4w_ia_daily_schedule
ALTER COLUMN question_id DROP NOT NULL;

-- Eliminar FK antiguo si existe
ALTER TABLE r4w_ia_daily_schedule
DROP CONSTRAINT IF EXISTS fk_r4w_ia_daily_schedule_question;

-- Crear FK nuevo que permite NULL
ALTER TABLE r4w_ia_daily_schedule
ADD CONSTRAINT fk_r4w_ia_daily_schedule_question
FOREIGN KEY (question_id)
REFERENCES r4w_ia_questions (id)
ON DELETE SET NULL;

-- Verificar estado final
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'question_id';

SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'r4w_ia_daily_schedule'
  AND tc.constraint_name = 'fk_r4w_ia_daily_schedule_question';


