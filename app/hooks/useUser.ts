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
  const logout = () => {
    // Limpia el perfil guardado del usuario en localStorage (ajusta la clave si es otra)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("r4w_user");
      window.localStorage.removeItem("r4w_profile");
    }
  
    // Borra el usuario de memoria
    setUser(null);
  
    // Llévale a la portada o a la pantalla de acceso
    window.location.href = "/";
  };

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

  return { user, setUser, logout, isReady, };
}

export function preregisterRace(raceId: string, wishesCost: number) {
  if (typeof window === "undefined") return false;

  const raw = localStorage.getItem("r4w_user_data");
  if (!raw) return false;

  const data = JSON.parse(raw);

  // Validación de wishes
  if ((data.wishes ?? 0) < wishesCost) {
    return "NO_WISHES";
  }

  // Restamos wishes
  data.wishes = (data.wishes ?? 0) - wishesCost;

  // Guardamos preregistro
  data.preregistrations = [...(data.preregistrations ?? []), raceId];

  localStorage.setItem("r4w_user_data", JSON.stringify(data));
  return "OK";
}