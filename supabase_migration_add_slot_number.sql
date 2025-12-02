-- ============================================
-- Migración: Añadir soporte para múltiples preguntas por día (slots)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Esta migración añade el campo slot_number a r4w_ia_daily_schedule
-- para permitir múltiples preguntas en un mismo día (útil para carreras de 24h)
-- Manteniendo compatibilidad total con el sistema actual (slot_number = 1 por defecto)

-- 1) Añadir columna slot_number con valor por defecto 1
ALTER TABLE r4w_ia_daily_schedule
ADD COLUMN IF NOT EXISTS slot_number INTEGER NOT NULL DEFAULT 1;

-- 2) Añadir comentario explicativo
COMMENT ON COLUMN r4w_ia_daily_schedule.slot_number IS 
  'Número de slot dentro del día (1, 2, 3...). Para 7d_mvp siempre será 1. Para carreras de 24h puede ser múltiple.';

-- 3) Crear índice compuesto para optimizar consultas por race_type, user_id, run_date y slot_number
CREATE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_race_user_date_slot
ON r4w_ia_daily_schedule(race_type, user_id, run_date, slot_number);

-- 4) Actualizar índice único existente para incluir slot_number
-- Primero eliminamos el índice único anterior si existe (solo si no tiene slot_number)
DROP INDEX IF EXISTS idx_r4w_ia_daily_schedule_user_unique;

-- Creamos el nuevo índice único que incluye slot_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_r4w_ia_daily_schedule_user_unique
ON r4w_ia_daily_schedule(race_type, user_id, day_number, run_date, slot_number)
WHERE user_id IS NOT NULL;

-- ============================================
-- Verificación (opcional)
-- ============================================
-- Verificar que la columna se añadió correctamente:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'r4w_ia_daily_schedule'
-- AND column_name = 'slot_number';

-- Verificar que todos los registros existentes tienen slot_number = 1:
-- SELECT COUNT(*) as total, 
--        COUNT(CASE WHEN slot_number = 1 THEN 1 END) as con_slot_1,
--        COUNT(CASE WHEN slot_number != 1 THEN 1 END) as con_otro_slot
-- FROM r4w_ia_daily_schedule;

-- ============================================
-- Nota: Esta migración es segura y no elimina datos.
-- Todos los registros existentes tendrán slot_number = 1 automáticamente
-- gracias al DEFAULT 1.
-- ============================================


