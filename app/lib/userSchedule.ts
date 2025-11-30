// app/lib/userSchedule.ts
// Helpers para crear y gestionar schedules personalizados por usuario

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

// Cliente server-side para operaciones de base de datos
// Usamos SERVICE_ROLE_KEY si está disponible para tener permisos completos
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const RACE_TYPE = "7d_mvp";

/**
 * Genera una hora aleatoria entre minHour y maxHour (redondeada a cuartos de hora)
 */
function generateRandomTimeWindow(minHour: number = 9, maxHour: number = 20): { start: string; end: string } {
  const startHour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
  const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  
  const start = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;
  
  // window_end es 1 hora después
  const endHour = startHour + 1;
  const end = `${String(endHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;
  
  return { start, end };
}

/**
 * Redondea la hora actual hacia abajo al minuto (sin segundos)
 */
function roundDownToMinute(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

/**
 * Calcula window_end para el día 1: hora actual + 2 horas, máximo 21:00
 */
function calculateDay1WindowEnd(currentTime: string): string {
  const [hours, minutes] = currentTime.split(":").map(Number);
  let endHour = hours + 2;
  
  // Limitar a 21:00 máximo
  if (endHour > 21) {
    endHour = 21;
  }
  
  return `${String(endHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

/**
 * Crea un schedule personalizado de 7 días para un usuario en la carrera 7d_mvp
 * Solo se aplica si el usuario no tiene ya un schedule creado
 */
export async function createUserScheduleFor7dMvp(userId: string): Promise<void> {
  try {
    console.log(`🔄 Iniciando creación de schedule para usuario ${userId}...`);
    
    // 1. Verificar si ya existe un schedule personalizado completo para este usuario
    const { data: existingSchedules, error: checkError } = await supabase
      .from("r4w_ia_daily_schedule")
      .select("id, day_number")
      .eq("race_type", RACE_TYPE)
      .eq("user_id", userId);

    if (checkError) {
      console.error("❌ Error verificando schedule existente:");
      console.error("Mensaje:", checkError.message);
      console.error("Detalles:", checkError.details);
      console.error("Hint:", checkError.hint);
      console.error("Código:", checkError.code);
      
      // Verificar si falta la columna user_id
      if (checkError.message?.includes("column") && checkError.message?.includes("user_id")) {
        const errorMsg = "La columna 'user_id' no existe. Ejecuta: supabase_migration_user_schedules.sql";
        console.error("⚠️", errorMsg);
        throw new Error(errorMsg);
      }
      
      // Verificar si la tabla no existe
      if (checkError.message?.includes("relation") || checkError.message?.includes("does not exist")) {
        const errorMsg = "La tabla r4w_ia_daily_schedule no existe.";
        console.error("⚠️", errorMsg);
        throw new Error(errorMsg);
      }
      
      throw new Error(`Error verificando schedule: ${checkError.message || checkError.code || "Error desconocido"}`);
    }

    // Verificar si el schedule existe y está completo (tiene los 7 días)
    if (existingSchedules && existingSchedules.length > 0) {
      const days = existingSchedules.map(s => s.day_number).sort((a, b) => a - b);
      const expectedDays = [1, 2, 3, 4, 5, 6, 7];
      const hasAllDays = expectedDays.every(day => days.includes(day));
      
      if (hasAllDays && existingSchedules.length === 7) {
        console.log(`✅ El usuario ${userId} ya tiene un schedule personalizado completo para ${RACE_TYPE}`);
        return;
      } else {
        // Schedule incompleto, eliminarlo y recrearlo
        console.log(`⚠️ El usuario ${userId} tiene un schedule incompleto (${existingSchedules.length}/7 días), eliminando y recreando...`);
        const { error: deleteError } = await supabase
          .from("r4w_ia_daily_schedule")
          .delete()
          .eq("race_type", RACE_TYPE)
          .eq("user_id", userId);
        
        if (deleteError) {
          console.error("❌ Error eliminando schedule incompleto:", deleteError);
          throw new Error(`Error eliminando schedule incompleto: ${deleteError.message}`);
        }
        console.log(`✅ Schedule incompleto eliminado, procediendo a crear uno nuevo...`);
      }
    }

    // 2. Obtener las 7 preguntas de la carrera (una por cada día)
    const { data: questions, error: questionsError } = await supabase
      .from("r4w_ia_questions")
      .select("id, day_number")
      .eq("race_type", RACE_TYPE)
      .in("day_number", [1, 2, 3, 4, 5, 6, 7])
      .order("day_number", { ascending: true })
      .order("created_at", { ascending: true }); // Si hay múltiples, tomar la primera

    if (questionsError) {
      console.error("❌ Error obteniendo preguntas:");
      console.error("Mensaje:", questionsError.message);
      console.error("Detalles:", questionsError.details);
      console.error("Hint:", questionsError.hint);
      console.error("Código:", questionsError.code);
      
      // Verificar si la tabla no existe
      if (questionsError.message?.includes("relation") || questionsError.message?.includes("does not exist")) {
        const errorMsg = "La tabla r4w_ia_questions no existe. Genera preguntas primero con /api/admin/generate-questions";
        console.error("⚠️", errorMsg);
        throw new Error(errorMsg);
      }
      
      throw new Error(`Error obteniendo preguntas: ${questionsError.message || questionsError.code || "Error desconocido"}`);
    }

    if (!questions || questions.length < 7) {
      console.error("❌ No hay suficientes preguntas:", questions?.length || 0, "de 7 necesarias");
      const errorMsg = `No se encontraron las 7 preguntas necesarias. Solo hay ${questions?.length || 0} preguntas en la base de datos. Genera preguntas con /api/admin/generate-questions`;
      console.error("⚠️", errorMsg);
      throw new Error(errorMsg);
    }

    // Agrupar por day_number y tomar la primera de cada día
    const questionsByDay = new Map<number, string>();
    for (const q of questions) {
      if (!questionsByDay.has(q.day_number)) {
        questionsByDay.set(q.day_number, q.id);
      }
    }

    if (questionsByDay.size < 7) {
      throw new Error(`Faltan preguntas: solo se encontraron ${questionsByDay.size} de 7 días`);
    }

    // 3. Calcular fecha de inicio (hoy) - esta será la fecha base para calcular días
    const startDate = new Date();
    const startDateStr = startDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // 4. Calcular ventana para el día 1 (hora actual redondeada hacia abajo)
    const currentTime = roundDownToMinute(startDate);
    const day1WindowStart = currentTime;
    const day1WindowEnd = calculateDay1WindowEnd(currentTime);

    // 5. Crear los 7 schedules
    // IMPORTANTE: Todos los schedules tendrán run_date = startDateStr (fecha de registro)
    // El día se determina por day_number, no por run_date
    // Esto permite que cada usuario tenga su propio calendario desde su día de registro
    const schedules = [];

    for (let dayNumber = 1; dayNumber <= 7; dayNumber++) {
      const questionId = questionsByDay.get(dayNumber);
      if (!questionId) {
        throw new Error(`No se encontró pregunta para el día ${dayNumber}`);
      }

      let windowStart: string;
      let windowEnd: string;

      if (dayNumber === 1) {
        // Día 1: ventana desde ahora hasta +2 horas (máx 21:00)
        windowStart = day1WindowStart;
        windowEnd = day1WindowEnd;
      } else {
        // Días 2-7: ventana aleatoria de 1 hora entre 09:00 y 21:00
        const timeWindow = generateRandomTimeWindow(9, 20);
        windowStart = timeWindow.start;
        windowEnd = timeWindow.end;
      }

      // Todos los schedules tienen la misma run_date (fecha de inicio)
      // El día se determina por day_number y se calcula dinámicamente según días transcurridos
      schedules.push({
        race_type: RACE_TYPE,
        day_number: dayNumber,
        question_id: questionId,
        run_date: startDateStr, // Fecha de registro (igual para todos los días)
        window_start: windowStart,
        window_end: windowEnd,
        user_id: userId,
      });
    }

    // 6. Insertar todos los schedules
    const { data: insertedData, error: insertError } = await supabase
      .from("r4w_ia_daily_schedule")
      .insert(schedules)
      .select();

    if (insertError) {
      console.error("❌ Error insertando schedules personalizados:");
      console.error("Mensaje:", insertError.message);
      console.error("Detalles:", insertError.details);
      console.error("Hint:", insertError.hint);
      console.error("Código:", insertError.code);
      console.error("Error completo:", JSON.stringify(insertError, Object.getOwnPropertyNames(insertError)));
      
      // Verificar si el error es porque falta la columna user_id (migración no ejecutada)
      if (insertError.message?.includes("column") && (insertError.message?.includes("user_id") || insertError.message?.includes("does not exist"))) {
        const errorMsg = "La columna 'user_id' no existe en la tabla. Por favor, ejecuta la migración SQL: supabase_migration_user_schedules.sql";
        console.error("⚠️", errorMsg);
        throw new Error(errorMsg);
      }
      
      // Verificar si la tabla no existe
      if (insertError.message?.includes("relation") || insertError.message?.includes("does not exist")) {
        const errorMsg = "La tabla r4w_ia_daily_schedule no existe o no tiene la estructura correcta.";
        console.error("⚠️", errorMsg);
        throw new Error(errorMsg);
      }
      
      throw new Error(`Error insertando schedules: ${insertError.message || insertError.code || "Error desconocido"}`);
    }

    console.log(`✅ Creado schedule personalizado de 7 días para usuario ${userId}`);
    console.log(`✅ Schedules insertados: ${insertedData?.length || 0}`);
    
    // Verificar que se insertaron correctamente
    if (!insertedData || insertedData.length !== 7) {
      console.warn(`⚠️ Se esperaban 7 schedules, se insertaron ${insertedData?.length || 0}`);
    }
  } catch (error: any) {
    console.error("Error en createUserScheduleFor7dMvp:", error);
    throw error;
  }
}

/**
 * Actualiza o crea el schedule del día siguiente para un usuario
 * Genera una ventana horaria aleatoria de 1 hora (09:00-21:00)
 */
export async function updateNextDaySchedule(
  userId: string,
  currentDay: number
): Promise<{ windowStart: string; windowEnd: string } | null> {
  try {
    const nextDay = currentDay + 1;
    
    // Validar que no exceda los 7 días
    if (nextDay > 7) {
      console.log(`✅ El usuario ${userId} ya completó los 7 días de la carrera`);
      return null;
    }

    // Generar ventana horaria aleatoria de 1 hora
    const startHour = Math.floor(Math.random() * 12) + 9; // 9-20
    const windowStart = `${String(startHour).padStart(2, "0")}:00:00`;
    const windowEnd = `${String(startHour + 1).padStart(2, "0")}:00:00`;

    // Calcular fecha de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    // Verificar si ya existe un schedule para el día siguiente
    const { data: existingSchedule, error: checkError } = await supabase
      .from("r4w_ia_daily_schedule")
      .select("id, question_id")
      .eq("race_type", RACE_TYPE)
      .eq("user_id", userId)
      .eq("day_number", nextDay)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error verificando schedule del día siguiente:", checkError);
      return null;
    }

    if (existingSchedule) {
      // Actualizar schedule existente
      const { error: updateError } = await supabase
        .from("r4w_ia_daily_schedule")
        .update({
          window_start: windowStart,
          window_end: windowEnd,
          run_date: tomorrowDateStr, // Actualizar también la fecha por si acaso
        })
        .eq("id", existingSchedule.id);

      if (updateError) {
        console.error("❌ Error actualizando schedule del día siguiente:", updateError);
        return null;
      }

      console.log(`✅ Actualizado schedule del día ${nextDay} para usuario ${userId}`);
      return { windowStart, windowEnd };
    } else {
      // Crear nuevo schedule si no existe
      // Necesitamos obtener la pregunta para ese día
      const { data: question, error: questionError } = await supabase
        .from("r4w_ia_questions")
        .select("id")
        .eq("race_type", RACE_TYPE)
        .eq("day_number", nextDay)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (questionError || !question) {
        console.error("❌ Error obteniendo pregunta para el día siguiente:", questionError);
        return null;
      }

      const { error: insertError } = await supabase
        .from("r4w_ia_daily_schedule")
        .insert({
          race_type: RACE_TYPE,
          day_number: nextDay,
          question_id: question.id,
          run_date: tomorrowDateStr,
          window_start: windowStart,
          window_end: windowEnd,
          user_id: userId,
        });

      if (insertError) {
        console.error("❌ Error creando schedule del día siguiente:", insertError);
        return null;
      }

      console.log(`✅ Creado schedule del día ${nextDay} para usuario ${userId}`);
      return { windowStart, windowEnd };
    }
  } catch (error: any) {
    console.error("Error en updateNextDaySchedule:", error);
    return null;
  }
}

