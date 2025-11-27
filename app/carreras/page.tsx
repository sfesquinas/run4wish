// app/carreras/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

// Carrera activa (demo MVP)
const activeRace = {
  id: "r7",
  name: "Carrera 7 días · MVP",
  duration: "7 días · 1 pregunta al día",
  questions:
    "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00 (hora local).",
  reward: "Experiencia sensorial Run4Wish",
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
    cost: 5,
  },
  {
    id: "u2",
    name: "Carrera 7 días · Constancia",
    duration: "7 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Experiencia sensorial Run4Wish",
    cost: 8,
  },
  {
    id: "u3",
    name: "Carrera 30 días · Maratón",
    duration: "30 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Smartphone de última generación",
    cost: 12,
  },
];

// ⚙️ Reserva con wishes (onSuccess es OPCIONAL para evitar el error)
function preregisterRace(
  raceId: string,
  wishesCost: number,
  onSuccess?: () => void
): "OK" | "NO_WISHES" | "NO_USER" {
  if (typeof window === "undefined") return "NO_USER";

  // buscamos el objeto de usuario en localStorage
  const key =
    window.localStorage.getItem("r4w_user") !== null
      ? "r4w_user"
      : window.localStorage.getItem("r4w_user_data") !== null
        ? "r4w_user_data"
        : null;

  if (!key) return "NO_USER";

  const raw = window.localStorage.getItem(key);
  if (!raw) return "NO_USER";

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return "NO_USER";
  }

  const wishes = data.wishesBalance ?? data.wishes ?? null;

  if (wishes !== null && wishes < wishesCost) {
    return "NO_WISHES";
  }

  // restar wishes si existe ese campo
  if (wishes !== null) {
    const newVal = wishes - wishesCost;
    if ("wishesBalance" in data) data.wishesBalance = newVal;
    if ("wishes" in data) data.wishes = newVal;
  }

  // guardamos preregistro también en el usuario
  const prereg = Array.isArray(data.preregistrations)
    ? [...data.preregistrations]
    : [];
  if (!prereg.includes(raceId)) prereg.push(raceId);
  data.preregistrations = prereg;

  window.localStorage.setItem(key, JSON.stringify(data));

  // guardamos lista rápida para el estado visual
  const current = JSON.parse(
    window.localStorage.getItem("r4w_prereg") || "[]"
  );
  if (!current.includes(raceId)) {
    const updated = [...current, raceId];
    window.localStorage.setItem("r4w_prereg", JSON.stringify(updated));
    onSuccess?.(); // <- solo si viene definida
  }

  return "OK";
}

export default function CarrerasPage() {
  // tooltip con la interrogación
  const [info, setInfo] = useState<{
    title: string;
    text: string;
  } | null>(null);

  // carreras con plaza ya reservada (estado visual)
  const [reservedRaces, setReservedRaces] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem("r4w_prereg");
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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
            {upcomingRaces.map((race) => (
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
                  <span className="r4w-race-reward-text">{race.reward}</span>
                </div>

                <div className="r4w-race-footer">

                  {reservedRaces.includes(race.id) ? (
                    <button
                      type="button"
                      className="r4w-secondary-btn"
                      style={{
                        opacity: 0.5,
                        cursor: "default",
                        backgroundColor: "rgba(255,255,255,0.05)",
                      }}
                      disabled
                    >
                      Plaza reservada
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="r4w-primary-btn"
                      onClick={() => {
                        const result = preregisterRace(
                          race.id,
                          race.cost ?? 5,
                          () => {
                            setReservedRaces((prev) => [...prev, race.id]);
                          }
                        );

                        if (result === "NO_WISHES") {
                          alert(
                            "Necesitas más wishes para reservar esta plaza."
                          );
                        }
                        if (result === "NO_USER") {
                          alert(
                            "Antes necesitas crear tu acceso en Run4Wish."
                          );
                        }
                      }}
                    >
                      Reservar plaza · {race.cost ?? 5} wishes
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* TOOLTIP FLOTANTE */}
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