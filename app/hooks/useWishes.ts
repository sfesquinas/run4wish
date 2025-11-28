























































































"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type UseWishesResult = {
  wishes: number;
  setWishes: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  refreshWishes: () => Promise<void>;
  addWishes: (amount: number) => Promise<void>;
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
          .from("profiles")
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
  }, [userId]);

  // 🔄 Guardar en Supabase (si hay usuario)
  const persist = async (newWishes: number) => {
    setWishes(newWishes);
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ wishes: newWishes })
      .eq("id", userId);

    if (error) {
      console.error("Error actualizando wishes:", error.message);
    }
  };

  const addWishes = async (amount: number) => {
    const next = wishes + amount;
    await persist(next);
  };

  const resetWishes = async (value: number = DEFAULT_WISHES) => {
    await persist(value);
  };

  const refreshWishes = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
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

  return { wishes, setWishes, loading, refreshWishes, addWishes, resetWishes };
}