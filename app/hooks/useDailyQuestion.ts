"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "./useUser";
import { getWindowState } from "../lib/questionHelpers";
import { ensureUserSchedule } from "../lib/checkUserSchedule";
import { getSlotNumberFromHour } from "../lib/userSchedule24h";

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

export type QuestionWindowState =
  | "before_window"
  | "active"
  | "after_window"
  | "no_schedule"
  | "error_carga";

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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function getCurrentTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function useDailyQuestion(
  raceType: "7d_mvp" | "24h_sprint" = "7d_mvp"
): DailyQuestionState {
  const { user, isReady } = useUser() as any;
  const userId = user?.id || null;

  const executedRef = useRef(false);

  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<QuestionWindowState | null>(null);
  const [windowState, setWindowState] = useState<"before" | "active" | "after" | null>(
    null
  );
  const [windowInfo, setWindowInfo] = useState<{
    start: string;
    end: string;
    currentTime: string;
  } | null>(null);

  const fetchDailyQuestion = useCallback(async () => {
    if (!isReady) return;

    // Evitar doble ejecución
    if (executedRef.current) return;
    executedRef.current = true;

    console.log("useDailyQuestion inicializado", { raceType, userId });

    setLoading(true);
    setError(null);
    setWindowState(null);
    setWindowInfo(null);

    const today = getTodayDate();
    const currentTime = getCurrentTime();
    const currentHour = Number(currentTime.split(":")[0]);

    /*
     * LÓGICA PARA 24H SPRINT
     */
    if (raceType === "24h_sprint") {
      try {
        if (!userId) {
          setError("no_schedule");
          setLoading(false);
          executedRef.current = false;
          return;
        }

        // Antes de la ventana 09:00–21:00
        if (currentHour < 9) {
          setError("before_window");
          setWindowState("before");
          setWindowInfo({
            start: "09:00:00",
            end: "21:00:00",
            currentTime
          });
          setLoading(false);
          executedRef.current = false;
          return;
        }

        const currentSlot = getSlotNumberFromHour(currentHour);

        // Después de la ventana
        if (!currentSlot) {
          setError("after_window");
          setWindowState("after");
          setWindowInfo({
            start: "09:00:00",
            end: "21:00:00",
            currentTime
          });
          setLoading(false);
          executedRef.current = false;
          return;
        }

        // Asegurar schedules creados
        const ok = await ensureUserSchedule(userId, "24h_sprint");
        if (!ok) {
          setError("no_schedule");
          setLoading(false);
          executedRef.current = false;
          return;
        }

        // Buscar schedule del slot actual
        console.log("Buscando schedule 24h", { userId, today, currentSlot });

        const { data: scheduleData, error: scheduleError } = await supabase
          .from("r4w_ia_daily_schedule")
          .select("*")
          .eq("race_type", "24h_sprint")
          .eq("user_id", userId)
          .eq("run_date", today)
          .eq("slot_number", currentSlot)
          .limit(1)
          .maybeSingle();

        if (scheduleError) {
          console.error("Error schedule 24h", scheduleError);
          setError("error_carga");
          setLoading(false);
          executedRef.current = false;
          return;
        }

        if (!scheduleData || !scheduleData.bank_question_id) {
          console.warn("24h_sprint: schedule vacío o sin bank_question_id");
          setError("no_schedule");
          setLoading(false);
          executedRef.current = false;
          return;
        }

        // Obtener pregunta del banco
        const { data: questionData, error: qError } = await supabase
          .from("r4w_question_bank")
          .select("id, question_text, option_a, option_b, option_c, correct_option")
          .eq("id", scheduleData.bank_question_id)
          .maybeSingle();

        if (qError || !questionData) {
          console.error("Error pregunta banco", qError);
          setError("error_carga");
          setLoading(false);
          executedRef.current = false;
          return;
        }

        const windowStart = scheduleData.window_start as string;
        const windowEnd = scheduleData.window_end as string;

        const state = getWindowState(currentTime, windowStart, windowEnd);

        if (state === "before") {
          setError("before_window");
          setWindowState("before");
          setWindowInfo({
            start: windowStart,
            end: windowEnd,
            currentTime
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
            currentTime
          });
          setLoading(false);
          executedRef.current = false;
          return;
        }

        const normalized: DailyQuestion = {
          questionId: questionData.id,
          scheduleId: scheduleData.id as number,
          question: questionData.question_text,
          options: [questionData.option_a, questionData.option_b, questionData.option_c],
          dayNumber: scheduleData.day_number,
          windowStart,
          windowEnd,
          correctOption: questionData.correct_option
        };

        console.log("Pregunta 24h normalizada", normalized);

        setQuestion(normalized);
        setWindowState("active");
        setWindowInfo({
          start: windowStart,
          end: windowEnd,
          currentTime
        });
        setError(null);
        setLoading(false);
        executedRef.current = false;
        return;
      } catch (err) {
        console.error("Error crítico 24h_sprint", err);
        setError("error_carga");
        setLoading(false);
        executedRef.current = false;
        return;
      }
    }

    /*
     * LÓGICA PARA 7D MVP (ahora usando r4w_question_bank igual que 24h_sprint)
     */
    try {
      if (!userId) {
        setError("no_schedule");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      // Asegurar schedules creados
      const ok = await ensureUserSchedule(userId, "7d_mvp");
      if (!ok) {
        setError("no_schedule");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      // Buscar schedule del día actual (slot_number = 1 para 7d_mvp)
      // Necesitamos calcular qué día es hoy basado en el día 1 del schedule
      const { data: schedules, error: schedulesError } = await supabase
        .from("r4w_ia_daily_schedule")
        .select("id, day_number, run_date, window_start, window_end, bank_question_id, question_id")
        .eq("race_type", raceType)
        .eq("user_id", userId)
        .eq("slot_number", 1) // Para 7d_mvp, siempre slot_number = 1
        .order("day_number", { ascending: true });

      if (schedulesError || !schedules || schedules.length === 0) {
        console.warn("No schedule 7d_mvp encontrado", schedulesError);
        setError("no_schedule");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      // Calcular qué día es hoy (basado en run_date del día 1)
      const firstSchedule = schedules[0];
      const firstRunDate = firstSchedule.run_date as string;
      const today = getTodayDate();
      
      // Calcular diferencia de días
      const firstDate = new Date(firstRunDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - firstDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // day_number es 1-based, así que diffDays 0 = día 1, diffDays 1 = día 2, etc.
      const currentDayNumber = Math.min(diffDays + 1, 7); // Máximo día 7
      
      // Buscar el schedule del día actual
      const schedule = schedules.find(s => s.day_number === currentDayNumber);
      
      if (!schedule) {
        console.warn(`No schedule encontrado para día ${currentDayNumber} en 7d_mvp`);
        setError("no_schedule");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      // Verificar si tiene bank_question_id (nuevo sistema) o question_id (sistema antiguo)
      if (!schedule.bank_question_id) {
        if (schedule.question_id) {
          console.warn("⚠️ Schedule legacy 7d_mvp con question_id pero sin bank_question_id", {
            scheduleId: schedule.id,
            dayNumber: schedule.day_number,
            questionId: schedule.question_id,
            userId,
          });
          console.warn("Este schedule necesita regenerarse usando el endpoint admin.");
        } else {
          console.warn("⚠️ Schedule 7d_mvp sin bank_question_id ni question_id", {
            scheduleId: schedule.id,
            dayNumber: schedule.day_number,
            userId,
          });
        }
        setError("no_schedule");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      // Obtener pregunta del banco
      const { data: questionData, error: qError } = await supabase
        .from("r4w_question_bank")
        .select("id, question_text, option_a, option_b, option_c, correct_option")
        .eq("id", schedule.bank_question_id)
        .maybeSingle();

      if (qError || !questionData) {
        console.error("Error obteniendo pregunta del banco para 7d_mvp", qError);
        setError("error_carga");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      const windowStart = schedule.window_start as string;
      const windowEnd = schedule.window_end as string;

      const state = getWindowState(currentTime, windowStart, windowEnd);
      setWindowState(state);
      setWindowInfo({
        start: windowStart,
        end: windowEnd,
        currentTime
      });

      if (state === "before") {
        setError("before_window");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      if (state === "after") {
        setError("after_window");
        setLoading(false);
        executedRef.current = false;
        return;
      }

      // Construir el objeto DailyQuestion desde el banco
      const normalized7d: DailyQuestion = {
        questionId: questionData.id,
        scheduleId: schedule.id as number,
        question: questionData.question_text,
        options: [questionData.option_a, questionData.option_b, questionData.option_c],
        dayNumber: schedule.day_number,
        windowStart,
        windowEnd,
        correctOption: questionData.correct_option
      };

      console.log("Pregunta 7d_mvp normalizada desde banco", normalized7d);

      setQuestion(normalized7d);
      setError(null);
      setLoading(false);
      executedRef.current = false;
    } catch (err) {
      console.error("Error general 7d_mvp", err);
      setError("error_carga");
      setLoading(false);
      executedRef.current = false;
    }
  }, [raceType, isReady, userId]);

  useEffect(() => {
    if (!isReady) return;

    executedRef.current = false;
    fetchDailyQuestion();

    const interval = setInterval(() => {
      executedRef.current = false;
      fetchDailyQuestion();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDailyQuestion, isReady]);

  return { question, loading, error, windowState, windowInfo };
}
