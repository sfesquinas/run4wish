// app/hooks/useDailyQuestion.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "./useUser";
import {
  getWindowState,
  getCurrentTime,
  getTodayDate,
  formatTime,
  type QuestionWindowState,
} from "../lib/questionHelpers";
import { ensureUserSchedule } from "../lib/checkUserSchedule";

export type DailyQuestion = {
  questionId: string;
  question: string;
  options: string[];
  dayNumber: number;
  windowStart: string;
  windowEnd: string;
  correctOption: string;
};

export type DailyQuestionState = {
  question: DailyQuestion | null;
  loading: boolean;
  error: QuestionWindowState | null;
  windowState: "before" | "active" | "after" | null;
  windowInfo: {
    start: string;
    end: string;
    currentTime: string;
  } | null;
};

/**
 * Hook para obtener la pregunta del día desde Supabase
 * Verifica que esté dentro de la ventana horaria (window_start - window_end)
 * Soporta múltiples tipos de carrera y detecta cambios automáticamente
 * Prioriza schedules personalizados por usuario sobre schedules globales
 */
export function useDailyQuestion(raceType: string = "7d_mvp"): DailyQuestionState {
  const { user } = useUser() as any;
  const userId = user?.id || null;
  
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<QuestionWindowState | null>(null);
  const [windowState, setWindowState] = useState<"before" | "active" | "after" | null>(null);
  const [windowInfo, setWindowInfo] = useState<{
    start: string;
    end: string;
    currentTime: string;
  } | null>(null);

  const fetchDailyQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWindowState(null);
    setWindowInfo(null);

    try {
      // Obtener la fecha de hoy en formato YYYY-MM-DD
      const today = getTodayDate();
      
      // Obtener la hora actual en formato HH:MM:SS
      const currentTime = getCurrentTime();

      // PASO 1: Buscar schedule personalizado del usuario (si hay userId)
      let schedule = null;
      let scheduleError = null;

      if (userId) {
        // Primero, obtener la fecha de inicio del schedule del usuario (fecha de registro)
        const { data: startDateData, error: startDateError } = await supabase
          .from("r4w_ia_daily_schedule")
          .select("run_date")
          .eq("race_type", raceType)
          .eq("user_id", userId)
          .order("run_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        // Si no hay schedule o hay un error de "no encontrado", intentar crear uno
        if (!startDateData || (startDateError && (startDateError as any).code === "PGRST116")) {
          console.log("⚠️ No se encontró schedule para el usuario, intentando crear uno...");
          if (raceType === "7d_mvp") {
            try {
              const created = await ensureUserSchedule(userId);
              if (created) {
                // Si se creó, reintentar la búsqueda después de un breve delay
                setTimeout(() => {
                  fetchDailyQuestion();
                }, 1500);
                return;
              } else {
                // Si no se pudo crear, loguear pero continuar (no bloquear)
                console.warn("⚠️ No se pudo crear el schedule, continuando con búsqueda...");
              }
            } catch (err: any) {
              // Error al crear schedule: loguear pero no bloquear el flujo
              const errorMsg = err?.message || String(err) || "Error desconocido";
              console.warn("⚠️ Error intentando crear schedule (continuando):", errorMsg);
            }
          }
          // Continuar con el flujo normal (fallback a global o mostrar error)
          scheduleError = startDateError;
        } else if (startDateError) {
          // Error real, no solo "no encontrado"
          scheduleError = startDateError;
        } else {
          // Calcular el día del usuario (días transcurridos desde registro + 1)
          const registrationDate = new Date(startDateData.run_date + "T00:00:00");
          const todayDate = new Date(today + "T00:00:00");
          const diffTime = todayDate.getTime() - registrationDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const userDay = diffDays + 1; // Día 1 es el día de registro

          // Limitar a máximo 7 días
          const targetDay = Math.min(Math.max(userDay, 1), 7);

          console.log(`📅 Cálculo de día del usuario:`, {
            registrationDate: startDateData.run_date,
            today,
            diffDays,
            userDay,
            targetDay,
          });

          // Buscar el schedule del día correspondiente
          const { data, error } = await supabase
            .from("r4w_ia_daily_schedule")
            .select(
              `
            id,
            day_number,
            run_date,
            window_start,
            window_end,
            question_id,
            user_id,
            r4w_ia_questions (
              id,
              question,
              options,
              correct_option
            )
          `
            )
            .eq("race_type", raceType)
            .eq("user_id", userId)
            .eq("day_number", targetDay)
            .maybeSingle();

          schedule = data;
          scheduleError = error;

          if (!schedule && !error) {
            // No hay schedule para este día específico, pero el usuario tiene schedule
            // Esto puede pasar si el usuario está en un día que no tiene schedule creado
            console.log(`⚠️ No se encontró schedule para day_number=${targetDay}, pero el usuario tiene schedule`);
            console.log(`   Verificando si el schedule está completo...`);
            
            // Verificar cuántos días tiene el schedule del usuario
            const { data: allSchedules } = await supabase
              .from("r4w_ia_daily_schedule")
              .select("day_number")
              .eq("race_type", raceType)
              .eq("user_id", userId);
            
            if (allSchedules) {
              const days = allSchedules.map(s => s.day_number).sort((a, b) => a - b);
              console.log(`   Días disponibles en schedule:`, days);
              
              // Si falta el día actual, el schedule está incompleto
              if (!days.includes(targetDay)) {
                console.log(`   ⚠️ El schedule está incompleto. Falta el día ${targetDay}`);
              }
            }
          } else if (schedule) {
            console.log(`✅ Schedule encontrado para day_number=${targetDay}`, {
              hasQuestion: !!schedule.r4w_ia_questions,
              windowStart: schedule.window_start,
              windowEnd: schedule.window_end,
            });
          }
        }
      }

      // PASO 2: Fallback a schedule global si no hay personalizado
      if (!schedule && !scheduleError) {
        const { data, error } = await supabase
          .from("r4w_ia_daily_schedule")
          .select(
            `
            id,
            day_number,
            run_date,
            window_start,
            window_end,
            question_id,
            user_id,
            r4w_ia_questions (
              id,
              question,
              options,
              correct_option
            )
          `
          )
          .eq("race_type", raceType)
          .is("user_id", null)
          .eq("run_date", today)
          .maybeSingle();

        schedule = data;
        scheduleError = error;
      }

      // Si hay un error pero es solo "no encontrado", intentar crear schedule
      if (scheduleError) {
        const errorObj = scheduleError as any;
        const errorCode = errorObj?.code;
        const errorMessage = errorObj?.message || errorObj?.error || String(scheduleError) || "Error desconocido";
        
        // Si es un error de "no encontrado" (PGRST116), intentar crear schedule
        if (errorCode === "PGRST116" || 
            errorMessage?.includes("No rows") || 
            errorMessage?.includes("not found")) {
          if (userId && raceType === "7d_mvp") {
            console.log("⚠️ No se encontró schedule, intentando crear uno...");
            try {
              const created = await ensureUserSchedule(userId);
              if (created) {
                setTimeout(() => {
                  fetchDailyQuestion();
                }, 1500);
                return;
              }
            } catch (err) {
              console.warn("⚠️ Error intentando crear schedule:", err instanceof Error ? err.message : String(err));
            }
          }
        } else if (errorCode === "42P01") {
          // Tabla no existe - error crítico
          console.error("❌ La tabla r4w_ia_daily_schedule no existe");
        } else {
          // Otro tipo de error - solo loguear si hay información útil
          if (errorCode || (errorMessage && errorMessage !== "Error desconocido" && errorMessage !== "[object Object]")) {
            console.warn("⚠️ Error obteniendo schedule:", {
              code: errorCode || "sin código",
              message: errorMessage,
            });
          }
          // Si el error es vacío o no tiene información útil, no loguear nada
        }
        
        // Solo mostrar "no_schedule" si el usuario NO está en su primera semana (días 1-7)
        // Durante la primera semana, siempre debe haber una pregunta disponible
        let shouldShowNoSchedule = true;
        if (userId && raceType === "7d_mvp") {
          // Verificar si el usuario está en su primera semana
          try {
            const { data: startDateData } = await supabase
              .from("r4w_ia_daily_schedule")
              .select("run_date")
              .eq("race_type", raceType)
              .eq("user_id", userId)
              .order("run_date", { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (startDateData) {
              const registrationDate = new Date(startDateData.run_date + "T00:00:00");
              const todayDate = new Date(today + "T00:00:00");
              const diffTime = todayDate.getTime() - registrationDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              const userDay = diffDays + 1;
              const isInFirstWeek = userDay >= 1 && userDay <= 7;
              
              if (isInFirstWeek) {
                // Durante la primera semana, intentar crear el schedule en lugar de mostrar error
                console.log(`📅 Usuario en primera semana (día ${userDay}), intentando crear schedule...`);
                shouldShowNoSchedule = false;
                try {
                  const created = await ensureUserSchedule(userId);
                  if (created) {
                    setTimeout(() => {
                      fetchDailyQuestion();
                    }, 1500);
                    return;
                  }
                } catch (err) {
                  console.warn("⚠️ Error creando schedule en primera semana:", err);
                }
              }
            }
          } catch (err) {
            console.warn("⚠️ Error verificando primera semana:", err);
          }
        }
        
        if (shouldShowNoSchedule) {
          setError("no_schedule");
          setLoading(false);
          return;
        }
      }

      // Si no hay schedule pero tampoco hay error, intentar crear uno
      if (!schedule || !schedule.r4w_ia_questions) {
        if (userId && raceType === "7d_mvp") {
          console.log("⚠️ No se encontró schedule o pregunta, intentando crear schedule...");
          try {
            const created = await ensureUserSchedule(userId);
            if (created) {
              setTimeout(() => {
                fetchDailyQuestion();
              }, 1500);
              return;
            }
          } catch (err) {
            console.warn("⚠️ Error intentando crear schedule:", err);
          }
          
          // Verificar si está en primera semana antes de mostrar error
          try {
            const { data: startDateData } = await supabase
              .from("r4w_ia_daily_schedule")
              .select("run_date")
              .eq("race_type", raceType)
              .eq("user_id", userId)
              .order("run_date", { ascending: true })
              .limit(1)
              .maybeSingle();
            
            if (startDateData) {
              const registrationDate = new Date(startDateData.run_date + "T00:00:00");
              const todayDate = new Date(today + "T00:00:00");
              const diffTime = todayDate.getTime() - registrationDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              const userDay = diffDays + 1;
              const isInFirstWeek = userDay >= 1 && userDay <= 7;
              
              if (isInFirstWeek) {
                // Durante la primera semana, no mostrar "no_schedule"
                // En su lugar, mostrar un estado de carga o reintentar
                console.log(`📅 Usuario en primera semana (día ${userDay}), reintentando...`);
                setTimeout(() => {
                  fetchDailyQuestion();
                }, 2000);
                return;
              }
            }
          } catch (err) {
            console.warn("⚠️ Error verificando primera semana:", err);
          }
        }
        setError("no_schedule");
        setLoading(false);
        return;
      }

      const questionData = schedule.r4w_ia_questions as any;
      const windowStart = schedule.window_start as string;
      const windowEnd = schedule.window_end as string;

      // Determinar el estado de la ventana
      const state = getWindowState(currentTime, windowStart, windowEnd);
      setWindowState(state);
      setWindowInfo({
        start: windowStart,
        end: windowEnd,
        currentTime: currentTime,
      });

      // Si estamos antes o después de la ventana, no cargamos la pregunta pero guardamos la info
      if (state === "before") {
        setError("before_window");
        setLoading(false);
        return;
      }

      if (state === "after") {
        setError("after_window");
        setLoading(false);
        return;
      }

      // Si estamos dentro de la ventana, cargamos la pregunta
      // Parsear options si es un string JSON
      let optionsArray: string[] = [];
      if (Array.isArray(questionData.options)) {
        optionsArray = questionData.options;
      } else if (typeof questionData.options === "string") {
        try {
          optionsArray = JSON.parse(questionData.options);
        } catch (e) {
          console.error("Error parseando options:", e);
          optionsArray = [];
        }
      }

      setQuestion({
        questionId: questionData.id,
        question: questionData.question,
        options: optionsArray,
        dayNumber: schedule.day_number,
        windowStart: windowStart,
        windowEnd: windowEnd,
        correctOption: questionData.correct_option,
      });
      setError("active");
      setLoading(false);
    } catch (err) {
      // Solo loguear errores en desarrollo y si tienen información útil
      if (process.env.NODE_ENV === "development") {
        const errorObj = err as any;
        const errorMessage = errorObj?.message || String(err);
        if (errorMessage && errorMessage !== "{}" && errorMessage !== "[object Object]") {
          console.error("Error en useDailyQuestion:", {
            message: errorMessage,
            stack: errorObj?.stack,
            fullError: err,
          });
        }
      }
      // Tratar errores inesperados como "no schedule" en lugar de "error_carga"
      // para no bloquear la UI con mensajes de error
      setError("no_schedule");
      setLoading(false);
    }
  }, [raceType, userId]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    // Carga inicial
    if (isMounted) {
      fetchDailyQuestion();
    }

    // Refrescar cada minuto para detectar cambios de día o entrada en ventana
    intervalId = setInterval(() => {
      if (isMounted) {
        fetchDailyQuestion();
      }
    }, 60000); // Cada 60 segundos

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchDailyQuestion, userId]);

  return { question, loading, error, windowState, windowInfo };
}

