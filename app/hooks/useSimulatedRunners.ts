// app/hooks/useSimulatedRunners.ts
// Hook para gestionar runners simulados

"use client";

import { useEffect, useState } from "react";
import { ensureSimulatedRunners, simulateDailyProgress } from "../lib/simulatedRunners";

/**
 * Hook para asegurar que los runners simulados existen
 * Se ejecuta automáticamente cuando el componente se monta
 */
export function useSimulatedRunners() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initRunners() {
      try {
        const success = await ensureSimulatedRunners();
        if (isMounted) {
          setInitialized(success);
          if (!success) {
            setError("No se pudieron inicializar los runners simulados");
          }
        }
      } catch (err: any) {
        console.error("Error inicializando runners:", err);
        if (isMounted) {
          setError(err.message || "Error desconocido");
        }
      }
    }

    initRunners();

    return () => {
      isMounted = false;
    };
  }, []);

  return { initialized, error };
}

/**
 * Hook para simular el progreso diario de los runners
 */
export function useSimulateDailyProgress(dayNumber: number) {
  const [simulated, setSimulated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function simulate() {
      if (dayNumber < 1 || dayNumber > 7) return;

      setLoading(true);
      try {
        const success = await simulateDailyProgress(dayNumber);
        if (isMounted) {
          setSimulated(success);
        }
      } catch (err) {
        console.error("Error simulando progreso:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    simulate();

    return () => {
      isMounted = false;
    };
  }, [dayNumber]);

  return { simulated, loading };
}


