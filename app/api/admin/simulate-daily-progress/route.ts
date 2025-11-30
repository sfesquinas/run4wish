// app/api/admin/simulate-daily-progress/route.ts
// Endpoint para simular el progreso diario de runners (puede ser llamado automáticamente)

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminAuth } from "../../../lib/authHelpers";

// Cliente de Supabase server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función auxiliar para simular progreso en el servidor
async function simulateDailyProgressServer(dayNumber: number, supabaseClient: any): Promise<boolean> {
  try {
    // Obtener todos los runners
    const { data: runners, error: runnersError } = await supabaseClient
      .from("r4w_simulated_runners")
      .select("id, speed_factor")
      .eq("race_type", "7d_mvp");

    if (runnersError || !runners) {
      console.error("Error obteniendo runners:", runnersError);
      return false;
    }

    // Verificar si ya se simuló este día
    const { data: existingPositions, error: existingError } = await supabaseClient
      .from("r4w_simulated_positions")
      .select("runner_id")
      .eq("day_number", dayNumber)
      .limit(1);

    if (existingError) {
      console.error("Error verificando posiciones existentes:", existingError);
      return false;
    }

    if (existingPositions && existingPositions.length > 0) {
      console.log(`✅ El día ${dayNumber} ya fue simulado`);
      return true;
    }

    // Calcular posiciones ganadas para cada runner
    const positions = runners.map((runner: any) => {
      const baseGain = Math.floor(runner.speed_factor * 5);
      const randomFactor = Math.floor(Math.random() * 3) - 1;
      const positionsGained = Math.max(0, baseGain + randomFactor);

      return {
        runner_id: runner.id,
        day_number: dayNumber,
        answered: true,
        positions_gained: positionsGained,
      };
    });

    // Insertar posiciones
    const { error: insertError } = await supabaseClient
      .from("r4w_simulated_positions")
      .insert(positions);

    if (insertError) {
      console.error("Error insertando posiciones simuladas:", insertError);
      return false;
    }

    console.log(`✅ Simulado progreso del día ${dayNumber} para ${runners.length} runners`);
    return true;
  } catch (error) {
    console.error("Error en simulateDailyProgressServer:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 Verificar autenticación (opcional: puede ser público para ejecución automática)
    // Comentado para permitir ejecución automática
    // const authResult = await verifyAdminAuth(request);
    // if (authResult.error === "not_authenticated" || authResult.error === "forbidden") {
    //   return NextResponse.json({ error: authResult.error }, { status: authResult.error === "not_authenticated" ? 401 : 403 });
    // }

    const body = await request.json().catch(() => ({}));
    const dayNumber = body.dayNumber || new Date().getDate() % 7 || 1; // Fallback al día actual

    if (dayNumber < 1 || dayNumber > 7) {
      return NextResponse.json(
        { error: "dayNumber debe estar entre 1 y 7" },
        { status: 400 }
      );
    }

    console.log(`🔄 Simulando progreso del día ${dayNumber}...`);
    
    // Simular progreso usando el cliente server-side
    const success = await simulateDailyProgressServer(dayNumber, supabase);

    if (!success) {
      return NextResponse.json(
        { error: "Error simulando progreso diario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Progreso del día ${dayNumber} simulado correctamente`,
      dayNumber,
    });
  } catch (error: any) {
    console.error("Error en simulate-daily-progress:", error);
    return NextResponse.json(
      { error: error.message || "Error desconocido" },
      { status: 500 }
    );
  }
}

// GET para verificar estado
export async function GET() {
  return NextResponse.json({
    message: "Endpoint de simulación de progreso diario",
    method: "POST",
    description: "Envía un POST con { dayNumber: 1-7 } para simular el progreso de ese día",
  });
}

