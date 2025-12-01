import { NextResponse } from "next/server";
import { verifyAdminAuth } from "../../../lib/authHelpers";

/**
 * Endpoint antiguo de generación de preguntas.
 * Ahora está DESACTIVADO y solo existe para que el build no falle.
 */
export async function POST(request: Request) {
  try {
    // Verificar que el usuario es admin (por seguridad, aunque esté desactivado)
    const auth = await verifyAdminAuth(request);
    if (!auth.ok) {
      const errorStatus = "error" in auth && auth.error === "forbidden" ? 403 : 401;
      const errorMessage = "error" in auth ? auth.error : "not_authenticated";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: errorStatus }
      );
    }

    return NextResponse.json({
      success: false,
      mode: "disabled",
      message:
        "Este endpoint de generación de preguntas está desactivado. Usa /api/admin/load-question-bank para cargar preguntas.",
    });
  } catch (error) {
    console.error("❌ Error en /api/admin/generate-questions (stub):", error);
    return NextResponse.json(
      {
        success: false,
        error: "internal_error",
        message:
          "Error interno en el endpoint antiguo de generación de preguntas.",
      },
      { status: 500 }
    );
  }
}
