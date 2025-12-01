-- ============================================
-- Script: Migración de question_id de INTEGER a UUID
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Este script cambia el tipo de dato de question_id de INTEGER a UUID
-- para que coincida con el tipo de id en r4w_ia_questions

-- PASO 1: Verificar el estado actual
SELECT 
  'ESTADO ACTUAL' as paso,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'question_id';

-- PASO 2: Verificar si hay datos existentes que necesiten migración
SELECT 
  'DATOS EXISTENTES' as paso,
  COUNT(*) as total_schedules,
  COUNT(DISTINCT question_id) as question_ids_unicos
FROM r4w_ia_daily_schedule;

-- PASO 3: Verificar que los question_id actuales existen en r4w_ia_questions
-- (Esto puede fallar si hay datos inconsistentes)
SELECT 
  'VERIFICACIÓN DE INTEGRIDAD' as paso,
  COUNT(*) as schedules_con_question_id_invalido
FROM r4w_ia_daily_schedule s
LEFT JOIN r4w_ia_questions q ON s.question_id::text = q.id::text
WHERE s.question_id IS NOT NULL
  AND q.id IS NULL;

-- PASO 4: Eliminar la foreign key constraint existente (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_r4w_ia_daily_schedule_question'
      AND table_name = 'r4w_ia_daily_schedule'
  ) THEN
    ALTER TABLE r4w_ia_daily_schedule
    DROP CONSTRAINT fk_r4w_ia_daily_schedule_question;
    RAISE NOTICE 'Foreign key constraint eliminada';
  END IF;
END $$;

-- PASO 5: Eliminar el índice existente en question_id (si existe)
DROP INDEX IF EXISTS idx_r4w_ia_daily_schedule_question_id;

-- PASO 6: Si hay datos existentes, necesitamos convertirlos
-- Primero, crear una columna temporal para almacenar los UUIDs
ALTER TABLE r4w_ia_daily_schedule
ADD COLUMN IF NOT EXISTS question_id_uuid UUID;

-- PASO 7: Convertir los question_id INTEGER existentes a UUID
-- Esto asume que los INTEGERs son IDs válidos que coinciden con algún UUID
-- Si no hay correspondencia, se dejará NULL
UPDATE r4w_ia_daily_schedule s
SET question_id_uuid = q.id
FROM r4w_ia_questions q
WHERE s.question_id::text = q.id::text
  OR EXISTS (
    SELECT 1 
    FROM r4w_ia_questions q2 
    WHERE q2.id::text LIKE '%' || s.question_id::text || '%'
    LIMIT 1
  );

-- Si los INTEGERs no coinciden directamente, intentar otra estrategia:
-- Buscar por posición o por algún otro criterio
-- NOTA: Esta parte puede necesitar ajustes según tu caso específico

-- PASO 8: Eliminar la columna INTEGER antigua
ALTER TABLE r4w_ia_daily_schedule
DROP COLUMN IF EXISTS question_id;

-- PASO 9: Renombrar la columna UUID a question_id
ALTER TABLE r4w_ia_daily_schedule
RENAME COLUMN question_id_uuid TO question_id;

-- PASO 10: Hacer question_id NOT NULL (si no hay valores NULL)
ALTER TABLE r4w_ia_daily_schedule
ALTER COLUMN question_id SET NOT NULL;

-- PASO 11: Recrear el índice en question_id
CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_question_id 
ON r4w_ia_daily_schedule(question_id);

-- PASO 12: Recrear la foreign key constraint
ALTER TABLE r4w_ia_daily_schedule
ADD CONSTRAINT fk_r4w_ia_daily_schedule_question
FOREIGN KEY (question_id) 
REFERENCES r4w_ia_questions(id)
ON DELETE CASCADE;

-- PASO 13: Verificar el resultado
SELECT 
  'ESTADO FINAL' as paso,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'question_id';

-- PASO 14: Verificar integridad referencial
SELECT 
  'VERIFICACIÓN FINAL' as paso,
  COUNT(*) as total_schedules,
  COUNT(DISTINCT question_id) as question_ids_unicos,
  COUNT(*) FILTER (WHERE question_id IS NULL) as schedules_sin_question_id
FROM r4w_ia_daily_schedule;

-- ============================================
-- NOTA IMPORTANTE:
-- Si tienes datos existentes en r4w_ia_daily_schedule con question_id INTEGER
-- que no coinciden directamente con UUIDs en r4w_ia_questions, necesitarás
-- una estrategia de migración personalizada. En ese caso:
-- 1. Identifica qué question_id INTEGER corresponde a qué UUID
-- 2. Crea un mapeo manual
-- 3. Actualiza los datos antes de cambiar el tipo de columna
-- ============================================

