// app/lib/questionHelpers.ts
// Helpers para lógica de preguntas y ventanas horarias

export function getWindowState(
  currentTime: string,
  windowStart: string,
  windowEnd: string
): "before" | "active" | "after" {
  // Si la ventana es de día completo, siempre está activa
  if (windowStart === "00:00:00" && windowEnd === "23:59:59") {
    return "active";
  }
  // Comparar strings en formato HH:MM:SS
  if (currentTime < windowStart) return "before";
  if (currentTime > windowEnd) return "after";
  return "active";
}

export function formatTimeToHHMM(time: string): string {
  // Convierte "HH:MM:SS" a "HH:MM"
  if (!time) return "";
  return time.slice(0, 5);
}

export function getQuestionMessage(
  state: "before_window" | "active" | "after_window" | "no_schedule" | "error_carga",
  windowInfo?: { start: string; end: string; currentTime: string }
): string {
  switch (state) {
    case "before_window":
      return `La ventana se abrirá entre ${windowInfo?.start || "..."} y ${windowInfo?.end || "..."}`;
    case "after_window":
      return "La ventana horaria de hoy ya ha finalizado. Vuelve mañana.";
    case "no_schedule":
      return "No hay pregunta programada para hoy.";
    case "error_carga":
      return "Error al cargar la pregunta. Inténtalo de nuevo.";
    default:
      return "Pregunta disponible";
  }
}
