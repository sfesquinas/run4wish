// app/hooks/usePreregistrations.ts
"use client";

import { useEffect, useState } from "react";

export type Prereg = {
  raceId: string;
  createdAt: number;
};

const STORAGE_KEY_PREFIX = "r4w_prereg_by_user:";

export function usePreregistrations(userEmail?: string | null) {
  const storageKey =
    userEmail ? `${STORAGE_KEY_PREFIX}${userEmail}` : `${STORAGE_KEY_PREFIX}anon`;

  const [preregistrations, setPreregistrations] = useState<string[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw) as string[];
      setPreregistrations(arr);
    } catch {
      // silencioso
    }
  }, [storageKey]);

  const addPreregistration = (raceId: string) => {
    // aquí reutiliza tu lógica actual (si ya la tenías en addPrereg)
    setPreregistrations((prev) => {
      if (prev.includes(raceId)) return prev;
      const next = [...prev, raceId];

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      }

      return next;
    });
  };

  return {
    preregistrations,
    addPreregistration,
  };
}