// app/hooks/useUserRaces.ts
"use client";

import { useEffect, useState } from "react";

export function useUserRaces(email: string | null) {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!email) {
      setRaces([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/lo-que-sea");

      if (!res.ok) {
        // La respuesta es una página de error HTML (404, 500, etc.)
        const errorText = await res.text();
        console.error("Error al llamar a /api/lo-que-sea:", res.status, errorText);
        return null; // o lo que tenga sentido devolver
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error(
          "Respuesta no JSON desde /api/lo-que-sea:",
          contentType,
          errorText
        );
        return null;
      }

      const data = await res.json();
      // seguir igual que antes con `data`
      setRaces(data.races || []);
    } catch (err) {
      console.error("Error cargando carreras:", err);
      setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [email]);

  return { races, loading, refresh };
}