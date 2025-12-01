# Orden de Ejecución de Scripts SQL

Si estás viendo el error **"La tabla r4w_ia_daily_schedule no existe"**, sigue estos pasos en orden:

## Paso 1: Crear la tabla (OBLIGATORIO si no existe)

**Archivo:** `supabase_create_daily_schedule_table.sql`

Este script crea la tabla `r4w_ia_daily_schedule` desde cero con todas sus columnas e índices.

**Cómo ejecutar:**
1. Abre el **SQL Editor** en Supabase
2. Copia y pega el contenido de `supabase_create_daily_schedule_table.sql`
3. Ejecuta el script
4. Verifica que no haya errores

## Paso 2: Añadir columna user_id (si aún no lo has hecho)

**Archivo:** `supabase_migration_user_schedules.sql`

Este script añade la columna `user_id` a la tabla (si no existe ya).

**Cómo ejecutar:**
1. Abre el **SQL Editor** en Supabase
2. Copia y pega el contenido de `supabase_migration_user_schedules.sql`
3. Ejecuta el script

**Nota:** Si ya ejecutaste el Paso 1, este paso puede no ser necesario, pero ejecutarlo no hará daño (usa `IF NOT EXISTS`).

## Paso 3: Generar las 7 preguntas

**API:** `/api/admin/generate-questions`

Este paso crea las 7 preguntas necesarias para la carrera de 7 días.

**Cómo ejecutar:**

### Opción A: Desde el navegador (recomendado)
1. Inicia sesión en tu aplicación
2. Abre la consola del navegador (F12)
3. Ejecuta:
```javascript
fetch('/api/admin/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Opción B: Desde la terminal
```bash
curl -X POST http://localhost:3000/api/admin/generate-questions \
  -H "Content-Type: application/json"
```

## Paso 4: Resetear fechas de usuarios existentes (opcional)

**Archivo:** `supabase_reset_users_day1.sql`

Este script actualiza todos los schedules de usuarios existentes para que su fecha sea `2025-11-30`.

**Cómo ejecutar:**
1. Abre el **SQL Editor** en Supabase
2. Copia y pega el contenido de `supabase_reset_users_day1.sql`
3. Ejecuta el script
4. Revisa los resultados para verificar que todo esté correcto

## Verificación Final

Después de ejecutar todos los pasos, verifica que todo esté correcto:

```sql
-- Verificar que la tabla existe
SELECT COUNT(*) FROM r4w_ia_daily_schedule;

-- Verificar que existen las 7 preguntas
SELECT day_number, COUNT(*) 
FROM r4w_ia_questions 
WHERE race_type = '7d_mvp' 
GROUP BY day_number 
ORDER BY day_number;

-- Verificar schedules de usuarios
SELECT 
  COUNT(DISTINCT user_id) as usuarios_con_schedule,
  COUNT(*) as total_schedules
FROM r4w_ia_daily_schedule
WHERE race_type = '7d_mvp' AND user_id IS NOT NULL;
```

## Resumen del Orden

1. ✅ **Paso 1:** Crear tabla `r4w_ia_daily_schedule` 
2. ✅ **Paso 2:** Añadir columna `user_id` (opcional si ya existe)
3. ✅ **Paso 3:** Generar las 7 preguntas con `/api/admin/generate-questions`
4. ✅ **Paso 4:** Resetear fechas de usuarios (opcional)

## Si sigues teniendo problemas

1. **Verifica que la tabla existe:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'r4w_ia_daily_schedule';
```

2. **Verifica los permisos de la tabla:**
   - Asegúrate de que tu usuario de Supabase tenga permisos para INSERT, SELECT, UPDATE, DELETE

3. **Revisa los logs de error:**
   - Los errores detallados aparecerán en la consola del navegador o en los logs de Supabase


