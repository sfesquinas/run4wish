// app/lib/userSchedule.ts
// Funciones para crear y gestionar schedules de usuario

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Baraja un array usando el algoritmo Fisher-Yates
 * @param array Array a barajar
 * @returns Nuevo array barajado
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Crea un schedule completo de 7 días para un usuario en la carrera 7d_mvp
 * Cada día tiene slot_number = 1 (una pregunta por día)
 * Usa preguntas de r4w_question_bank (igual que 24h_sprint)
 * @param userId ID del usuario
 */
export async function createUserScheduleFor7dMvp(userId: string): Promise<void> {
  try {
    console.log(`📅 Creando schedule de 7 días para usuario ${userId}...`);

    // 1) Obtener preguntas del banco r4w_question_bank
    const { data: questions, error: questionsError } = await supabase
      .from("r4w_question_bank")
      .select("id")
      .limit(100); // Obtener más de las necesarias para tener opciones

    if (questionsError) {
      console.error("❌ Error obteniendo preguntas del banco:", {
        message: questionsError.message,
        details: questionsError.details,
        hint: questionsError.hint,
        code: questionsError.code,
      });
      throw new Error(`Error obteniendo preguntas del banco: ${questionsError.message}`);
    }

    if (!questions || questions.length < 7) {
      console.error(`❌ No hay suficientes preguntas en r4w_question_bank. Se necesitan al menos 7, hay ${questions?.length || 0}`);
      throw new Error(`No hay suficientes preguntas en el banco. Se necesitan al menos 7, hay ${questions?.length || 0}`);
    }

    // 2) Seleccionar 7 preguntas distintas de forma aleatoria
    const shuffledQuestions = shuffleArray(questions);
    const selectedQuestions = shuffledQuestions.slice(0, 7);

    console.log("🧩 Creando schedule 7d_mvp desde r4w_question_bank", {
      userId,
      questionIds: selectedQuestions.map(q => q.id),
      totalQuestionsAvailable: questions.length,
    });

    // 3) Calcular la fecha de inicio (hoy es el día 1)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // 4) Crear los 7 schedules (uno para cada día)
    // IMPORTANTE: Para 7d_mvp ahora usamos bank_question_id (FK a r4w_question_bank)
    // Dejamos question_id en NULL (compatibilidad con estructura existente)
    const schedules = [];
    for (let day = 1; day <= 7; day++) {
      const runDate = new Date(today);
      runDate.setDate(today.getDate() + (day - 1));
      const runDateStr = `${runDate.getFullYear()}-${String(runDate.getMonth() + 1).padStart(2, "0")}-${String(runDate.getDate()).padStart(2, "0")}`;

      // Cada día usa una pregunta distinta del banco (sin repetir)
      const bankQuestionId = selectedQuestions[day - 1].id;

      schedules.push({
        race_type: "7d_mvp",
        user_id: userId,
        day_number: day,
        run_date: runDateStr,
        window_start: "00:00:00",
        window_end: "23:59:59",
        question_id: null, // NULL para 7d_mvp (ahora usamos bank_question_id)
        bank_question_id: bankQuestionId, // FK a r4w_question_bank
        slot_number: 1, // Para 7d_mvp, siempre slot_number = 1
      });
    }

    // 4) Eliminar schedules existentes del usuario para esta carrera (si los hay)
    const { error: deleteError } = await supabase
      .from("r4w_ia_daily_schedule")
      .delete()
      .eq("race_type", "7d_mvp")
      .eq("user_id", userId);

    if (deleteError && deleteError.code !== "PGRST116") {
      console.warn("⚠️ Error eliminando schedules antiguos (continuando):", deleteError.message);
    }

    // 5) Insertar los nuevos schedules
    const { error: insertError } = await supabase
      .from("r4w_ia_daily_schedule")
      .insert(schedules);

    if (insertError) {
      console.error("❌ Error insertando schedules:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      throw new Error(`Error insertando schedules: ${insertError.message}`);
    }

    console.log(`✅ Schedule de 7 días creado correctamente para usuario ${userId}`);
  } catch (error: any) {
    console.error("❌ Error en createUserScheduleFor7dMvp:", error);
    throw error;
  }
}
