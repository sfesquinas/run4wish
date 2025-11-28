// app/carreras/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";
import { usePreregistrations } from "../hooks/usePreregistrations";

type InfoState = {
  title: string;
  text: string;
} | null;

const activeRace = {
  id: "r7",
  name: "Carrera 7 días · MVP",
  duration: "7 días · 1 pregunta al día",
  questions:
    "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00 (hora local).",
  reward: "Experiencia sensorial Run4Wish",
};

const upcomingRaces = [
  {
    id: "u1",
    name: "Carrera 24h · Sprint",
    duration: "1 día · 12 preguntas",
    questions:
      "Una pregunta cada hora desde las 10:00 hasta las 20:00. Aparecerá en un minuto aleatorio dentro de cada hora.",
    reward: "Insignias especiales + wishes extra",
    costWishes: 3,
  },
  {
    id: "u2",
    name: "Carrera 7 días · Constancia",
    duration: "7 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00 (hora local).",
    reward: "Experiencia sensorial Run4Wish",
    costWishes: 5,
  },
  {
    id: "u3",
    name: "Carrera 30 días · Maratón",
    duration: "30 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Smartphone de última generación",
    costWishes: 8,
  },
];

export default function CarrerasPage() {
  const router = useRouter();
  const { user, isReady } = useUser() as any;
  const { wishes, setWishes } = useWishes(user?.id ?? null);
  const { preregistrations, addPreregistration } = usePreregistrations(
    user?.email ?? null
  );
  const [info, setInfo] = useState<InfoState>(null);
  const preregSet = new Set(
    (preregistrations ?? []).map((p: any) => p.race_id ?? p.raceId)
  );

  // 🔐 Guard: si no hay usuario cuando ya hemos cargado, lo mandamos al login
  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  const handlePreregister = (raceId: string, costWishes: number) => {
    if (!user) {
      alert("Primero necesitas crear tu acceso en Run4Wish.");
      return;
    }

    if (wishes < costWishes) {
      alert("Necesitas más wishes para reservar esta plaza.");
      return;
    }

    // Descontamos wishes del store global
    setWishes((prev: number) => prev - costWishes);

    // Guardamos la preregistro (MVP)
    addPreregistration(raceId);

    alert("Plaza reservada. Nos vemos en la línea de salida 🏁");
  };

  // Estado de carga mientras comprobamos usuario
  if (!isReady) {
    return (
      <main className="r4w-races-page">
        <div className="r4w-races-layout">
          <section className="r4w-races-column">
            <div className="r4w-race-card">
              <div className="r4w-race-name">Cargando carreras…</div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Si ya sabemos que no hay usuario pero aún no ha redirigido
  if (!user) {
    return (
      <main className="r4w-races-page">
        <div className="r4w-races-layout">
          <section className="r4w-races-column">
            <div className="r4w-race-card">
              <div className="r4w-race-name">
                Redirigiéndote a iniciar sesión…
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="r4w-races-page">
      <div className="r4w-races-layout">
        {/* COLUMNA IZQUIERDA: CARRERA ACTIVA */}
        <section className="r4w-races-column">
          <header className="r4w-races-header">
            <div>
              <h1 className="r4w-section-title">R4W · Carreras activas</h1>
              <p className="r4w-section-subtitle">
                Aquí verás en qué carrera estás compitiendo ahora mismo.
              </p>
            </div>
          </header>

          <div className="r4w-race-card">
            <div className="r4w-race-name-row">
              <span className="r4w-race-name">{activeRace.name}</span>
              <button
                type="button"
                className="r4w-info-icon"
                onClick={() =>
                  setInfo({
                    title: activeRace.name,
                    text: `${activeRace.duration}. ${activeRace.questions}`,
                  })
                }
              >
                ❓
              </button>
            </div>

            <div className="r4w-race-reward-row">
              <span className="r4w-race-reward-icon">🏆</span>
              <span className="r4w-race-reward-text">
                {activeRace.reward}
              </span>
            </div>

            <div className="r4w-race-footer">
              <span>
                Responde la pregunta del día para seguir avanzando en el
                ranking.
              </span>
              <Link
                href={`/carrera/${activeRace.id}`}
                className="r4w-secondary-btn"
              >
                Ir a la carrera <span>🏁</span>
              </Link>
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: PRÓXIMAS CARRERAS */}
        <section className="r4w-races-column">
          <header className="r4w-races-header">
            <div>
              <h2 className="r4w-section-title">Próximas carreras</h2>
            </div>
          </header>

          <div className="r4w-upcoming-list">
            {upcomingRaces.map((race) => {
              const alreadyBooked = preregSet.has(race.id);

              return (
                <div key={race.id} className="r4w-race-card">
                  <div className="r4w-race-name-row">
                    <span className="r4w-race-name">{race.name}</span>
                    <button
                      type="button"
                      className="r4w-info-icon"
                      onClick={() =>
                        setInfo({
                          title: race.name,
                          text: `${race.duration}. ${race.questions}`,
                        })
                      }
                    >
                      ❓
                    </button>
                  </div>

                  <div className="r4w-race-reward-row">
                    <span className="r4w-race-reward-icon">🏆</span>
                    <span className="r4w-race-reward-text">
                      {race.reward}
                    </span>
                  </div>

                  <div className="r4w-race-footer">
                    <button
                      type="button"
                      className="r4w-secondary-btn"
                      disabled={alreadyBooked}
                      onClick={() =>
                        !alreadyBooked &&
                        handlePreregister(race.id, race.costWishes)
                      }
                    >
                      {alreadyBooked
                        ? "Plaza reservada ✅"
                        : `Reservar plaza · ${race.costWishes} ✨`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* OVERLAY INFO ❓ */}
      {info && (
        <div className="r4w-tooltip-overlay">
          <div className="r4w-tooltip-card">
            <h3 className="r4w-tooltip-title">{info.title}</h3>
            <p className="r4w-tooltip-text">{info.text}</p>

            <button
              type="button"
              className="r4w-tooltip-close"
              onClick={() => setInfo(null)}
            >
              Entendido ✨
            </button>
          </div>
        </div>
      )}
    </main>
  );
}