// app/api/admin/generate-questions/route.ts
// Endpoint para generar preguntas usando OpenAI y guardarlas en Supabase
// PROTEGIDO: Solo accesible para administradores

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { IA_QUESTION_MASTER_PROMPT } from "../../../lib/aiPrompts";
import { verifyAdminAuth } from "../../../lib/authHelpers";

// Cliente de Supabase (server-side) para operaciones de base de datos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cliente de OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error("Falta la variable de entorno OPENAI_API_KEY");
}

const openai = new OpenAI({
  apiKey: openaiApiKey,
});

/**
 * Genera una hora aleatoria entre 09:00 y 20:00 (para que window_end no pase de 21:00)
 */
function generateRandomTimeWindow(): { start: string; end: string } {
  const startHour = Math.floor(Math.random() * 12) + 9; // 9-20
  const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  
  const start = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;
  
  // window_end es 1 hora después
  const endHour = startHour + 1;
  const end = `${String(endHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;
  
  return { start, end };
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

export async function POST(request: NextRequest) {
  try {
    // 🔒 Verificar autenticación y permisos de administrador
    if (process.env.NODE_ENV !== "production") {
      console.log("[IA ADMIN] Modo desarrollo: saltando verificación de admin");
    } else {
      const auth = await verifyAdminAuth(request);

      if (!auth.ok) {
        if ("error" in auth && auth.error === "not_authenticated") {
          console.log("[IA ADMIN] not_authenticated en generate-questions");
          return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
        }

        if ("error" in auth && auth.error === "forbidden") {
          console.log("[IA ADMIN] forbidden en generate-questions", "email" in auth ? auth.email : undefined);
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        // Fallback
        console.log("[IA ADMIN] not_authenticated en generate-questions (fallback)");
        return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
      }

      const adminEmail = "email" in auth ? auth.email : undefined;
      console.log("[IA ADMIN] acceso permitido a generate-questions", adminEmail);
      console.log(`🚀 Iniciando generación de preguntas con IA... (Admin: ${adminEmail})`);
    }

    // 1. Llamar a OpenAI
    console.log("📝 Llamando a OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Usa gpt-4o-mini para costos más bajos, o gpt-4o si prefieres mejor calidad
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
      temperature: 0.8, // Creatividad moderada
      response_format: { type: "json_object" }, // Forzar JSON (debe ser un objeto, no array)
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("OpenAI no devolvió contenido");
    }

    // Parsear la respuesta de OpenAI
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (e) {
      // Si la respuesta no es JSON puro, intentar extraer el JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se pudo parsear la respuesta de OpenAI como JSON");
      }
    }

    // OpenAI con json_object devuelve un objeto, no un array directamente
    const questions = parsedResponse.questions || (Array.isArray(parsedResponse) ? parsedResponse : []);
    if (!Array.isArray(questions) || questions.length !== 7) {
      throw new Error(`Se esperaban 7 preguntas, se recibieron ${questions.length}`);
    }

    console.log(`✅ OpenAI generó ${questions.length} preguntas`);

    // 2. Insertar preguntas en r4w_ia_questions
    console.log("💾 Insertando preguntas en Supabase...");
    const insertedQuestions: Array<{ id: string; day_number: number }> = [];

    for (const q of questions) {
      // Validar estructura
      if (!q.day_number || !q.question || !q.options || !q.correct_option || !q.category || !q.difficulty) {
        console.warn(`⚠️ Pregunta día ${q.day_number} tiene campos faltantes, saltando...`);
        continue;
      }

      // Insertar pregunta
      const { data, error } = await supabase
        .from("r4w_ia_questions")
        .insert({
          race_type: "7d_mvp",
          day_number: q.day_number,
          question: q.question,
          options: q.options, // JSONB se maneja automáticamente
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
      console.log(`✅ Pregunta día ${q.day_number} insertada (ID: ${data.id})`);
    }

    if (insertedQuestions.length === 0) {
      throw new Error("No se pudo insertar ninguna pregunta");
    }

    // 3. Crear schedules para los próximos 7 días
    console.log("📅 Creando schedules para los próximos 7 días...");
    const next7Days = getNext7Days();
    const schedules: Array<{
      race_type: string;
      day_number: number;
      question_id: string;
      run_date: string;
      window_start: string;
      window_end: string;
    }> = [];

    for (let i = 0; i < insertedQuestions.length; i++) {
      const question = insertedQuestions[i];
      const runDate = next7Days[i];
      const timeWindow = generateRandomTimeWindow();

      schedules.push({
        race_type: "7d_mvp",
        day_number: question.day_number,
        question_id: question.id,
        run_date: runDate,
        window_start: timeWindow.start,
        window_end: timeWindow.end,
      });
    }

    // Insertar todos los schedules
    const { data: insertedSchedules, error: scheduleError } = await supabase
      .from("r4w_ia_daily_schedule")
      .insert(schedules)
      .select();

    if (scheduleError) {
      console.error("❌ Error insertando schedules:", scheduleError);
      throw new Error(`Error insertando schedules: ${scheduleError.message}`);
    }

    console.log(`✅ ${insertedSchedules?.length || 0} schedules insertados`);

    // 4. Generar resumen
    console.log("\n📊 RESUMEN DE PREGUNTAS GENERADAS:\n");
    for (let i = 0; i < insertedQuestions.length; i++) {
      const question = questions[i];
      const schedule = schedules[i];
      console.log(`Día ${question.day_number}:`);
      console.log(`  Categoría: ${question.category}`);
      console.log(`  Business Tag: ${question.business_tag || "null"}`);
      console.log(`  Dificultad: ${question.difficulty}`);
      console.log(`  Ventana: ${schedule.window_start.slice(0, 5)} - ${schedule.window_end.slice(0, 5)}`);
      console.log(`  Fecha: ${schedule.run_date}`);
      console.log(`  Pregunta: ${question.question.substring(0, 60)}...`);
      console.log("");
    }

    return NextResponse.json({
      success: true,
      message: `Se generaron ${insertedQuestions.length} preguntas y ${insertedSchedules?.length || 0} schedules`,
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
    console.error("❌ Error en generate-questions:", error);
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
    message: "Endpoint de generación de preguntas con IA",
    method: "POST",
    description: "Envía un POST a este endpoint para generar 7 preguntas y sus schedules",
  });
}

