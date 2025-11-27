// app/hooks/useWishes.ts
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "r4w_wishes_demo";

// Estado global (compartido por todos los componentes)
let wishesStore = 0;
let initialized = false;
let listeners: Array<(value: number) => void> = [];

function loadInitialWishes() {
  if (initialized) return wishesStore;
  initialized = true;

  if (typeof window === "undefined") {
    wishesStore = 0;
    return wishesStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  wishesStore = raw ? Number(raw) || 0 : 0;
  return wishesStore;
}

function updateStore(next: number) {
  wishesStore = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }
  listeners.forEach((l) => l(next));
}

export function useWishes() {
  const [wishes, setWishesState] = useState<number>(() => loadInitialWishes());

  // Suscribimos este componente a los cambios globales
  useEffect(() => {
    const listener = (value: number) => setWishesState(value);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const setWishes = (
    updater: number | ((prev: number) => number)
  ): void => {
    const next =
      typeof updater === "function"
        ? (updater as (p: number) => number)(wishesStore)
        : updater;
    updateStore(next);
  };

  const resetWishes = () => {
    updateStore(0);
  };

  return { wishes, setWishes, resetWishes };
}