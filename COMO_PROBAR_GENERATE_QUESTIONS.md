# Cómo Probar el Endpoint /api/admin/generate-questions

El endpoint ahora tiene dos modos: **IA (Groq)** y **Fallback (sin IA)**.

## Modo IA (Groq)

Se activa cuando Groq responde correctamente.

### Cómo probar que funciona:

1. **Asegúrate de tener `GROQ_API_KEY` configurada** en `.env.local`:
   ```env
   GROQ_API_KEY=sk-proj-LNhOiPOBCxgOMF5y9mQRM7ELmujSZqPD
   ```

2. **Ejecuta el endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/generate-questions \
     -H "Content-Type: application/json"
   ```

   O desde el navegador (consola):
   ```javascript
   fetch('/api/admin/generate-questions', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
     .then(r => r.json())
     .then(data => {
       console.log('Modo usado:', data.mode); // Debe ser "ia"
       console.log('Respuesta:', data);
     });
   ```

3. **Verifica la respuesta:**
   - `mode: "ia"` ✅
   - `success: true`
   - `questionsCount: 7`
   - Las preguntas son generadas por Groq (variadas, creativas)

## Modo Fallback (sin IA)

Se activa automáticamente cuando Groq falla (error de API, sin cuota, sin conexión, etc.).

### Cómo probar que funciona:

**Opción 1: Desactivar temporalmente la API key**
1. En `.env.local`, comenta o cambia la API key:
   ```env
   GROQ_API_KEY=invalid_key_for_testing
   ```

2. Ejecuta el endpoint (mismo comando que arriba)

3. **Verifica la respuesta:**
   - `mode: "fallback"` ✅
   - `success: true`
   - `questionsCount: 7`
   - Las preguntas son las fijas predefinidas (días de la semana, números básicos)

**Opción 2: Simular error en el código (temporal)**
En `app/api/admin/generate-questions/route.ts`, línea 253, añade antes del try:
```typescript
throw new Error("Simulando error de Groq para probar fallback");
```

Luego ejecuta el endpoint y verifica que use `mode: "fallback"`.

## Verificación en Base de Datos

Después de ejecutar el endpoint, verifica en Supabase:

```sql
-- Ver las preguntas insertadas
SELECT 
  day_number,
  question,
  options,
  correct_option,
  category,
  difficulty
FROM r4w_ia_questions
WHERE race_type = '7d_mvp'
ORDER BY day_number;

-- Verificar que todas tienen 3 opciones
SELECT 
  day_number,
  jsonb_array_length(options) as num_opciones
FROM r4w_ia_questions
WHERE race_type = '7d_mvp';
```

## Características del Fallback

Las preguntas de fallback son:
- ✅ Siempre 3 opciones
- ✅ 1 opción correcta (texto exacto)
- ✅ `race_type = '7d_mvp'`
- ✅ `day_number` del 1 al 7
- ✅ Compatibles con toda la lógica existente

## Logs en Consola

Cuando ejecutes el endpoint, verás en la consola del servidor:

**Modo IA:**
```
📝 Llamando a Groq...
✅ Groq generó 7 preguntas válidas
```

**Modo Fallback:**
```
📝 Llamando a Groq...
⚠️ Error con Groq, activando modo fallback: [mensaje de error]
✅ Preguntas de fallback insertadas correctamente
```


