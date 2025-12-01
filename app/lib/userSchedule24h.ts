// app/lib/userSchedule24h.ts
// Funciones para crear y gestionar schedules de carrera 24h_sprint

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Obtiene el slot_number basado en la hora actual
 * Slot 1: 09:00-10:00
 * Slot 2: 10:00-11:00
 * ...
 * Slot 12: 20:00-21:00
 * @param currentHour Hora actual (0-23)
 * @returns slot_number (1-12) o null si está fuera del rango
 */
export function getSlotNumberFromHour(currentHour: number): number | null {
  // Rango válido: 09:00 (9) a 21:00 (20)
  if (currentHour >= 9 && currentHour < 21) {
    return currentHour - 8; // 9 -> 1, 10 -> 2, ..., 20 -> 12
  }
  return null; // Fuera del rango
}

/**
 * Obtiene la ventana horaria para un slot_number dado
 * @param slotNumber Slot (1-12)
 * @returns Objeto con window_start y window_end en formato HH:00:00
 */
export function getWindowForSlot(slotNumber: number): { window_start: string; window_end: string } {
  if (slotNumber < 1 || slotNumber > 12) {
    throw new Error(`slot_number debe estar entre 1 y 12, recibido: ${slotNumber}`);
  }

  const startHour = slotNumber + 8; // 1 -> 9, 2 -> 10, ..., 12 -> 20
  const endHour = startHour + 1;

  return {
    window_start: `${String(startHour).padStart(2, "0")}:00:00`,
    window_end: `${String(endHour).padStart(2, "0")}:00:00`,
  };
}

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
 * Crea un schedule completo de 12 slots (09:00-21:00) para un usuario en la carrera 24h_sprint
 * @param userId ID del usuario
 * @param runDate Fecha de inicio de la carrera (formato YYYY-MM-DD o Date). Si no se proporciona, usa hoy
 * @returns Promise<boolean> - true si se creó correctamente, false si ya existía o hubo error
 */
export async function createUserScheduleFor24h(
  userId: string,
  runDate?: string | Date
): Promise<boolean> {
  try {
    // 1) Determinar la fecha de inicio (solo fecha, sin hora)
    let targetDate: string;
    if (runDate instanceof Date) {
      targetDate = `${runDate.getFullYear()}-${String(runDate.getMonth() + 1).padStart(2, "0")}-${String(runDate.getDate()).padStart(2, "0")}`;
    } else if (runDate) {
      targetDate = runDate;
    } else {
      const today = new Date();
      targetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }

    console.log(`📅 Creando schedule 24h_sprint para usuario ${userId}, fecha: ${targetDate}`);

    // 2) Verificar si ya existe un schedule para este usuario y fecha
    const { data: existingSchedule, error: checkError } = await supabase
      .from("r4w_ia_daily_schedule")
      .select("id")
      .eq("race_type", "24h_sprint")
      .eq("user_id", userId)
      .eq("run_date", targetDate)
      .limit(1)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error verificando schedule existente:", {
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
        code: checkError.code,
      });
      return false;
    }

    if (existingSchedule) {
      console.log(`ℹ️ El usuario ${userId} ya tiene un schedule para ${targetDate}. No se crea duplicado.`);
      return true; // Ya existe, retornar true
    }

    // 3) Obtener preguntas del banco r4w_question_bank
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
      return false;
    }

    if (!questions || questions.length < 12) {
      console.error(`❌ No hay suficientes preguntas en r4w_question_bank. Se necesitan al menos 12, hay ${questions?.length || 0}`);
      return false;
    }

    // 4) Seleccionar 12 preguntas distintas de forma aleatoria
    const shuffledQuestions = shuffleArray(questions);
    const selectedQuestions = shuffledQuestions.slice(0, 12);

    console.log(`✅ Seleccionadas ${selectedQuestions.length} preguntas del banco`);

    // 5) Crear los 12 schedules (uno para cada slot)
    // IMPORTANTE: Para 24h_sprint usamos bank_question_id (FK a r4w_question_bank)
    // NO usamos question_id (que es FK a r4w_ia_questions para 7d_mvp)
    const schedules = [];
    for (let slot = 1; slot <= 12; slot++) {
      const bankQuestionId = selectedQuestions[slot - 1].id;
      const { window_start, window_end } = getWindowForSlot(slot);

      schedules.push({
        race_type: "24h_sprint",
        user_id: userId,
        day_number: 1, // Todas las preguntas son del mismo día
        run_date: targetDate, // SOLO la fecha
        window_start: window_start, // 09:00, 10:00, ... 20:00
        window_end: window_end, // 10:00, 11:00, ... 21:00
        question_id: null, // SIEMPRE null en 24h
        bank_question_id: bankQuestionId, // FK a r4w_question_bank
        slot_number: slot, // 1..12
      });
    }

    // 6) Insertar los schedules
    const { error: insertError } = await supabase
      .from("r4w_ia_daily_schedule")
      .insert(schedules);

    if (insertError) {
      console.error("❌ Error creando schedules 24h", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        insertError,
      });
      return false;
    }

    console.log(`✅ Schedules 24h_sprint creados para ${userId}`);
    return true;
  } catch (error: any) {
    console.error("❌ Excepción en createUserScheduleFor24h:", {
      message: error?.message || String(error),
      stack: error?.stack,
    });
    return false;
  }
}
