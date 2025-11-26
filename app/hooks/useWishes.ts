// app/hooks/useWishes.ts
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "r4w_demo_wishes";
const DEFAULT_WISHES = 2; // mismo número que en la pregunta demo

export function useWishes() {
  const [wishes, setWishes] = useState<number | null>(null);

  // Cargar de localStorage solo en el cliente
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        setWishes(Number.isNaN(parsed) ? DEFAULT_WISHES : parsed);
      } else {
        setWishes(DEFAULT_WISHES);
        window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_WISHES));
      }
    } catch {
      setWishes(DEFAULT_WISHES);
    }
  }, []);

  const updateWishes = (value: number | ((prev: number) => number)) => {
    setWishes((prevRaw) => {
      const prev = prevRaw ?? DEFAULT_WISHES;
      const next =
        typeof value === "function" ? (value as (p: number) => number)(prev) : value;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const resetWishes = () => {
    updateWishes(DEFAULT_WISHES);
  };

  return {
    wishes: (wishes ?? DEFAULT_WISHES),
    setWishes: updateWishes,
    resetWishes,
    isReady: wishes !== null,
  };
}