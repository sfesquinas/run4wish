# Cómo ejecutar /api/admin/generate-questions

Esta API carga las 7 preguntas predefinidas desde el archivo `questions_7d_mvp.json` y las guarda en Supabase.

## Opción 1: Desde el navegador (recomendado)

1. **Inicia sesión** en tu aplicación Run4Wish
2. Abre la **consola del navegador** (F12 o clic derecho → Inspeccionar → Console)
3. Ejecuta este código JavaScript:

```javascript
fetch('/api/admin/generate-questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Resultado:', data);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

## Opción 2: Desde la terminal con curl

```bash
curl -X POST http://localhost:3000/api/admin/generate-questions \
  -H "Content-Type: application/json" \
  -H "Cookie: tu-cookie-de-sesion"
```

**Nota:** Necesitas estar autenticado. Si estás en desarrollo, la verificación de admin está deshabilitada.

## Opción 3: Desde Postman o similar

1. Método: `POST`
2. URL: `http://localhost:3000/api/admin/generate-questions` (o tu URL de producción)
3. Headers:
   - `Content-Type: application/json`
4. Body: (vacío, no necesita body)
5. Asegúrate de estar autenticado (cookies de sesión)

## Requisitos

- ✅ Debes estar **autenticado** en la aplicación
- ✅ Debe existir el archivo `questions_7d_mvp.json` en la raíz del proyecto
- ✅ La aplicación debe estar corriendo (`npm run dev`)

## Qué hace esta API

1. Lee las 7 preguntas predefinidas desde el archivo `questions_7d_mvp.json`
2. Guarda las preguntas en la tabla `r4w_ia_questions`
3. Crea los schedules para los próximos 7 días
4. Cada pregunta tiene:
   - `day_number`: 1-7
   - `race_type`: "7d_mvp"
   - `question`: texto de la pregunta
   - `options`: array de opciones
   - `correct_option`: opción correcta
   - `category`: categoría de la pregunta
   - `difficulty`: nivel de dificultad

## Verificar que funcionó

Después de ejecutar, verifica en Supabase:

```sql
SELECT 
  day_number,
  question,
  options,
  correct_option
FROM r4w_ia_questions
WHERE race_type = '7d_mvp'
ORDER BY day_number;
```

Deberías ver 7 preguntas, una para cada día del 1 al 7.

