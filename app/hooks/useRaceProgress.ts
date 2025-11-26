// app/hooks/useRaceProgress.ts
"use client";

import { useEffect, useState } from "react";

type RaceProgress = {
  daysPlayed: number;      // días transcurridos desde inicio (máx daysTotal)
  currentDayIndex: number; // 0-based
  answeredToday: boolean;
  markAnsweredToday: () => void;
};

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function diffDays(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(toISO + "T00:00:00");
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function useRaceProgress(raceId: string, daysTotal: number): RaceProgress {
  const [daysPlayed, setDaysPlayed] = useState(1);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [answeredToday, setAnsweredToday] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const today = getTodayStr();
    const startKey = `r4w_race_${raceId}_start_date`;
    const answeredKey = `r4w_race_${raceId}_answered_${today}`;

    let startDate = window.localStorage.getItem(startKey);
    if (!startDate) {
      // Primera vez que entra en esta carrera → hoy es el día 1
      startDate = today;
      window.localStorage.setItem(startKey, startDate);
    }

    const delta = diffDays(startDate, today);
    const idx = Math.min(delta, daysTotal - 1);
    setCurrentDayIndex(idx);
    setDaysPlayed(idx + 1);

    const answeredFlag = window.localStorage.getItem(answeredKey);
    setAnsweredToday(!!answeredFlag);
  }, [raceId, daysTotal]);

  const markAnsweredToday = () => {
    if (typeof window === "undefined") return;
    const today = getTodayStr();
    const answeredKey = `r4w_race_${raceId}_answered_${today}`;
    window.localStorage.setItem(answeredKey, "1");
    setAnsweredToday(true);
  };

  return {
    daysPlayed,
    currentDayIndex,
    answeredToday,
    markAnsweredToday,
  };
}