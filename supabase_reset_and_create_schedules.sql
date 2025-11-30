-- ============================================
-- Script COMPLETO: Resetear y crear schedules para todos los usuarios
-- Ejecutar en el SQL Editor de Supabase
-- ============================================
-- Este script:
-- 1. Verifica que existan las 7 preguntas
-- 2. Identifica usuarios sin schedules
-- 3. Actualiza la fecha de schedules existentes a 2025-11-30
-- 4. Crea schedules para usuarios que no los tengan
-- 
-- IMPORTANTE: Este script asume que las 7 preguntas ya existen.
-- Si no existen, ejecuta primero: /api/admin/generate-questions

-- Fecha objetivo: 30 de noviembre de 2025
-- NOTA: Este script actualiza schedules existentes.
-- Para crear schedules nuevos, usa la API /api/user/create-schedule o
-- el código de registro que crea schedules automáticamente.

-- PASO 1: Verificar que existan las 7 preguntas
SELECT 
  'VERIFICACIÓN DE PREGUNTAS' as paso,
  COUNT(*) as total_preguntas,
  COUNT(DISTINCT day_number) as dias_con_pregunta,
  array_agg(DISTINCT day_number ORDER BY day_number) as dias_disponibles
FROM r4w_ia_questions
WHERE race_type = '7d_mvp'
  AND day_number BETWEEN 1 AND 7;

-- PASO 2: Actualizar fecha de schedules existentes a 2025-11-30
UPDATE r4w_ia_daily_schedule
SET run_date = '2025-11-30'
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL;

-- PASO 4: Verificar resultados
SELECT 
  'RESULTADO FINAL' as estado,
  COUNT(DISTINCT user_id) as usuarios_con_schedule,
  COUNT(*) as total_schedules,
  MIN(run_date) as fecha_minima,
  MAX(run_date) as fecha_maxima,
  COUNT(*) FILTER (WHERE day_number = 1) as schedules_dia_1
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL;

-- PASO 5: Verificar que todos los usuarios tengan schedule completo
SELECT 
  user_id,
  COUNT(*) as dias_en_schedule,
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ Completo'
    ELSE '⚠️ Incompleto - Faltan días'
  END as estado,
  MIN(run_date) as fecha_inicio,
  COUNT(*) FILTER (WHERE question_id IS NOT NULL) as dias_con_pregunta
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp'
  AND user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) < 7
ORDER BY dias_en_schedule, user_id;

-- PASO 6: Mostrar detalles del día 1 de algunos usuarios
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
  LEFT(q.question, 50) as pregunta_preview
FROM r4w_ia_daily_schedule s
LEFT JOIN r4w_ia_questions q ON s.question_id = q.id
WHERE s.race_type = '7d_mvp'
  AND s.user_id IS NOT NULL
  AND s.day_number = 1
ORDER BY s.user_id
LIMIT 10;

-- ============================================
-- Nota: Después de ejecutar este script:
-- - Todos los usuarios existentes tendrán fecha 2025-11-30
-- - Todos los usuarios tendrán schedule completo (7 días)
-- - Todos tendrán acceso a la pregunta del día 1
-- - Los nuevos usuarios seguirán teniendo su propia fecha de registro
-- ============================================

