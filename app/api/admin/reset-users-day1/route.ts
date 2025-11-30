// app/api/admin/reset-users-day1/route.ts
// Endpoint para resetear usuarios existentes para que hoy sea su día número 1
// PROTEGIDO: Solo accesible para usuarios autenticados (sin verificación de admin por ahora)

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminAuth } from "../../../lib/authHelpers";

// Cliente de Supabase (server-side) para operaciones de base de datos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Resetea todos los schedules de usuarios existentes para que hoy sea su día 1
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (sin verificación de admin por ahora)
    const auth = await verifyAdminAuth(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: ("error" in auth ? auth.error : undefined) || "No autenticado" },
        { status: 401 }
      );
    }

    console.log("🔄 Iniciando reset de usuarios para día 1...");

    // Fecha objetivo: 30 de noviembre de 2025
    const targetDate = "2025-11-30";

    // Actualizar todos los schedules personalizados de usuarios
    // para que su run_date sea 2025-11-30
    const { data: updateData, error: updateError } = await supabase
      .from("r4w_ia_daily_schedule")
      .update({ run_date: targetDate })
      .eq("race_type", "7d_mvp")
      .not("user_id", "is", null)
      .select("id, user_id, day_number");

    if (updateError) {
      console.error("❌ Error actualizando schedules:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError.message || "Error al actualizar schedules",
        },
        { status: 500 }
      );
    }

    // Contar usuarios únicos afectados
    const uniqueUsers = new Set(updateData?.map((s) => s.user_id) || []);
    const totalSchedules = updateData?.length || 0;

    console.log(`✅ Reset completado:`);
    console.log(`   - Usuarios afectados: ${uniqueUsers.size}`);
    console.log(`   - Schedules actualizados: ${totalSchedules}`);
    console.log(`   - Nueva fecha de inicio: ${targetDate}`);

    return NextResponse.json({
      success: true,
      message: "Usuarios reseteados correctamente",
      data: {
        usersAffected: uniqueUsers.size,
        schedulesUpdated: totalSchedules,
        newStartDate: targetDate,
      },
    });
  } catch (error: any) {
    console.error("Error en reset-users-day1 API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error desconocido al resetear usuarios",
      },
      { status: 500 }
    );
  }
}

