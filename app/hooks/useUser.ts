// app/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";

export type R4WUser = {
  email: string;
  birthYear: number;
  country: string;
  avatarId: string;
  createdAt: number;
  verified: boolean;
};

const STORAGE_KEY = "r4w_user";

export function useUser() {
  const [user, setUserState] = useState<R4WUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  // cargar del localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as R4WUser;
      setUserState(parsed);
    } catch {
      // nada
    } finally {
      setIsReady(true);
    }
  }, []);

  const setUser = (next: R4WUser | null) => {
    setUserState(next);
    if (typeof window === "undefined") return;

    if (next) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const logout = () => setUser(null);

  return { user, setUser, logout, isReady };
}