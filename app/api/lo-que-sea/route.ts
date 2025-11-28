// app/api/lo-que-sea/route.ts
import { NextResponse } from "next/server";

// Endpoint de prueba para que useUserRaces tenga siempre un JSON válido
export async function GET() {
  // De momento devolvemos una lista vacía de carreras
  return NextResponse.json({
    ok: true,
    races: [],
  });
}