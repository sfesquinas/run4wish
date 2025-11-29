"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "./useUser";

type UseStreakResult = {
  streak: number;
  loading: boolean;
  registerCorrectAnswer: () => Promise<void>;
};

export function useStreak(): UseStreakResult {
  const { user, isReady } = useUser() as any;
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // 1) Cargar la racha actual cuando haya usuario
  useEffect(() => {
    if (!isReady || !user) return;

    const loadStreak = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("streaks")                 // tabla que crearemos más adelante
          .select("current_streak")
          .eq("user_id", user.id)
          .single();

        if (!error && data?.current_streak != null) {
          setStreak(data.current_streak);
        } else {
          // si no hay registro todavía, empezamos en 0
          setStreak(0);
        }
      } catch (err) {
        console.error("Error cargando racha:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStreak();
  }, [isReady, user]);

  // 2) Registrar que ha contestado bien (se usa en PreguntaPage)
  const registerCorrectAnswer = async () => {
    if (!user) return;

    // actualización optimista en el cliente
    setStreak((prev) => prev + 1);

    try {
      // Más adelante conectaremos esto con una función RPC o tabla real
      const { error } = await supabase.rpc("r4w_increment_streak", {
        p_user_id: user.id,
      });

      if (error) {
        console.error("Error actualizando racha en Supabase:", error);
      }
    } catch (err) {
      console.error("Error en registerCorrectAnswer:", err);
    }
  };

  return { streak, loading, registerCorrectAnswer };
}