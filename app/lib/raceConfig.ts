// app/lib/raceConfig.ts
// Configuración centralizada de tipos de carrera

export type RaceConfig = {
  raceType: string;
  daysTotal: number;
  name: string;
};

export const RACE_CONFIG: Record<string, RaceConfig> = {
  "7d_mvp": {
    raceType: "7d_mvp",
    daysTotal: 7,
    name: "Carrera 7 días · MVP",
  },
  "30d_marathon": {
    raceType: "30d_marathon",
    daysTotal: 30,
    name: "Carrera 30 días · Maratón",
  },
  "24h_sprint": {
    raceType: "24h_sprint",
    daysTotal: 1,
    name: "Carrera 24h · Sprint",
  },
};

/**
 * Obtiene el race_type de Supabase a partir del race_id de la app
 * @param raceId - ID de la carrera (ej: "r7", "r30", "r24h")
 * @returns race_type para usar en Supabase (ej: "7d_mvp")
 */
export function getRaceTypeFromId(raceId: string): string {
  // Mapeo de race_id a race_type
  const mapping: Record<string, string> = {
    r7: "7d_mvp",
    r30: "30d_marathon",
    r24h: "24h_sprint",
  };

  return mapping[raceId] || RACE_CONFIG["7d_mvp"].raceType;
}

/**
 * Obtiene la configuración de una carrera por su race_type
 */
export function getRaceConfig(raceType: string): RaceConfig {
  return RACE_CONFIG[raceType] || RACE_CONFIG["7d_mvp"];
}


