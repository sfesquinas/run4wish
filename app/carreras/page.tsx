// app/carreras/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";
import { usePreregistrations } from "../hooks/usePreregistrations";

// Carrera activa (MVP)
const activeRace = {
  id: "r7",
  name: "Carrera 7 días · MVP",
};

// Próximas carreras
const upcomingRaces = [
  {
    id: "u1",
    name: "Carrera 24h · Sprint",
    duration: "1 día · 12 preguntas",
    questions:
      "Una pregunta cada hora desde las 10:00 hasta las 20:00. Aparecerá en un minuto aleatorio dentro de cada hora.",
    reward: "Insignias especiales + wishes extra",
    cost: 3,
  },
  {
    id: "u2",
    name: "Carrera 7 días · Constancia",
    duration: "7 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Experiencia sensorial Run4Wish",
    cost: 5,
  },
  {
    id: "u3",
    name: "Carrera 30 días · Maratón",
    duration: "30 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Smartphone de última generación",
    cost: 8,
  },
];

export default function CarrerasPage() {
  // 1) Usuario y wishes globales
  const { user, isReady } = useUser();
  const { preregistrations, addPreregistration } = usePreregistrations(
    user?.email ?? null
  );
  const { wishes, setWishes } = useWishes();

  // 2) Tooltip de la interrogación
  const [info, setInfo] = useState<{
    title: string;
    text: string;
  } | null>(null);

  // 3) Carreras con plaza ya reservada
  const [reserved, setReserved] = useState<Record<string, boolean>>({});

  // 4) Lógica de preregistro con wishes
  const handlePreregister = (raceId: string, cost: number) => {
    if (!user) {
      alert("Primero necesitas crear tu acceso en Run4Wish.");
      return;
    }

    if (wishes < cost) {
      alert("Necesitas más wishes para reservar esta plaza.");
      return;
    }

    // Descontamos wishes
    setWishes((prev: number) => prev - cost);

    // Marcamos plaza reservada en esta carrera
    setReserved((prev) => ({
      ...prev,
      [raceId]: true,
    }));
  };

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
                    text:
                      "7 días · 1 pregunta al día. " +
                      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00 (hora local).",
                  })
                }
              >
                ❓
              </button>
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
              const isReserved = reserved[race.id];

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
                          text:
                            race.duration +
                            ". " +
                            race.questions,
                        })
                      }
                    >
                      ❓
                    </button>
                  </div>

                  <div className="r4w-race-meta">
                    <span>{race.duration}</span>
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
                      className={
                        "r4w-secondary-btn" +
                        (isReserved ? " r4w-btn-disabled" : "")
                      }
                      disabled={isReserved}
                      onClick={() =>
                        !isReserved && handlePreregister(race.id, race.cost)
                      }
                    >
                      {isReserved
                        ? "Plaza reservada ✅"
                        : `Reservar plaza · ${race.cost} wishes`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* OVERLAY TOOLTIP INTERROGACIÓN */}
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