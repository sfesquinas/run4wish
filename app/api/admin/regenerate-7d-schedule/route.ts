import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createUserScheduleFor7dMvp } from "../../../lib/userSchedule"; // ajusta la ruta si es necesaria

// ⚠️ Usa las mismas env vars que ya usa el proyecto en otros sitios
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Faltan variables de entorno SUPABASE en regenerate-7d-schedule");
}

export async function POST(req: NextRequest) {
  try {
    // Crear cliente admin (service role) – solo en este endpoint protegido
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Leer sesión del usuario desde la cookie
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser();

    if (authError || !authData?.user) {
      console.error("❌ regenerate-7d-schedule: usuario no autenticado", {
        authError,
      });
      return Response.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    const user = authData.user;

    // Solo permitir a la admin
    if (user.email?.toLowerCase() !== "sara.fernandez@run4wish.com") {
      console.warn("⚠️ regenerate-7d-schedule: email no autorizado", {
        email: user.email,
      });
      return Response.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const userId = user.id;
    console.log("🔁 Regenerando carrera 7d_mvp para usuario admin", { userId });

    // 1) Borrar schedules actuales de 7d_mvp para este usuario
    const { error: deleteError } = await supabaseAdmin
      .from("r4w_ia_daily_schedule")
      .delete()
      .eq("race_type", "7d_mvp")
      .eq("user_id", userId);

    if (deleteError) {
      console.error("❌ Error borrando schedules 7d_mvp", {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
      });
      return Response.json(
        { ok: false, error: "delete_failed", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log("🗑️ Schedules 7d_mvp borrados correctamente para", { userId });

    // 2) Crear nuevos schedules usando el banco de preguntas
    // Nota: createUserScheduleFor7dMvp devuelve Promise<void>, si lanza error lo capturamos
    try {
      await createUserScheduleFor7dMvp(userId);
      console.log("✅ Nuevos schedules 7d_mvp creados desde r4w_question_bank", {
        userId,
      });
    } catch (scheduleError: any) {
      console.error("❌ createUserScheduleFor7dMvp falló", {
        message: scheduleError?.message || String(scheduleError),
      });
      return Response.json(
        { ok: false, error: "schedule_create_failed", details: scheduleError?.message || String(scheduleError) },
        { status: 500 }
      );
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("💥 Error inesperado en regenerate-7d-schedule", {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return Response.json(
      { ok: false, error: "unexpected_error", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
