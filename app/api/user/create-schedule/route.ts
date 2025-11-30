// app/api/user/create-schedule/route.ts
// API route para crear schedule personalizado desde el cliente

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createUserScheduleFor7dMvp } from "../../../lib/userSchedule";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan variables de entorno de Supabase");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario esté autenticado (opcional, pero recomendado)
    // Por ahora, confiamos en que el userId viene del cliente autenticado

    console.log(`📅 API: Creando schedule para usuario ${userId}...`);
    await createUserScheduleFor7dMvp(userId);

    return NextResponse.json({
      success: true,
      message: "Schedule creado correctamente",
    });
  } catch (error: any) {
    console.error("Error en create-schedule API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error desconocido al crear schedule",
      },
      { status: 500 }
    );
  }
}

