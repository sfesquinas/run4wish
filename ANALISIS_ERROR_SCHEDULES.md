# Análisis: Error "Error insertando schedules" y Problema con Pregunta del Día

## 🔍 Problemas Identificados

### 1. **Error de Tipo de Dato en `question_id`**

**Problema:**
- La tabla `r4w_ia_daily_schedule` tiene `question_id INTEGER NOT NULL`
- Sin embargo, Supabase puede devolver IDs como strings (UUIDs o números como strings)
- Al intentar insertar un string en un campo INTEGER, se produce el error

**Ubicación del error:**
- `app/lib/userSchedule.ts` línea 163-166: Se usa `Map<number, string>()` pero `q.id` puede ser string
- `app/api/admin/generate-questions/route.ts` línea 351: Validación `isNaN(Number(s.question_id))` puede fallar con UUIDs

**Solución aplicada:**
1. Conversión explícita de `question_id` a INTEGER antes de insertar
2. Validación mejorada que detecta si el ID es string y lo convierte
3. Logging detallado para identificar problemas de tipo de dato

### 2. **Problema con la Pregunta del Día**

**Análisis del flujo:**

1. **Registro de usuario:**
   - Usuario se registra → Se crea perfil → Se intenta crear schedule (en background)
   - Si falla la creación del schedule, el usuario puede seguir usando la app

2. **Login:**
   - Usuario hace login → Se verifica schedule → Si no existe, se intenta crear

3. **Acceso a `/pregunta`:**
   - Hook `useDailyQuestion` busca schedule del usuario
   - Calcula el día del usuario basado en `run_date` (fecha de registro)
   - Busca schedule con `day_number` correspondiente al día calculado
   - Si no encuentra, intenta crear el schedule automáticamente

**Posibles causas del problema:**

#### A. **Schedule no se crea correctamente**
- Si hay error al insertar schedules (por tipo de dato), el schedule no se crea
- El usuario queda sin schedule y no puede ver preguntas

#### B. **Cálculo incorrecto del día**
- El día se calcula como: `diffDays + 1` donde `diffDays` es la diferencia entre hoy y `run_date`
- Si `run_date` no está correctamente establecido, el cálculo falla

#### C. **Schedule incompleto**
- Si solo se insertaron algunos schedules (menos de 7), el usuario puede no tener schedule para su día actual

#### D. **Problema con la relación de preguntas**
- Si `question_id` no coincide con un ID válido en `r4w_ia_questions`, la relación falla
- La query con `r4w_ia_questions (id, question, options, correct_option)` no devuelve datos

### 3. **Problemas de Validación**

**En `generate-questions/route.ts`:**
- La validación `isNaN(Number(s.question_id))` puede fallar si `question_id` es un UUID string
- No se convierte explícitamente a INTEGER antes de validar

**Solución aplicada:**
- Conversión explícita a INTEGER antes de validar
- Filtrado de schedules inválidos con mejor logging

## ✅ Soluciones Implementadas

### 1. **Conversión de `question_id` a INTEGER**

**Archivo: `app/lib/userSchedule.ts`**
```typescript
// Antes:
const questionsByDay = new Map<number, string>();
questionsByDay.set(q.day_number, q.id);

// Después:
const questionsByDay = new Map<number, number>();
let questionIdNum: number;
if (typeof q.id === 'string') {
  const parsed = parseInt(q.id, 10);
  if (isNaN(parsed)) {
    throw new Error(`question_id debe ser INTEGER, pero se recibió: ${q.id}`);
  }
  questionIdNum = parsed;
} else {
  questionIdNum = Number(q.id);
}
questionsByDay.set(q.day_number, questionIdNum);
```

### 2. **Validación Mejorada en `generate-questions`**

**Archivo: `app/api/admin/generate-questions/route.ts`**
```typescript
// Antes:
const validSchedules = schedules.filter(s => {
  if (!s.question_id || isNaN(Number(s.question_id))) {
    return false;
  }
  return true;
});

// Después:
const validSchedules = schedules.map(s => {
  let questionIdNum: number;
  if (typeof s.question_id === 'string') {
    const parsed = parseInt(s.question_id, 10);
    if (isNaN(parsed)) {
      return null;
    }
    questionIdNum = parsed;
  } else {
    questionIdNum = Number(s.question_id);
  }
  return {
    ...s,
    question_id: questionIdNum, // Asegurar que es INTEGER
  };
}).filter((s): s is NonNullable<typeof s> => s !== null);
```

### 3. **Logging Mejorado**

- Se añadió logging detallado de los schedules que se intentan insertar
- Se detectan específicamente errores de tipo de dato
- Se muestran mensajes de error más informativos

## 🔧 Recomendaciones Adicionales

### 1. **Verificar el Esquema de `r4w_ia_questions`**

Ejecutar en Supabase SQL Editor:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'r4w_ia_questions'
ORDER BY ordinal_position;
```

**Si `id` es UUID:**
- Opción A: Cambiar `r4w_ia_daily_schedule.question_id` a UUID
- Opción B: Usar un campo adicional `question_uuid` y mantener `question_id` como INTEGER

**Si `id` es INTEGER:**
- El código actual debería funcionar correctamente después de las correcciones

### 2. **Verificar Schedules Existentes**

Ejecutar en Supabase SQL Editor:
```sql
-- Verificar schedules del usuario
SELECT 
  id,
  race_type,
  day_number,
  question_id,
  run_date,
  user_id,
  window_start,
  window_end
FROM r4w_ia_daily_schedule
WHERE user_id IS NOT NULL
ORDER BY user_id, day_number;

-- Verificar que todos los question_id existen en r4w_ia_questions
SELECT 
  s.id as schedule_id,
  s.question_id,
  q.id as question_exists
FROM r4w_ia_daily_schedule s
LEFT JOIN r4w_ia_questions q ON s.question_id = q.id
WHERE s.user_id IS NOT NULL
  AND q.id IS NULL; -- Esto mostrará schedules con question_id inválido
```

### 3. **Verificar Preguntas Existentes**

```sql
-- Verificar que existen las 7 preguntas necesarias
SELECT 
  day_number,
  COUNT(*) as count
FROM r4w_ia_questions
WHERE race_type = '7d_mvp'
GROUP BY day_number
ORDER BY day_number;
```

### 4. **Probar el Flujo Completo**

1. **Registrar un nuevo usuario:**
   - Verificar que se crea el schedule correctamente
   - Verificar que tiene los 7 días (1-7)
   - Verificar que todos los `question_id` son válidos

2. **Hacer login:**
   - Verificar que el schedule existe
   - Verificar que se puede acceder a `/pregunta`

3. **Acceder a `/pregunta`:**
   - Verificar que se carga la pregunta del día correcto
   - Verificar que la pregunta tiene opciones y respuesta correcta

## 📊 Flujo Esperado

```
Usuario se registra
  ↓
Se crea perfil en r4w_profiles
  ↓
Se llama a createUserScheduleFor7dMvp(userId)
  ↓
Se obtienen las 7 preguntas de r4w_ia_questions
  ↓
Se crean 7 schedules con:
  - race_type: '7d_mvp'
  - day_number: 1-7
  - question_id: INTEGER (convertido si es necesario)
  - run_date: fecha de registro (igual para todos)
  - window_start: '00:00:00'
  - window_end: '23:59:59'
  - user_id: userId
  ↓
Usuario accede a /pregunta
  ↓
useDailyQuestion calcula:
  - diffDays = días transcurridos desde run_date
  - userDay = diffDays + 1
  - targetDay = min(max(userDay, 1), 7)
  ↓
Busca schedule con:
  - race_type = '7d_mvp'
  - user_id = userId
  - day_number = targetDay
  ↓
Si encuentra, carga la pregunta relacionada
Si no encuentra, intenta crear el schedule
```

## 🐛 Debugging

Si el problema persiste, revisar:

1. **Logs del servidor:**
   - Buscar "Error insertando schedules"
   - Ver el detalle del error (mensaje, código, hint)

2. **Logs del cliente:**
   - Abrir DevTools → Console
   - Buscar logs de `useDailyQuestion`
   - Verificar cálculos de día del usuario

3. **Base de datos:**
   - Verificar que existen las 7 preguntas
   - Verificar que los schedules se crearon correctamente
   - Verificar que los `question_id` son válidos

## ✅ Estado Actual

- ✅ Conversión de `question_id` a INTEGER implementada
- ✅ Validación mejorada en `generate-questions`
- ✅ Logging detallado añadido
- ✅ Manejo de errores mejorado
- ⚠️ **Pendiente:** Verificar el esquema real de `r4w_ia_questions.id`
- ⚠️ **Pendiente:** Probar el flujo completo con un usuario nuevo

