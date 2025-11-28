// app/hooks/useWishes.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Hook de wishes REAL por usuario.
 *
 * - userId: id del usuario de Supabase (auth.user.id)
 * - Si no hay userId, funciona en modo "demo" solo en memoria.
 */
export function useWishes(userId: string | null) {
  const [wishes, setWishesState] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchWishes = useCallback(async () => {
    if (!userId) {
      // Sin usuario: dejamos el saldo en 0 (demo / no loggeado)
      setWishesState(0);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("r4w_profiles")
      .select("wishes")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error cargando wishes:", error);
    } else if (data) {
      setWishesState(data.wishes ?? 0);
    }

    setLoading(false);
  }, [userId]);

  // Cargar wishes cuando tengamos userId
  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  /**
   * setWishes recibe una función (prev => next),
   * igual que estabas usando antes.
   * Actualiza estado Y Supabase a la vez.
   */
  const setWishes = useCallback(
    (updater: (prev: number) => number) => {
      // Actualizamos inmediatamente en UI
      setWishesState((prev) => {
        const next = updater(prev);

        // Si hay usuario, guardamos en Supabase (fire-and-forget)
        if (userId) {
          supabase
            .from("r4w_profiles")
            .update({ wishes: next })
            .eq("id", userId)
            .then(({ error }) => {
              if (error) {
                console.error("Error guardando wishes:", error);
              }
            });
        }

        return next;
      });
    },
    [userId]
  );

  return {
    wishes,
    setWishes,
    loading,
    refreshWishes: fetchWishes,
  };
}