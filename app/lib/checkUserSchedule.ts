// app/lib/checkUserSchedule.ts
// Helper para verificar y crear schedule si falta (útil para usuarios existentes)
// NOTA: Este helper se ejecuta desde el cliente, pero createUserScheduleFor7dMvp
// se ejecuta desde el servidor. Para crear schedules desde el cliente, necesitamos
// una API route o usar el cliente con permisos adecuados.

import { supabase } from "./supabaseClient";

/**
 * Verifica si un usuario tiene schedule personalizado completo (7 días)
 * Si no existe o está incompleto, llama a una API route para crearlo/completarlo
 */
export async function ensureUserSchedule(userId: string): Promise<boolean> {
  try {
    // Verificar si existe schedule y cuántos días tiene
    const { data: schedules, error } = await supabase
      .from("r4w_ia_daily_schedule")
      .select("id, day_number")
      .eq("race_type", "7d_mvp")
      .eq("user_id", userId);

    if (error) {
      // Si es error de "no encontrado" (tabla vacía o no existe), intentar crear
      if (error.code === "PGRST116" || error.code === "42P01") {
        console.log(`📅 No se encontró schedule para usuario ${userId}, creando uno nuevo...`);
        return await createScheduleViaAPI(userId);
      }
      // Otros errores: loguear pero no bloquear
      console.warn(`⚠️ Error verificando schedule:`, error.message || error.code || "Error desconocido");
      // Intentar crear de todas formas si parece que no hay schedule
      return await createScheduleViaAPI(userId);
    }

    // Verificar que tenga los 7 días
    if (!schedules || schedules.length < 7) {
      console.log(`📅 Schedule incompleto para usuario ${userId} (${schedules?.length || 0}/7 días), creando/completando...`);
      return await createScheduleViaAPI(userId);
    }

    // Verificar que tenga los días del 1 al 7
    const days = schedules.map(s => s.day_number).sort((a, b) => a - b);
    const expectedDays = [1, 2, 3, 4, 5, 6, 7];
    const hasAllDays = expectedDays.every(day => days.includes(day));
    
    if (!hasAllDays) {
      console.log(`📅 Schedule incompleto para usuario ${userId} (faltan días), recreando...`);
      return await createScheduleViaAPI(userId);
    }

    return true;
  } catch (err: any) {
    console.error("Error en ensureUserSchedule:", err);
    return false;
  }
}

/**
 * Llama a la API route para crear el schedule
 */
async function createScheduleViaAPI(userId: string): Promise<boolean> {
  try {
    console.log(`📅 Creando schedule personalizado para usuario ${userId}...`);
    const response = await fetch("/api/user/create-schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      // Intentar obtener el mensaje de error
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.warn(`⚠️ Error creando schedule (${response.status}):`, errorMessage);
      } catch {
        // Si no se puede parsear el JSON, usar el status
        const text = await response.text().catch(() => "");
        errorMessage = text || errorMessage;
        console.warn(`⚠️ Error creando schedule (${response.status}):`, errorMessage || "Sin detalles");
      }
      return false;
    }

    const result = await response.json();
    if (result.success) {
      console.log(`✅ Schedule creado para usuario ${userId}`);
      return true;
    } else {
      console.warn(`⚠️ Schedule no se creó correctamente:`, result.error || result.message);
      return false;
    }
  } catch (err: any) {
    // Error de red o parsing
    const errorMessage = err?.message || String(err) || "Error desconocido";
    console.warn(`⚠️ Error llamando a API create-schedule:`, errorMessage);
    return false;
  }
}

