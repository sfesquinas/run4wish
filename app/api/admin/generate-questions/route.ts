// app/api/admin/generate-questions/route.ts
// Endpoint para generar preguntas usando Groq y guardarlas en Supabase
// PROTEGIDO: Solo accesible para administradores

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminAuth } from "../../../lib/authHelpers";
import { groq } from "../../../lib/groqClient";
import { IA_QUESTION_MASTER_PROMPT } from "../../../lib/aiPrompts";

// Cliente de Supabase (server-side) para operaciones de base de datos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Genera una hora aleatoria entre 09:00 y 20:00 (para que window_end no pase de 21:00)
 * Asegura que window_end > window_start para cumplir con el constraint de la base de datos
 */
function generateRandomTimeWindow(): { start: string; end: string } {
  // Ventana completa del día: 00:00:00 - 23:59:59
  // Todas las preguntas están disponibles durante todo el día
  return { 
    start: "00:00:00", 
    end: "23:59:59" 
  };
}

/**
 * Obtiene la fecha de mañana y los siguientes 6 días
 */
function getNext7Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    dates.push(dateStr);
  }
  
  return dates;
}

/**
 * Preguntas fijas de fallback (sin IA)
 * Se usan cuando Groq falla o no está disponible
 */
const FALLBACK_QUESTIONS = [
  {
    day_number: 1,
    question: "¿Cuál es el día que va justo después del lunes?",
    options: ["Domingo", "Martes", "Viernes"],
    correct_option: "Martes",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
  {
    day_number: 2,
    question: "¿Cuál es el número que va justo antes del 10?",
    options: ["8", "9", "11"],
    correct_option: "9",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
  {
    day_number: 3,
    question: "Si hoy es miércoles, ¿qué día fue ayer?",
    options: ["Martes", "Jueves", "Lunes"],
    correct_option: "Martes",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
  {
    day_number: 4,
    question: "¿Cuántos minutos tiene una hora?",
    options: ["30", "60", "90"],
    correct_option: "60",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
  {
    day_number: 5,
    question: "¿Cuál es el número que sigue después del 99?",
    options: ["100", "101", "90"],
    correct_option: "100",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
  {
    day_number: 6,
    question: "¿Cuál es el día que está entre martes y jueves?",
    options: ["Lunes", "Miércoles", "Viernes"],
    correct_option: "Miércoles",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
  {
    day_number: 7,
    question: "¿Cuánto son 2 + 2?",
    options: ["3", "4", "5"],
    correct_option: "4",
    category: "engagement",
    business_tag: null,
    difficulty: "muy_facil",
  },
];

/**
 * Inserta las preguntas de fallback en Supabase
 * Modo fallback sin IA
 */
async function insertFallbackQuestionsFor7dMvp(): Promise<Array<{ id: string; day_number: number }>> {
  // Eliminar preguntas anteriores de la carrera 7d_mvp
  const { error: deleteError } = await supabase
    .from("r4w_ia_questions")
    .delete()
    .eq("race_type", "7d_mvp");

  if (deleteError) {
    console.warn("⚠️ Error eliminando preguntas anteriores (continuando):", deleteError.message);
  }

  // Insertar las 7 preguntas fijas
  const insertedQuestions: Array<{ id: string; day_number: number }> = [];

  for (const q of FALLBACK_QUESTIONS) {
    const { data, error } = await supabase
      .from("r4w_ia_questions")
      .insert({
        race_type: "7d_mvp",
        day_number: q.day_number,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        category: q.category,
        business_tag: q.business_tag,
        difficulty: q.difficulty,
      })
      .select("id, day_number")
      .single();

    if (error) {
      console.error(`❌ Error insertando pregunta fallback día ${q.day_number}:`, error.message);
      continue;
    }

    insertedQuestions.push({ id: data.id, day_number: data.day_number });
  }

  if (insertedQuestions.length === 0) {
    throw new Error("No se pudo insertar ninguna pregunta de fallback");
  }

  return insertedQuestions;
}

/**
 * Inserta preguntas generadas por IA en Supabase
 * Modo IA (Groq)
 */
async function insertAIQuestions(questions: any[]): Promise<Array<{ id: string; day_number: number }>> {
  const insertedQuestions: Array<{ id: string; day_number: number }> = [];

  for (const q of questions) {
    // Validar estructura
    if (!q.day_number || !q.question || !q.options || !q.correct_option || !q.category || !q.difficulty) {
      console.warn(`⚠️ Pregunta día ${q.day_number} tiene campos faltantes, saltando...`);
      continue;
    }

    // Asegurar que options tenga exactamente 3 opciones
    if (!Array.isArray(q.options) || q.options.length !== 3) {
      console.warn(`⚠️ Pregunta día ${q.day_number} no tiene 3 opciones, saltando...`);
      continue;
    }

    // Insertar pregunta
    const { data, error } = await supabase
      .from("r4w_ia_questions")
      .insert({
        race_type: "7d_mvp",
        day_number: q.day_number,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        category: q.category,
        business_tag: q.business_tag || null,
        difficulty: q.difficulty,
      })
      .select("id, day_number")
      .single();

    if (error) {
      console.error(`❌ Error insertando pregunta día ${q.day_number}:`, error.message);
      continue;
    }

    insertedQuestions.push({ id: data.id, day_number: data.day_number });
  }

  if (insertedQuestions.length === 0) {
    throw new Error("No se pudo insertar ninguna pregunta");
  }

  return insertedQuestions;
}

export async function POST(request: NextRequest) {
  let mode: "ia" | "fallback" = "ia";
  let insertedQuestions: Array<{ id: string; day_number: number }> = [];
  let questions: any[] = [];

  try {
    // 🔒 Verificar autenticación y permisos de administrador
    if (process.env.NODE_ENV !== "production") {
      console.log("[IA ADMIN] Modo desarrollo: saltando verificación de admin");
    } else {
      const auth = await verifyAdminAuth(request);

      if (!auth.ok) {
        if ("error" in auth && auth.error === "not_authenticated") {
          return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
        }

        if ("error" in auth && auth.error === "forbidden") {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
      }
    }

    // ============================================
    // Modo IA (Groq)
    // ============================================
    try {
      console.log("📝 Llamando a Groq...");
      const completion = await groq.chat.completions.create({
        model: "llama3-8b-instant",
        messages: [
          {
            role: "system",
            content: "Eres un generador experto de preguntas para aplicaciones gamificadas. Siempre respondes con JSON válido, sin texto adicional.",
          },
          {
            role: "user",
            content: IA_QUESTION_MASTER_PROMPT,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error("Groq no devolvió contenido");
      }

      // Parsear la respuesta de Groq
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (e) {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No se pudo parsear la respuesta de Groq como JSON");
        }
      }

      // Groq con json_object devuelve un objeto, no un array directamente
      questions = parsedResponse.questions || (Array.isArray(parsedResponse) ? parsedResponse : []);
      if (!Array.isArray(questions) || questions.length !== 7) {
        throw new Error(`Se esperaban 7 preguntas, se recibieron ${questions.length}`);
      }

      // Validar que todas las preguntas tengan 3 opciones
      const invalidQuestions = questions.filter((q: any) => !Array.isArray(q.options) || q.options.length !== 3);
      if (invalidQuestions.length > 0) {
        throw new Error(`Algunas preguntas no tienen exactamente 3 opciones`);
      }

      console.log(`✅ Groq generó ${questions.length} preguntas válidas`);
      mode = "ia";

      // Insertar preguntas generadas por IA
      insertedQuestions = await insertAIQuestions(questions);
    } catch (groqError: any) {
      // ============================================
      // Modo fallback sin IA
      // ============================================
      console.warn("⚠️ Error con Groq, activando modo fallback:", groqError.message);
      mode = "fallback";
      questions = FALLBACK_QUESTIONS;
      insertedQuestions = await insertFallbackQuestionsFor7dMvp();
      console.log("✅ Preguntas de fallback insertadas correctamente");
    }

    // Crear schedules para los próximos 7 días
    const next7Days = getNext7Days();
    const schedules: Array<{
      race_type: string;
      day_number: number;
      question_id: string; // UUID (string) según el esquema de la BD
      run_date: string;
      window_start: string;
      window_end: string;
      user_id: null;
    }> = [];

    for (let i = 0; i < insertedQuestions.length; i++) {
      const question = insertedQuestions[i];
      const runDate = next7Days[i];
      const timeWindow = generateRandomTimeWindow();

      // Usar question_id tal como viene de Supabase (UUID string)
      if (!question.id || typeof question.id !== 'string') {
        console.error(`❌ Error: question_id inválido para día ${question.day_number}: ${question.id}`);
        continue;
      }

      schedules.push({
        race_type: "7d_mvp",
        day_number: question.day_number,
        question_id: question.id, // UUID (string)
        run_date: runDate,
        window_start: timeWindow.start,
        window_end: timeWindow.end,
        user_id: null, // Schedule global (sin usuario específico)
      });
    }

    // Validar que todos los schedules tengan datos válidos antes de insertar
    const validSchedules = schedules.map(s => {
      // Validar que question_id es UUID (string)
      if (!s.question_id || typeof s.question_id !== 'string') {
        console.error(`❌ Schedule inválido para día ${s.day_number}: question_id debe ser UUID (string), recibido: ${s.question_id} (tipo: ${typeof s.question_id})`);
        return null;
      }
      
      // Validar formato UUID básico (opcional, pero recomendado)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(s.question_id)) {
        console.warn(`⚠️ Schedule para día ${s.day_number}: question_id no tiene formato UUID estándar: ${s.question_id}, pero se usará de todas formas`);
      }
      
      if (s.window_end <= s.window_start) {
        console.error(`❌ Schedule inválido para día ${s.day_number}: window_end (${s.window_end}) debe ser mayor que window_start (${s.window_start})`);
        return null;
      }
      
      return s;
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    if (validSchedules.length === 0) {
      throw new Error("No hay schedules válidos para insertar");
    }

    // Insertar todos los schedules
    const { data: insertedSchedules, error: scheduleError } = await supabase
      .from("r4w_ia_daily_schedule")
      .insert(validSchedules)
      .select();

    if (scheduleError) {
      console.error("❌ Error insertando schedules:");
      console.error("Mensaje:", scheduleError.message);
      console.error("Detalles:", scheduleError.details);
      console.error("Hint:", scheduleError.hint);
      console.error("Código:", scheduleError.code);
      console.error("Schedules que se intentaron insertar:", JSON.stringify(validSchedules, null, 2));
      
      // Verificar si el error es por tipo de dato incorrecto
      if (scheduleError.message?.includes("question_id") || scheduleError.message?.includes("invalid input") || scheduleError.message?.includes("syntax") || scheduleError.message?.includes("uuid")) {
        throw new Error(`Error de tipo de dato en question_id. Verifica que r4w_ia_daily_schedule.question_id sea UUID y coincida con r4w_ia_questions.id. Detalles: ${scheduleError.message}`);
      }
      
      throw new Error(`Error insertando schedules: ${scheduleError.message || scheduleError.code || "Error desconocido"}`);
    }

    // Respuesta exitosa (siempre 200 OK, tanto para IA como fallback)
    return NextResponse.json({
      success: true,
      mode: mode,
      message: mode === "ia" 
        ? `Se generaron ${insertedQuestions.length} preguntas con Groq y ${insertedSchedules?.length || 0} schedules`
        : `Se insertaron ${insertedQuestions.length} preguntas de fallback y ${insertedSchedules?.length || 0} schedules`,
      questionsCount: insertedQuestions.length,
      schedulesCount: insertedSchedules?.length || 0,
      summary: questions.map((q: any, i: number) => ({
        day: q.day_number,
        category: q.category,
        window: `${schedules[i].window_start.slice(0, 5)} - ${schedules[i].window_end.slice(0, 5)}`,
        date: schedules[i].run_date,
        question: q.question.substring(0, 60) + "...",
      })),
    });
  } catch (error: any) {
    console.error("❌ Error crítico en generate-questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// GET para verificar que el endpoint funciona
export async function GET() {
  return NextResponse.json({
    message: "Endpoint de generación de preguntas con Groq",
    method: "POST",
    description: "Envía un POST a este endpoint para generar 7 preguntas con Groq y crear sus schedules",
  });
}

