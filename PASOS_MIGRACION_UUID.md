# Pasos para Migrar question_id de INTEGER a UUID

## 📋 Resumen

Como `r4w_ia_questions.id` es UUID y `r4w_ia_daily_schedule.question_id` es INTEGER, necesitamos migrar la columna a UUID para que coincidan.

## ✅ Cambios Realizados en el Código

1. ✅ **`app/lib/userSchedule.ts`**: Actualizado para usar UUID (string) en lugar de INTEGER
2. ✅ **`app/api/admin/generate-questions/route.ts`**: Actualizado para validar y usar UUID
3. ✅ **`supabase_create_daily_schedule_table.sql`**: Actualizado el esquema para usar UUID

## 🔧 Pasos a Seguir

### PASO 1: Verificar Estado Actual

Ejecuta en Supabase SQL Editor para ver el estado actual:

```sql
-- Verificar tipo actual de question_id
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'question_id';

-- Verificar si hay datos existentes
SELECT COUNT(*) as total_schedules
FROM r4w_ia_daily_schedule;
```

### PASO 2: Verificar Integridad de Datos

Antes de migrar, verifica que los datos existentes sean válidos:

```sql
-- Verificar que todos los question_id actuales existen en r4w_ia_questions
SELECT 
  s.id as schedule_id,
  s.question_id as current_question_id,
  s.day_number,
  q.id as question_uuid_exists
FROM r4w_ia_daily_schedule s
LEFT JOIN r4w_ia_questions q ON s.question_id::text = q.id::text
WHERE s.question_id IS NOT NULL
  AND q.id IS NULL;
```

**Si esta query devuelve filas**, significa que hay `question_id` INTEGER que no coinciden con UUIDs. En ese caso, necesitarás un mapeo manual (ver PASO 2B).

### PASO 2B: Mapeo Manual (Solo si hay datos inconsistentes)

Si hay datos que no coinciden, necesitas crear un mapeo. Primero, identifica qué preguntas existen:

```sql
-- Ver todas las preguntas disponibles
SELECT 
  id as uuid,
  day_number,
  question,
  created_at
FROM r4w_ia_questions
WHERE race_type = '7d_mvp'
ORDER BY day_number, created_at;
```

Luego, crea un mapeo manual de INTEGER a UUID y actualiza los schedules:

```sql
-- Ejemplo de mapeo manual (AJUSTA LOS UUIDs según tus datos reales)
UPDATE r4w_ia_daily_schedule
SET question_id = 'UUID-AQUI'::uuid
WHERE question_id = 123; -- INTEGER antiguo
```

### PASO 3: Ejecutar la Migración

**IMPORTANTE:** Si tienes datos en producción, haz un backup primero:

```sql
-- Crear backup (opcional pero recomendado)
CREATE TABLE r4w_ia_daily_schedule_backup AS 
SELECT * FROM r4w_ia_daily_schedule;
```

Ahora ejecuta el script de migración completo:

**Archivo:** `supabase_migration_question_id_to_uuid.sql`

Este script:
1. Elimina la foreign key constraint existente
2. Elimina el índice en question_id
3. Crea una columna temporal `question_id_uuid`
4. Convierte los datos INTEGER a UUID
5. Elimina la columna INTEGER antigua
6. Renombra la columna UUID a `question_id`
7. Recrea el índice y la foreign key

### PASO 4: Verificar la Migración

Después de ejecutar la migración, verifica que todo esté correcto:

```sql
-- Verificar que question_id ahora es UUID
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'r4w_ia_daily_schedule'
  AND column_name = 'question_id';

-- Verificar integridad referencial
SELECT 
  COUNT(*) as total_schedules,
  COUNT(DISTINCT question_id) as question_ids_unicos,
  COUNT(*) FILTER (WHERE question_id IS NULL) as schedules_sin_question_id
FROM r4w_ia_daily_schedule;

-- Verificar que todos los question_id existen en r4w_ia_questions
SELECT 
  COUNT(*) as schedules_con_question_id_invalido
FROM r4w_ia_daily_schedule s
LEFT JOIN r4w_ia_questions q ON s.question_id = q.id
WHERE q.id IS NULL;
```

**Si la última query devuelve 0**, la migración fue exitosa.

### PASO 5: Probar el Código

Después de la migración:

1. **Registrar un nuevo usuario:**
   - Verifica que se crea el schedule correctamente
   - Revisa los logs del servidor para asegurarte de que no hay errores

2. **Generar preguntas nuevas:**
   - Ejecuta `/api/admin/generate-questions`
   - Verifica que se crean los schedules correctamente

3. **Acceder a `/pregunta`:**
   - Verifica que se carga la pregunta del día
   - Verifica que la pregunta tiene opciones y respuesta correcta

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: "No se pueden convertir INTEGER a UUID"

**Solución:** Si tienes datos existentes con INTEGER que no coinciden con UUIDs, necesitas:
1. Identificar qué preguntas corresponden a cada INTEGER
2. Crear un mapeo manual
3. Actualizar los schedules antes de cambiar el tipo de columna

### Problema 2: "Foreign key constraint violation"

**Solución:** Asegúrate de que todos los `question_id` existan en `r4w_ia_questions` antes de recrear la foreign key.

### Problema 3: "Datos perdidos después de la migración"

**Solución:** Si tienes el backup, puedes restaurar:
```sql
-- Restaurar desde backup (solo si es necesario)
DROP TABLE IF EXISTS r4w_ia_daily_schedule;
CREATE TABLE r4w_ia_daily_schedule AS 
SELECT * FROM r4w_ia_daily_schedule_backup;
```

## 📝 Notas Importantes

1. **Si no tienes datos en producción:** Puedes simplemente eliminar y recrear la tabla con el nuevo esquema:
   ```sql
   DROP TABLE IF EXISTS r4w_ia_daily_schedule;
   -- Luego ejecuta supabase_create_daily_schedule_table.sql (ya actualizado)
   ```

2. **Si tienes datos en producción:** Usa el script de migración completo.

3. **Después de la migración:** El código TypeScript ya está actualizado para usar UUID, así que debería funcionar inmediatamente.

## ✅ Checklist Final

- [ ] Ejecutado script de migración SQL
- [ ] Verificado que `question_id` es UUID
- [ ] Verificado integridad referencial
- [ ] Probado registro de nuevo usuario
- [ ] Probado generación de preguntas
- [ ] Probado acceso a `/pregunta`
- [ ] Revisado logs del servidor (sin errores)

## 🆘 Si Algo Sale Mal

1. **Revisa los logs del servidor** para ver el error exacto
2. **Verifica el esquema** con las queries de verificación
3. **Restaura desde backup** si es necesario
4. **Contacta al equipo** si necesitas ayuda adicional

