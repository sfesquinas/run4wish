// app/data/r4wDemo.ts

export type Race = {
    id: string;
    name: string;
    daysTotal: number;
    daysPlayed: number;
    position: number;
    totalParticipants: number;
    window: string;
  };
  
  export type RankingItem = {
    position: number;
    name: string;
    progressPercent: number; // % de constancia
    delta: number; // cambio de posición hoy
    isYou?: boolean;
  };
  
  export const demoUserName = "Runner";
  
  export const demoRace: Race = {
    id: "r7",
    name: "Carrera 7 días · MVP",
    daysTotal: 7,
    daysPlayed: 3,
    position: 12,
    totalParticipants: 100,
    window: "de 09:00 a 00:00 (hora local)",
  };
  
  export const demoRanking: RankingItem[] = [
    { position: 1, name: "Constante_01", progressPercent: 100, delta: +1 },
    { position: 2, name: "R4W_Focus", progressPercent: 100, delta: 0 },
    { position: 3, name: "DreamBig", progressPercent: 100, delta: +2 },
    {
      position: 12,
      name: demoUserName,
      progressPercent: 40,
      delta: +5,
      isYou: true,
    },
    { position: 20, name: "SlowButSure", progressPercent: 40, delta: -3 },
  ];