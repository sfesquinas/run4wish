// app/lib/checkUserSchedule.ts
// Helper para verificar y crear schedules de usuario

import { supabase } from "./supabaseClient";
import { createUserScheduleFor24h } from "./userSchedule24h";

export async function ensureUserSchedule(
  userId: string,
  raceType: "7d_mvp" | "24h_sprint" = "7d_mvp"
): Promise<boolean> {
  try {
    // Lógica específica para 24h_sprint
    if (raceType === "24h_sprint") {
      return await ensureUserSchedule24h(userId);
    }

    // Lógica para 7d_mvp (comportamiento original)
    const { data: schedules, error } = await supabase
      .from("r4w_ia_daily_schedule")
      .select("id, day_number, slot_number")
      .eq("race_type", "7d_mvp")
      .eq("user_id", userId)
      .eq("slot_number", 1) // Para 7d_mvp, solo contar schedules con slot_number = 1
      .order("day_number", { ascending: true })
      .order("slot_number", { ascending: true });

    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") {
        console.log(`📅 No se encontró schedule para usuario ${userId}, creando uno nuevo...`);
        return await createScheduleViaAPI(userId);
      }
      console.warn(`⚠️ Error verificando schedule:`, error.message || error.code || "Error desconocido");
      return await createScheduleViaAPI(userId);
    }

    if (!schedules || schedules.length < 7) {
      console.log(`📅 Schedule incompleto para usuario ${userId} (${schedules?.length || 0}/7 días), creando/completando...`);
      return await createScheduleViaAPI(userId);
    }

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
 * Verifica y crea schedule para carrera 24h_sprint
 * Verifica que existan slots 1..12 para el run_date actual
 */
async function ensureUserSchedule24h(userId: string): Promise<boolean> {
  try {
    // Obtener la fecha de hoy (solo fecha, sin hora)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Verificar si existen los 12 slots para hoy
    const { data: schedules, error } = await supabase
      .from("r4w_ia_daily_schedule")
      .select("slot_number")
      .eq("race_type", "24h_sprint")
      .eq("user_id", userId)
      .eq("run_date", todayStr)
      .order("slot_number", { ascending: true });

    if (error && error.code !== "PGRST116") {
      console.warn(`⚠️ Error verificando schedule 24h_sprint:`, error.message || error.code || "Error desconocido");
      // Intentar crear de todas formas
    }

    // Verificar que tenemos los 12 slots
    if (!schedules || schedules.length < 12) {
      console.log(`📅 Schedule 24h_sprint incompleto para usuario ${userId} (${schedules?.length || 0}/12 slots), creando...`);
      const created = await createUserScheduleFor24h(userId, todayStr);
      if (created) {
        console.log(`✅ Schedule 24h_sprint creado para usuario ${userId}`);
        return true;
      } else {
        console.error("❌ No se pudo crear schedule 24h_sprint para user", userId);
        return false;
      }
    }

    // Verificar que tenemos todos los slots del 1 al 12
    const slots = schedules.map(s => s.slot_number).sort((a, b) => a - b);
    const expectedSlots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const hasAllSlots = expectedSlots.every(slot => slots.includes(slot));

    if (!hasAllSlots) {
      console.log(`📅 Schedule 24h_sprint incompleto para usuario ${userId} (faltan slots), recreando...`);
      const created = await createUserScheduleFor24h(userId, todayStr);
      if (created) {
        console.log(`✅ Schedule 24h_sprint recreado para usuario ${userId}`);
        return true;
      } else {
        console.error("❌ No se pudo recrear schedule 24h_sprint para user", userId);
        return false;
      }
    }

    return true;
  } catch (err: any) {
    console.error("Error en ensureUserSchedule24h:", err);
    return false;
  }
}

async function createScheduleViaAPI(userId: string): Promise<boolean> {
  try {
    console.log(`📅 Creando schedule personalizado para usuario ${userId}...`);
    const response = await fetch("/api/user/create-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.warn(`⚠️ Error creando schedule (${response.status}):`, errorMessage);
      } catch {
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
    const errorMessage = err?.message || String(err) || "Error desconocido";
    console.warn(`⚠️ Error llamando a API create-schedule:`, errorMessage);
    return false;
  }
}
