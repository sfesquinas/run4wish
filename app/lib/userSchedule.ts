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
 * Crea un schedule completo de 7 días para un usuario en la carrera 7d_mvp
 * Cada día tiene slot_number = 1 (una pregunta por día)
 * @param userId ID del usuario
 */
export async function createUserScheduleFor7dMvp(userId: string): Promise<void> {
  try {
    console.log(`📅 Creando schedule de 7 días para usuario ${userId}...`);

    // 1) Obtener o generar preguntas para los 7 días
    // Primero intentamos obtener preguntas existentes sin asignar
    const { data: existingQuestions, error: questionsError } = await supabase
      .from("r4w_ia_questions")
      .select("id")
      .limit(7);

    if (questionsError) {
      console.error("Error obteniendo preguntas:", questionsError);
      throw new Error(`Error obteniendo preguntas: ${questionsError.message}`);
    }

    if (!existingQuestions || existingQuestions.length < 7) {
      console.warn(`⚠️ Solo hay ${existingQuestions?.length || 0} preguntas disponibles. Se necesitan 7.`);
      // En producción, aquí podrías llamar al endpoint de generar preguntas
      // Por ahora, lanzamos un error
      throw new Error("No hay suficientes preguntas disponibles. Ejecuta /api/admin/generate-questions primero.");
    }

    // 2) Calcular la fecha de inicio (hoy es el día 1)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // 3) Crear los 7 schedules (uno para cada día)
    const schedules = [];
    for (let day = 1; day <= 7; day++) {
      const runDate = new Date(today);
      runDate.setDate(today.getDate() + (day - 1));
      const runDateStr = `${runDate.getFullYear()}-${String(runDate.getMonth() + 1).padStart(2, "0")}-${String(runDate.getDate()).padStart(2, "0")}`;

      // Usar una pregunta diferente para cada día (rotación)
      const questionIndex = (day - 1) % existingQuestions.length;
      const questionId = existingQuestions[questionIndex].id;

      schedules.push({
        race_type: "7d_mvp",
        user_id: userId,
        day_number: day,
        run_date: runDateStr,
        window_start: "00:00:00",
        window_end: "23:59:59",
        question_id: questionId,
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
