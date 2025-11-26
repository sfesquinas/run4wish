// app/hooks/usePreregistrations.ts
"use client";

import { useEffect, useState } from "react";

export type Prereg = {
  raceId: string;
  createdAt: number;
};

const STORAGE_KEY = "r4w_preregistrations_v1";

export function usePreregistrations() {
  const [preregs, setPreregs] = useState<Prereg[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPreregs(JSON.parse(raw) as Prereg[]);
      }
    } catch {
      setPreregs([]);
    } finally {
      setIsReady(true);
    }
  }, []);

  const addPrereg = (raceId: string) => {
    setPreregs((prev) => {
      if (prev.some((p) => p.raceId === raceId)) return prev;
      const next = [...prev, { raceId, createdAt: Date.now() }];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  return { preregistrations: preregs, addPrereg, isReady };
}