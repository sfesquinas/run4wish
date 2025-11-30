// app/hooks/useUserRaces.ts
"use client";

import { useEffect, useState } from "react";

export function useUserRaces(email: string | null) {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRaces = async (abortSignal?: AbortSignal) => {
    if (!email) {
      setRaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lo-que-sea", {
        signal: abortSignal,
      });

      if (!res.ok) {
        setRaces([]);
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setRaces([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRaces(data.races || []);
      setLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Timeout - silencioso
        setRaces([]);
        setLoading(false);
      } else {
        console.error("Error cargando carreras:", err);
        setRaces([]);
        setLoading(false);
      }
    }
  };

  const refresh = () => {
    fetchRaces();
  };

  useEffect(() => {
    let isMounted = true;
    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadRaces = async () => {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller!.abort(), 2000); // 2 segundos timeout
      
      await fetchRaces(controller.signal);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    loadRaces();

    return () => {
      isMounted = false;
      if (controller) {
        controller.abort();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return { races, loading, refresh };
}