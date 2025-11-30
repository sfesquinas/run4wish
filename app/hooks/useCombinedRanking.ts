// app/hooks/useCombinedRanking.ts
// Hook para obtener ranking combinado (usuario real + runners simulados)

"use client";

import { useEffect, useState } from "react";
import { useUser } from "./useUser";
import { getSimulatedRanking } from "../lib/simulatedRunners";
import { useRaceProgress } from "./useRaceProgress";

export type RankingItem = {
  position: number;
  name: string;
  progressPercent: number;
  delta: number;
  isYou?: boolean;
  isSimulated?: boolean;
};

export type CombinedRankingState = {
  ranking: RankingItem[];
  totalParticipants: number;
  userPosition: number | null;
  loading: boolean;
  error: string | null;
};

/**
 * Hook para obtener el ranking combinado de usuarios reales y runners simulados
 */
export function useCombinedRanking(
  raceId: string = "r7",
  raceType: string = "7d_mvp"
): CombinedRankingState {
  const { user } = useUser() as any;
  const { daysPlayed } = useRaceProgress(raceId, 7);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCombinedRanking() {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        // Obtener ranking simulado
        const simulatedRanking = await getSimulatedRanking(daysPlayed);

        // Convertir a formato RankingItem
        const simulatedItems: RankingItem[] = simulatedRanking.map((runner, index) => ({
          position: index + 1,
          name: runner.display_name,
          progressPercent: Math.min(100, Math.floor((daysPlayed / 7) * 100)),
          delta: runner.total_positions > 0 ? Math.floor(Math.random() * 3) : 0,
          isSimulated: true,
        }));

        // Si hay usuario real, insertarlo en una posición intermedia
        let combinedRanking = [...simulatedItems];
        let userPosition = null;

        if (user) {
          // Calcular posición estimada del usuario (intermedia-alta)
          const estimatedPosition = Math.floor(simulatedItems.length * 0.3) + 1;
          const userDisplayName = (user as any)?.user_metadata?.username_game || (user as any)?.username || "Runner";

          // Obtener último avance del localStorage
          let lastAdvance = 0;
          if (typeof window !== "undefined") {
            try {
              const stored = window.localStorage.getItem("r4w_last_advance");
              if (stored) {
                const parsed = JSON.parse(stored);
                lastAdvance = parsed.positions || 0;
              }
            } catch {
              // Ignorar errores de parsing
            }
          }

          const userItem: RankingItem = {
            position: estimatedPosition,
            name: userDisplayName,
            progressPercent: Math.min(100, Math.floor((daysPlayed / 7) * 100)),
            delta: lastAdvance,
            isYou: true,
            isSimulated: false,
          };

          // Insertar usuario en su posición
          combinedRanking.splice(estimatedPosition - 1, 0, userItem);
          userPosition = estimatedPosition;

          // Reordenar posiciones después de insertar
          combinedRanking = combinedRanking.map((item, index) => ({
            ...item,
            position: index + 1,
          }));

          // Actualizar posición del usuario
          userPosition = combinedRanking.findIndex((item) => item.isYou) + 1;
        }

        if (isMounted) {
          setRanking(combinedRanking);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error obteniendo ranking combinado:", err);
        if (isMounted) {
          setError(err.message || "Error al cargar el ranking");
          setLoading(false);
        }
      }
    }

    fetchCombinedRanking();

    return () => {
      isMounted = false;
    };
  }, [user, daysPlayed, raceId, raceType]);

  return {
    ranking,
    totalParticipants: 100 + (user ? 1 : 0), // 100 simulados + usuario real
    userPosition: ranking.findIndex((item) => item.isYou) + 1 || null,
    loading,
    error,
  };
}

