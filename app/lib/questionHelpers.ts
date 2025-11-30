// app/lib/questionHelpers.ts
// Helpers y utilidades para preguntas del día

export type QuestionWindowState =
  | "loading"
  | "no_schedule"
  | "before_window"
  | "active"
  | "after_window"
  | "error_carga";

/**
 * Formatea una hora de formato HH:MM:SS a HH:MM
 */
export function formatTime(time: string): string {
  if (!time) return "";
  return time.slice(0, 5); // Toma los primeros 5 caracteres (HH:MM)
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr === today;
}

/**
 * Obtiene el mensaje apropiado según el estado de la pregunta
 */
export function getQuestionMessage(
  state: QuestionWindowState,
  windowInfo?: { start: string; end: string }
): string {
  switch (state) {
    case "no_schedule":
      return "Hoy no hay pregunta programada. Sigue pendiente, runner ✨";
    case "before_window":
      if (windowInfo) {
        return `La ventana para responder se abrirá entre ${formatTime(windowInfo.start)} y ${formatTime(windowInfo.end)}`;
      }
      return "La ventana para responder se abrirá pronto.";
    case "after_window":
      return "La ventana de hoy ya ha cerrado. Mañana tendrás una nueva oportunidad.";
    case "error_carga":
      return "No se pudo cargar la pregunta del día. Por favor, intenta de nuevo más tarde.";
    case "loading":
      return "Cargando pregunta del día...";
    case "active":
      return ""; // No hay mensaje especial cuando está activa
    default:
      return "";
  }
}

/**
 * Determina el estado de la ventana horaria
 */
export function getWindowState(
  currentTime: string,
  windowStart: string,
  windowEnd: string
): "before" | "active" | "after" {
  // Comparar strings en formato HH:MM:SS
  if (currentTime < windowStart) return "before";
  if (currentTime > windowEnd) return "after";
  return "active";
}

/**
 * Obtiene la hora actual en formato HH:MM:SS
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Obtiene la fecha de mañana en formato YYYY-MM-DD
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

/**
 * Genera una ventana horaria aleatoria de 1 hora completa entre 09:00 y 21:00
 * @returns Objeto con window_start y window_end en formato HH:MM:SS
 */
export function generateRandomHourWindow(): { start: string; end: string } {
  // Elegir una hora entera entre 9 y 20 (inclusive)
  const startHour = Math.floor(Math.random() * 12) + 9; // 9-20
  
  const start = `${String(startHour).padStart(2, "0")}:00:00`;
  const endHour = startHour + 1;
  const end = `${String(endHour).padStart(2, "0")}:00:00`;
  
  return { start, end };
}

/**
 * Formatea una hora de formato HH:MM:SS a HH:MM
 */
export function formatTimeToHHMM(time: string): string {
  if (!time) return "";
  // Si ya está en formato HH:MM, devolverlo
  if (time.length === 5) return time;
  // Si está en formato HH:MM:SS, tomar los primeros 5 caracteres
  return time.slice(0, 5);
}

