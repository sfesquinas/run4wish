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
      console.error("Error verificando schedule:", error);
      // Si es error de "no encontrado", intentar crear
      if (error.code === "PGRST116") {
        return await createScheduleViaAPI(userId);
      }
      return false;
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
      const errorData = await response.json().catch(() => ({}));
      console.error("Error creando schedule:", errorData);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Schedule creado para usuario ${userId}:`, result);
    return true;
  } catch (err: any) {
    console.error("Error llamando a API create-schedule:", err);
    return false;
  }
}

