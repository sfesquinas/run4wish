-- ============================================
-- Script: Resetear usuarios existentes para que 30/11/2025 sea su día número 1
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Este script actualiza todos los schedules de usuarios existentes
-- para que su fecha de inicio (run_date) sea 2025-11-30, haciendo que
-- todos estén en su día 1 desde hoy en adelante.

-- Fecha objetivo: 30 de noviembre de 2025
-- IMPORTANTE: Asegúrate de que las 7 preguntas existan antes de ejecutar este script

-- PASO 1: Verificar que existan las 7 preguntas necesarias
SELECT 
  'VERIFICACIÓN DE PREGUNTAS' as paso,
  COUNT(*) as total_preguntas,
  COUNT(DISTINCT day_number) as dias_con_pregunta,
  array_agg(DISTINCT day_number ORDER BY day_number) as dias_disponibles
FROM r4w_ia_questions
WHERE race_type = '7d_mvp'
  AND day_number BETWEEN 1 AND 7;

-- PASO 2: Ver estadísticas ANTES del reset
SELECT 
  'ANTES DEL RESET' as estado,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(*) as total_schedules,
  MIN(run_date) as fecha_minima,
  MAX(run_date) as fecha_maxima
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL;

-- PASO 3: Actualizar todos los schedules personalizados de usuarios
-- para que su run_date sea 2025-11-30
UPDATE r4w_ia_daily_schedule
SET run_date = '2025-11-30'
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL;

-- PASO 4: Verificar el resultado DESPUÉS del reset
SELECT 
  'DESPUÉS DEL RESET' as estado,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(*) as total_schedules,
  MIN(run_date) as fecha_minima,
  MAX(run_date) as fecha_maxima,
  CASE 
    WHEN MIN(run_date) = '2025-11-30' AND MAX(run_date) = '2025-11-30' 
    THEN '✅ Todos los schedules tienen fecha 2025-11-30'
    ELSE '⚠️ Hay schedules con fechas diferentes'
  END as verificacion
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL;

-- PASO 4.1: Mostrar schedules con fechas diferentes (si los hay)
SELECT 
  'SCHEDULES CON FECHAS DIFERENTES' as tipo,
  run_date,
  COUNT(*) as cantidad_schedules,
  COUNT(DISTINCT user_id) as usuarios_afectados,
  array_agg(DISTINCT user_id) as lista_usuarios
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL
  AND run_date != '2025-11-30'
GROUP BY run_date
ORDER BY run_date;

-- PASO 5: Verificar que todos los usuarios tengan schedule completo (7 días)
SELECT 
  user_id,
  COUNT(*) as dias_en_schedule,
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ Completo'
    ELSE '⚠️ Incompleto'
  END as estado,
  MIN(run_date) as fecha_inicio,
  array_agg(DISTINCT day_number ORDER BY day_number) as dias_disponibles
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY dias_en_schedule DESC, user_id;

-- PASO 6: Mostrar detalles del día 1 de algunos usuarios (verificar que tengan pregunta)
SELECT 
  s.user_id,
  s.day_number,
  s.run_date,
  s.window_start,
  s.window_end,
  s.question_id,
  CASE 
    WHEN q.id IS NOT NULL THEN '✅ Tiene pregunta'
    ELSE '❌ Sin pregunta'
  END as estado_pregunta,
  q.question as texto_pregunta
FROM r4w_ia_daily_schedule s
LEFT JOIN r4w_ia_questions q ON s.question_id = q.id
WHERE s.race_type = '7d_mvp'
  AND s.user_id IS NOT NULL
  AND s.day_number = 1
ORDER BY s.user_id
LIMIT 10;

-- ============================================
-- Nota: Después de ejecutar este script, todos los usuarios
-- existentes estarán en su día 1 desde 2025-11-30.
-- Los nuevos usuarios que se registren también estarán en día 1
-- desde su fecha de registro.
-- ============================================

