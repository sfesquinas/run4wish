"use client";

import { useEffect, useState } from "react";

type StreakState = {
  current: number;
  best: number;
  lastAnsweredDate: string | null; // "YYYY-MM-DD"
};

const STORAGE_KEY = "r4w_streak_v1";

function loadInitial(): StreakState {
  if (typeof window === "undefined") {
    return { current: 0, best: 0, lastAnsweredDate: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { current: 0, best: 0, lastAnsweredDate: null };
    }
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return {
      current: parsed.current ?? 0,
      best: parsed.best ?? 0,
      lastAnsweredDate: parsed.lastAnsweredDate ?? null,
    };
  } catch {
    return { current: 0, best: 0, lastAnsweredDate: null };
  }
}

function saveState(next: StreakState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // silencioso
  }
}

function getTodayYMD() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function diffInDays(a: string, b: string) {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86400000);
}

/**
 * Racha = número de días seguidos en los que ha respondido la PREGUNTA CORRECTAMENTE.
 */
export function useStreak() {
  const [streak, setStreak] = useState<StreakState | null>(null);

  // Cargar de localStorage al montar
  useEffect(() => {
    const initial = loadInitial();
    setStreak(initial);
  }, []);

  const registerCorrectAnswer = () => {
    if (!streak) return;

    const today = getTodayYMD();

    // Si ya respondió bien hoy, no sumamos nada
    if (streak.lastAnsweredDate === today) {
      return;
    }

    let nextCurrent = 1;

    if (streak.lastAnsweredDate) {
      const diff = diffInDays(streak.lastAnsweredDate, today);
      if (diff === 1) {
        // Ayer también respondió → continúa racha
        nextCurrent = streak.current + 1;
      } else {
        // Han pasado varios días → racha se reinicia
        nextCurrent = 1;
      }
    }

    const next: StreakState = {
      current: nextCurrent,
      best: Math.max(streak.best, nextCurrent),
      lastAnsweredDate: today,
    };

    setStreak(next);
    saveState(next);
  };

  return {
    currentStreak: streak?.current ?? 0,
    bestStreak: streak?.best ?? 0,
    registerCorrectAnswer,
    isReady: !!streak,
  };
}