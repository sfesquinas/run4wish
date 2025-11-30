























































































"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type UseWishesResult = {
  wishes: number;
  setWishes: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  refreshWishes: () => Promise<void>;
  addWishes: (amount: number) => Promise<void>;
  subtractWishes: (amount: number) => Promise<void>;
  resetWishes: (value?: number) => Promise<void>;
};

const DEFAULT_WISHES = 5;

export function useWishes(userId: string | null): UseWishesResult {
  const [wishes, setWishes] = useState<number>(DEFAULT_WISHES);
  const [loading, setLoading] = useState<boolean>(false);

  // 🧡 Cargar wishes desde Supabase cuando tengamos usuario
  useEffect(() => {
    if (!userId) {
      setWishes(DEFAULT_WISHES);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("r4w_profiles")
          .select("wishes")
          .eq("id", userId)
          .single();

        if (error) {
          console.warn("No se han podido cargar los wishes:", error.message);
          return;
        }

        if (typeof data?.wishes === "number") {
          setWishes(data.wishes);
        }
      } finally {
        setLoading(false);
      }
    };

    load();

    // Escuchar eventos de actualización de wishes desde otros componentes
    const handleWishesUpdate = (event: CustomEvent) => {
      if (event.detail?.wishes !== undefined) {
        setWishes(event.detail.wishes);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("r4w-wishes-updated", handleWishesUpdate as EventListener);
      return () => {
        window.removeEventListener("r4w-wishes-updated", handleWishesUpdate as EventListener);
      };
    }
  }, [userId]);

  // 🔄 Guardar en Supabase (si hay usuario)
  const persist = async (newWishes: number) => {
    setWishes(newWishes);
    if (!userId) return;

    const { error } = await supabase
      .from("r4w_profiles")
      .update({ wishes: newWishes })
      .eq("id", userId);

    if (error) {
      console.error("Error actualizando wishes:", error.message);
      return;
    }

    // Disparar evento personalizado para sincronizar otros componentes
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("r4w-wishes-updated", { detail: { wishes: newWishes } }));
    }
  };

  const addWishes = async (amount: number) => {
    const next = wishes + amount;
    await persist(next);
  };

  const subtractWishes = async (amount: number) => {
    const next = Math.max(0, wishes - amount);
    await persist(next);
  };

  const resetWishes = async (value: number = DEFAULT_WISHES) => {
    await persist(value);
  };

  const refreshWishes = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("r4w_profiles")
      .select("wishes")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error recargando wishes:", error.message);
      return;
    }

    if (typeof data?.wishes === "number") {
      setWishes(data.wishes);
    }
  };

  return { wishes, setWishes, loading, refreshWishes, addWishes, subtractWishes, resetWishes };
}