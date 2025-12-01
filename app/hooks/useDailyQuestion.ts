"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "./useUser";
import { getWindowState } from "../lib/questionHelpers";
import { ensureUserSchedule } from "../lib/checkUserSchedule";
import { getSlotNumberFromHour } from "../lib/userSchedule24h";
import { createUserScheduleFor24h } from "../lib/userSchedule24h";

export type DailyQuestion = {
  questionId: string;
  scheduleId: number;
  question: string;
  options: string[];
  dayNumber: number;
  windowStart: string;
  windowEnd: string;
  correctOption: string;
};

export type QuestionWindowState = "before_window" | "active" | "after_window" | "no_schedule" | "error_carga";

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

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Hook para obtener la pregunta del día desde Supabase
 * Verifica que esté dentro de la ventana horaria (window_start - window_end)
 * Soporta múltiples tipos de carrera y detecta cambios automáticamente
 * Prioriza schedules personalizados por usuario sobre schedules globales
 */
export function useDailyQuestion(raceType: "7d_mvp" | "24h_sprint" = "7d_mvp"): DailyQuestionState {
  const { user, isReady } = useUser() as any;
  const userId = user?.id || null;
  const executedRef = useRef(false);
  
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
    if (!isReady) {
      setLoading(true);
      return;
    }

    // Prevenir ejecuciones simultáneas, pero permitir reintentos después de un delay
    if (executedRef.current) {
      console.log("⏸️ fetchDailyQuestion ya en ejecución, saltando...");
      return;
    }

    console.log("🔍 useDailyQuestion inicializado", { raceType, userId });
    executedRef.current = true;
    setLoading(true);
    setError(null);
    setWindowState(null);
    setWindowInfo(null);

    try {
      const today = getTodayDate();
      const currentTime = getCurrentTime();

      // Lógica específica para 24h_sprint
      if (raceType === "24h_sprint") {
        try {
          // Verificar que hay userId
          if (!userId) {
            console.warn("⚠️ 24h_sprint: no hay userId");
            setQuestion(null);
            setError("no_schedule");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 1) Comprobar hora actual
          const currentHour = parseInt(currentTime.split(":")[0], 10);

          // 2) Si antes de 09:00 → before_window
          if (currentHour < 9) {
            setError("before_window");
            setWindowState("before");
            setWindowInfo({
              start: "09:00:00",
              end: "21:00:00",
              currentTime: currentTime,
            });
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 3) Calcular slot actual (09-10 → 1, 10-11 → 2, ..., 20-21 → 12)
          const currentSlot = getSlotNumberFromHour(currentHour);

          // 4) Si después de 21:00 → after_window
          if (currentSlot === null) {
            setError("after_window");
            setWindowState("after");
            setWindowInfo({
              start: "09:00:00",
              end: "21:00:00",
              currentTime: currentTime,
            });
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 5) Asegurar que los schedules existen
          const ok = await ensureUserSchedule(userId, "24h_sprint");
          if (!ok) {
            console.error("❌ ensureUserSchedule devolvió false para 24h_sprint", { userId });
            setQuestion(null);
            setError("no_schedule");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 6) Buscar schedule para el slot actual - SIEMPRE filtrar por user_id
          console.log("🔎 Buscando schedule 24h", { userId, today, currentSlot });
          const { data: scheduleData, error: scheduleQueryError } = await supabase
            .from("r4w_ia_daily_schedule")
            .select("*")
            .eq("race_type", "24h_sprint")
            .eq("user_id", userId)
            .eq("run_date", today)
            .eq("slot_number", currentSlot)
            .limit(1)
            .maybeSingle();

          // 7) Si hay error en la query
          if (scheduleQueryError) {
            console.error("❌ Error obteniendo schedule 24h", {
              message: scheduleQueryError.message,
              details: scheduleQueryError.details,
              hint: scheduleQueryError.hint,
              code: scheduleQueryError.code,
              userId,
              today,
              currentSlot,
            });
            setQuestion(null);
            setError("error_carga");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 8) Si no hay schedule
          if (!scheduleData) {
            console.warn("⚠️ 24h_sprint: no hay schedule válido para este slot", { userId, currentSlot, today });
            setQuestion(null);
            setError("no_schedule");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          console.log("✅ 24h_sprint schedule encontrado", scheduleData);

          // 9) Si bank_question_id es null
          if (!scheduleData.bank_question_id) {
            console.warn("⚠️ 24h_sprint: no hay schedule válido para este slot (bank_question_id es NULL)", {
              scheduleId: scheduleData.id,
              userId,
              slotNumber: currentSlot,
            });
            setQuestion(null);
            setError("no_schedule");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 10) Obtener pregunta del banco
          console.log("🔁 24h_sprint leyendo pregunta", { bankQuestionId: scheduleData.bank_question_id });
          const { data: questionData, error: questionError } = await supabase
            .from("r4w_question_bank")
            .select("id, question_text, option_a, option_b, option_c, correct_option")
            .eq("id", scheduleData.bank_question_id)
            .single();

          // 11) Si hay error obteniendo la pregunta
          if (questionError) {
            console.error("❌ 24h_sprint: error o pregunta no encontrada en r4w_question_bank", {
              bank_question_id: scheduleData.bank_question_id,
              bankError: {
                message: questionError.message,
                details: questionError.details,
                hint: questionError.hint,
                code: questionError.code,
              },
              bankData: null,
            });
            setQuestion(null);
            setError("error_carga");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // 12) Si no hay pregunta
          if (!questionData) {
            console.error("❌ 24h_sprint: error o pregunta no encontrada en r4w_question_bank", {
              bank_question_id: scheduleData.bank_question_id,
              bankError: questionError,
              bankData: questionData,
            });
            setQuestion(null);
            setError("error_carga");
            setWindowState(null);
            setLoading(false);
            executedRef.current = false;
            return;
          }

          console.log("✅ 24h_sprint pregunta cargada", questionData);

          // 13) Construir objeto question normalizado
          const windowStart = scheduleData.window_start as string;
          const windowEnd = scheduleData.window_end as string;

          // Verificar estado de ventana ANTES de construir la pregunta
          const state = getWindowState(currentTime, windowStart, windowEnd);
          
          if (state === "before") {
            setError("before_window");
            setWindowState("before");
            setWindowInfo({
              start: windowStart,
              end: windowEnd,
              currentTime: currentTime,
            });
            setLoading(false);
            executedRef.current = false;
            return;
          }

          if (state === "after") {
            setError("after_window");
            setWindowState("after");
            setWindowInfo({
              start: windowStart,
              end: windowEnd,
              currentTime: currentTime,
            });
            setLoading(false);
            executedRef.current = false;
            return;
          }

          // Construir opciones como array de strings
          const optionsArray = [questionData.option_a, questionData.option_b, questionData.option_c];

          // Construir objeto normalizado
          const normalizedQuestion: DailyQuestion = {
            questionId: questionData.id,
            scheduleId: scheduleData.id as number,
            question: questionData.question_text,
            options: optionsArray,
            dayNumber: scheduleData.day_number,
            windowStart: windowStart,
            windowEnd: windowEnd,
            correctOption: questionData.correct_option,
          };

          console.log("🎯 24h_sprint pregunta normalizada", normalizedQuestion);

          // Establecer estados en el orden correcto
          setQuestion(normalizedQuestion);
          setWindowState("active");
          setWindowInfo({
            start: windowStart,
            end: windowEnd,
            currentTime: currentTime,
          });
          setError(null);
          setLoading(false);
          executedRef.current = false;
          return;
        } catch (err: any) {
          console.error("❌ Error crítico en 24h_sprint:", {
            message: err?.message || String(err),
            stack: err?.stack,
          });
          setQuestion(null);
          setError("error_carga");
          setWindowState(null);
          setLoading(false);
          executedRef.current = false;
          return;
        } finally {
          // Garantizar que loading siempre se pone a false
          // (aunque ya se haya puesto en cada return, esto es una seguridad extra)
        }
      }

      // Lógica para 7d_mvp (comportamiento original)
      let schedule = null;
      let scheduleError = null;
      let shouldShowNoSchedule = true;

      if (userId) {
        const { data: startDateData, error: startDateError } = await supabase
          .from("r4w_ia_daily_schedule")
          .select("run_date")
          .eq("race_type", raceType)
          .eq("user_id", userId)
          .order("run_date", { ascending: true })
          .order("slot_number", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!startDateData || (startDateError && (startDateError as any).code === "PGRST116")) {
          console.log("⚠️ No se encontró schedule para el usuario, intentando crear uno...");
          if (raceType === "7d_mvp") {
            try {
              const created = await ensureUserSchedule(userId, raceType);
              if (created) {
                setTimeout(() => {
                  fetchDailyQuestion();
                }, 1500);
                return;
              } else {
                console.warn("⚠️ No se pudo crear el schedule, continuando con búsqueda...");
              }
            } catch (err: any) {
              const errorMsg = err?.message || String(err) || "Error desconocido";
              console.warn("⚠️ Error intentando crear schedule (continuando):", errorMsg);
            }
          }
          scheduleError = startDateError;
        } else if (startDateError) {
          scheduleError = startDateError;
        } else {
          // Lógica para 7d_mvp (comportamiento original)
          const registrationDate = new Date(startDateData.run_date + "T00:00:00");
          const todayDate = new Date(today + "T00:00:00");
          const diffTime = todayDate.getTime() - registrationDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const userDay = diffDays + 1;
          const targetDay = Math.min(Math.max(userDay, 1), 7);

          if (userDay >= 1 && userDay <= 7) {
            shouldShowNoSchedule = false;
          }

          // Para 7d_mvp, siempre usar slot_number = 1
          const slotNumber = 1;
          
          // Primero, verificar si hay múltiples slots para este día (solo para logging)
          const { data: allSlotsForDay } = await supabase
            .from("r4w_ia_daily_schedule")
            .select("slot_number")
            .eq("race_type", raceType)
            .eq("user_id", userId)
            .eq("day_number", targetDay);
          
          if (allSlotsForDay && allSlotsForDay.length > 1) {
            const slots = allSlotsForDay.map(s => s.slot_number).sort((a, b) => a - b);
            console.log("Slots detectados hoy:", slots);
          }
          
        const { data, error } = await supabase
          .from("r4w_ia_daily_schedule")
          .select(
              `id, day_number, run_date, window_start, window_end, question_id, slot_number, r4w_ia_questions (id, question, options, correct_option)`
          )
          .eq("race_type", raceType)
            .eq("user_id", userId)
            .eq("day_number", targetDay)
            .eq("slot_number", slotNumber)
            .order("slot_number", { ascending: true })
          .maybeSingle();

        schedule = data;
        scheduleError = error;
        }
      }

      if (scheduleError) {
        const errorObj = scheduleError as any;
        const errorCode = errorObj?.code;
        const errorMessage = errorObj?.message || errorObj?.error || String(scheduleError) || "Error desconocido";

        if (errorCode === "PGRST116" || errorMessage?.includes("No rows") || errorMessage?.includes("not found")) {
          if (userId && raceType === "7d_mvp") {
            console.log("⚠️ No se encontró schedule, intentando crear uno...");
            try {
              const created = await ensureUserSchedule(userId, raceType);
              if (created) {
                setTimeout(() => {
                  fetchDailyQuestion();
                }, 1500);
                return;
              } else {
                // Si no se pudo crear, mostrar error
                setError("no_schedule");
                setLoading(false);
                return;
              }
            } catch (err) {
              console.warn("⚠️ Error intentando crear schedule:", err instanceof Error ? err.message : String(err));
              setError("no_schedule");
              setLoading(false);
              return;
            }
          } else {
            // No hay userId o raceType no soportado
            setError("no_schedule");
            setLoading(false);
            return;
          }
        } else if (errorCode === "42P01") {
          console.error("❌ La tabla r4w_ia_daily_schedule no existe");
          setError("error_carga");
          setLoading(false);
          return;
        } else {
          if (errorCode || (errorMessage && errorMessage !== "Error desconocido" && errorMessage !== "[object Object]")) {
            console.warn("⚠️ Error obteniendo schedule:", {
              code: errorCode || "sin código",
            message: errorMessage,
            });
          }
          // Cualquier otro error: mostrar error_carga
          setError("error_carga");
        setLoading(false);
        return;
        }
      }

      // Verificar que tenemos schedule y pregunta válida
      // Para 7d_mvp: schedule.r4w_ia_questions debe existir
      // Para 24h_sprint: schedule.r4w_ia_questions debe existir (ya convertido desde r4w_question_bank)
      if (!schedule || !schedule.r4w_ia_questions) {
        if (userId && raceType === "7d_mvp") {
          console.log("⚠️ No se encontró schedule o pregunta (7d_mvp), intentando crear schedule...");
          try {
            const created = await ensureUserSchedule(userId, raceType);
            if (created) {
              setTimeout(() => {
                fetchDailyQuestion();
              }, 1500);
              return;
            }
          } catch (err) {
            console.warn("⚠️ Error intentando crear schedule (7d_mvp):", err);
          }
        }
        if (shouldShowNoSchedule) {
        setError("no_schedule");
        setLoading(false);
        return;
        } else {
          // Si no debería mostrar no_schedule pero no hay schedule, mostrar error
          setError("error_carga");
          setLoading(false);
          return;
        }
      }

      const questionData = schedule.r4w_ia_questions as any;
      const windowStart = schedule.window_start as string;
      const windowEnd = schedule.window_end as string;

      const state = getWindowState(currentTime, windowStart, windowEnd);
      setWindowState(state);
      setWindowInfo({
        start: windowStart,
        end: windowEnd,
        currentTime: currentTime,
      });

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
        scheduleId: schedule.id as number,
        question: questionData.question,
        options: optionsArray,
        dayNumber: schedule.day_number,
        windowStart: windowStart,
        windowEnd: windowEnd,
        correctOption: questionData.correct_option,
      });
      setError(null); // Limpiar error cuando la pregunta se carga correctamente
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error general en fetchDailyQuestion:", {
        message: err?.message || String(err),
        stack: err?.stack,
        raceType,
      });
      setError("error_carga");
      setWindowState(null);
      setLoading(false);
      executedRef.current = false;
    } finally {
      // Garantizar que loading siempre se pone a false (solo si no se ha establecido ya)
      // El flag executedRef se resetea en cada return o en el catch
    }
  }, [raceType, userId, isReady]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    if (isMounted && isReady) {
      executedRef.current = false; // Reset flag cuando cambia userId o raceType
      fetchDailyQuestion();
    }

    intervalId = setInterval(() => {
      if (isMounted && isReady) {
        executedRef.current = false; // Reset flag para el intervalo
        fetchDailyQuestion();
      }
    }, 60000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchDailyQuestion, userId, isReady, raceType]);

  return { question, loading, error, windowState, windowInfo };
}
