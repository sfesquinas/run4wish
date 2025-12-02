// app/api/admin/regenerate-7d-schedule/route.ts
// Endpoint admin para regenerar la carrera de 7 días de un usuario
// Solo accesible para sara.fernandez@run4wish.com

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyAdminAuth } from "../../../lib/authHelpers";
import { createUserScheduleFor7dMvp } from "../../../lib/userSchedule";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

/**
 * POST /api/admin/regenerate-7d-schedule
 * 
 * Regenera el schedule de 7 días del usuario actual (admin).
 * 
 * 1. Verifica que el usuario esté autenticado y sea admin
 * 2. Borra los schedules existentes de 7d_mvp del usuario
 * 3. Crea nuevos schedules usando r4w_question_bank
 * 
 * Respuesta:
 * - 200: { ok: true, message: "...", userId: "..." }
 * - 401: No autenticado
 * - 403: No es admin
 * - 500: Error interno
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN] Iniciando regeneración de schedule 7d_mvp...");

    // 1) Verificar autenticación y permisos admin
    const auth = await verifyAdminAuth(request);
    
    if (!auth.ok) {
      const errorStatus = "error" in auth && auth.error === "forbidden" ? 403 : 401;
      const errorMessage = "error" in auth ? auth.error : "not_authenticated";
      
      console.warn(`⚠️ [ADMIN] Acceso denegado: ${errorMessage}`);
      
      return NextResponse.json(
        { 
          ok: false, 
          error: errorMessage,
          message: errorMessage === "forbidden" 
            ? "Solo el administrador puede regenerar schedules" 
            : "Debes estar autenticado para usar este endpoint"
        },
        { status: errorStatus }
      );
    }

    // 2) Obtener el usuario actual desde la sesión
    // Usar el mismo método que verifyAdminAuth para obtener el usuario
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Crear cliente con storage personalizado para cookies
    const supabaseWithCookies = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key: string) => {
            for (const cookie of allCookies) {
              if (cookie.name === key || cookie.name.includes(key)) {
                return cookie.value;
              }
            }
            return null;
          },
          setItem: () => {},
          removeItem: () => {},
        },
      },
    });

    const { data: { user }, error: userError } = await supabaseWithCookies.auth.getUser();

    if (userError || !user) {
      console.error("❌ [ADMIN] Error obteniendo usuario:", userError);
      return NextResponse.json(
        { 
          ok: false, 
          error: "user_not_found",
          message: "No se pudo obtener el usuario de la sesión"
        },
        { status: 401 }
      );
    }

    const currentUserId = user.id;
    console.log(`✅ [ADMIN] Usuario autenticado: ${user.email} (${currentUserId})`);

    // 3) Borrar schedules existentes de 7d_mvp del usuario
    // Usar service role key para operaciones de escritura
    console.log(`🗑️ [ADMIN] Eliminando schedules existentes de 7d_mvp para usuario ${currentUserId}...`);
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: deleteError } = await supabaseAdmin
      .from("r4w_ia_daily_schedule")
      .delete()
      .eq("race_type", "7d_mvp")
      .eq("user_id", currentUserId);

    if (deleteError && deleteError.code !== "PGRST116") {
      // PGRST116 = "no rows found", que es aceptable
      console.warn("⚠️ [ADMIN] Error eliminando schedules antiguos (continuando):", deleteError.message);
      // Continuamos de todas formas, puede que no haya schedules previos
    } else {
      console.log("✅ [ADMIN] Schedules antiguos eliminados correctamente");
    }

    // 4) Crear nuevo schedule usando el helper
    console.log(`📅 [ADMIN] Creando nuevo schedule 7d_mvp para usuario ${currentUserId}...`);
    
    try {
      await createUserScheduleFor7dMvp(currentUserId);
      console.log(`✅ [ADMIN] Schedule 7d_mvp regenerado correctamente para usuario ${currentUserId}`);
    } catch (scheduleError: any) {
      console.error("❌ [ADMIN] Error creando schedule:", scheduleError);
      return NextResponse.json(
        { 
          ok: false, 
          error: "schedule_creation_failed",
          message: scheduleError.message || "Error al crear el nuevo schedule"
        },
        { status: 500 }
      );
    }

    // 5) Respuesta exitosa
    return NextResponse.json({
      ok: true,
      message: "Schedule 7d_mvp regenerado correctamente",
      userId: currentUserId,
      userEmail: user.email,
    });

  } catch (error: any) {
    console.error("❌ [ADMIN] Error inesperado en regenerate-7d-schedule:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        message: error.message || "Error interno al regenerar el schedule"
      },
      { status: 500 }
    );
  }
}

