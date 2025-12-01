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

type PrizeState = {
  raceName: string;
  reward: string;
} | null;

type InsufficientWishesState = {
  raceName: string;
  costWishes: number;
  currentWishes: number;
} | null;

const activeRace = {
  id: "r7",
  name: "Constancia MVP",
  duration: "7 días · 1 pregunta al día",
  questions:
    "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00 (hora local).",
  reward: "Experiencia sensorial Run4Wish",
};

const upcomingRaces = [
  {
    id: "u1",
    name: "Sprint",
    duration: "1 día · 12 preguntas",
    questions:
      "Una pregunta cada hora desde las 10:00 hasta las 20:00. Aparecerá en un minuto aleatorio dentro de cada hora.",
    reward: "Insignias especiales + wishes extra",
    costWishes: 3,
  },
  {
    id: "u2",
    name: "Constancia",
    duration: "7 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00 (hora local).",
    reward: "Experiencia sensorial Run4Wish",
    costWishes: 5,
  },
  {
    id: "u3",
    name: "Maratón",
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
  const { wishes, subtractWishes } = useWishes(user?.id ?? null);
  const { preregistrations, addPreregistration } = usePreregistrations(
    user?.email ?? null
  );
  const [info, setInfo] = useState<InfoState>(null);
  const [prize, setPrize] = useState<PrizeState>(null);
  const [insufficientWishes, setInsufficientWishes] = useState<InsufficientWishesState>(null);
  const preregSet = new Set(preregistrations ?? []);

  // 🔐 Guard: si no hay usuario cuando ya hemos cargado, lo mandamos al login
  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  const handlePreregister = async (raceId: string, costWishes: number, raceName: string) => {
    if (!user) {
      alert("Primero necesitas crear tu acceso en Run4Wish.");
      return;
    }

    if (wishes < costWishes) {
      // Mostrar modal de wishes insuficientes
      setInsufficientWishes({
        raceName,
        costWishes,
        currentWishes: wishes,
      });
      return;
    }

    // Descontamos wishes del store global
    await subtractWishes(costWishes);

    // Guardamos la preregistro (MVP)
    addPreregistration(raceId);
    
    // El botón se deshabilitará automáticamente porque alreadyBooked se actualizará
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
            </div>
          </header>

          <div className="r4w-race-card">
            <div className="r4w-race-name-row">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <span className="r4w-race-name">{activeRace.name}</span>
                <button
                  type="button"
                  className="r4w-race-reward-icon-btn"
                  onClick={() =>
                    setPrize({
                      raceName: activeRace.name,
                      reward: activeRace.reward,
                    })
                  }
                  aria-label="Ver premio"
                  style={{ padding: "4px", background: "transparent", border: "none" }}
                >
                  <span className="r4w-race-reward-icon">🏆</span>
                </button>
              </div>
              <button
                type="button"
                className="r4w-info-icon"
                onClick={() =>
                  setInfo({
                    title: activeRace.name,
                    text: `${activeRace.duration}. ${activeRace.questions}`,
                  })
                }
                aria-label="Ver información"
              >
                <span className="r4w-info-icon-dot">ℹ</span>
              </button>
            </div>

            <div className="r4w-race-footer">
              <Link
                href={`/carrera/${activeRace.id}`}
                className="r4w-primary-btn r4w-race-action-btn"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Responder a la pregunta <span>🏁</span>
              </Link>
            </div>
          </div>

          {/* Carrera 24h Demo */}
          <div className="r4w-race-card" style={{ marginTop: 16 }}>
            <div className="r4w-race-name-row">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <span className="r4w-race-name">Sprint MVP</span>
                <button
                  type="button"
                  className="r4w-race-reward-icon-btn"
                  onClick={() =>
                    setPrize({
                      raceName: "Sprint MVP",
                      reward: "Experiencia sprint Run4Wish",
                    })
                  }
                  aria-label="Ver premio"
                  style={{ padding: "4px", background: "transparent", border: "none" }}
                >
                  <span className="r4w-race-reward-icon">🏆</span>
                </button>
              </div>
              <button
                type="button"
                className="r4w-info-icon"
                onClick={() =>
                  setInfo({
                    title: "Sprint MVP",
                    text: "12 preguntas entre las 09:00 y las 21:00. Ideal para probar la experiencia sprint.",
                  })
                }
                aria-label="Ver información"
              >
                <span className="r4w-info-icon-dot">ℹ</span>
              </button>
            </div>

            <div className="r4w-race-footer">
              <Link
                href="/pregunta-24h"
                className="r4w-primary-btn r4w-race-action-btn"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Responder a la pregunta <span>🏁</span>
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

          <div className="r4w-upcoming-grid">
            {upcomingRaces.map((race) => {
              const alreadyBooked = preregSet.has(race.id);

              return (
                <div key={race.id} className="r4w-race-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  {/* Nombre arriba */}
                  <div style={{ marginBottom: "12px" }}>
                    <span className="r4w-race-name" style={{ display: "block" }}>{race.name}</span>
                  </div>

                  {/* Copa e información en el medio */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <button
                      type="button"
                      className="r4w-race-reward-icon-btn"
                      onClick={() =>
                        setPrize({
                          raceName: race.name,
                          reward: race.reward,
                        })
                      }
                      aria-label="Ver premio"
                      style={{ padding: "4px", background: "transparent", border: "none" }}
                    >
                      <span className="r4w-race-reward-icon">🏆</span>
                    </button>
                    <button
                      type="button"
                      className="r4w-info-icon"
                      onClick={() =>
                        setInfo({
                          title: race.name,
                          text: `${race.duration}. ${race.questions}`,
                        })
                      }
                      aria-label="Ver información"
                    >
                      <span className="r4w-info-icon-dot">ℹ</span>
                    </button>
                  </div>

                  {/* Botón de reserva abajo */}
                  <div style={{ width: "100%" }}>
                    <button
                      type="button"
                      className={`r4w-secondary-btn ${alreadyBooked ? "r4w-btn-disabled" : ""}`}
                      disabled={alreadyBooked}
                      onClick={() =>
                        !alreadyBooked &&
                        handlePreregister(race.id, race.costWishes, race.name)
                      }
                      style={{ width: "100%", justifyContent: "center" }}
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

      {/* OVERLAY PREMIO 🏆 */}
      {prize && (
        <div className="r4w-tooltip-overlay">
          <div className="r4w-tooltip-card">
            <div className="r4w-tooltip-prize-icon">🏆</div>
            <h3 className="r4w-tooltip-title">{prize.raceName}</h3>
            <p className="r4w-tooltip-text">
              <strong>Premio:</strong> {prize.reward}
            </p>

            <button
              type="button"
              className="r4w-tooltip-close"
              onClick={() => setPrize(null)}
            >
              Entendido ✨
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY WISHES INSUFICIENTES ✨ */}
      {insufficientWishes && (
        <div className="r4w-tooltip-overlay">
          <div className="r4w-tooltip-card">
            <div className="r4w-tooltip-wishes-icon">✨</div>
            <h3 className="r4w-tooltip-title">Wishes insuficientes</h3>
            <p className="r4w-tooltip-text">
              No tienes suficientes wishes para reservar la plaza en{" "}
              <strong>{insufficientWishes.raceName}</strong>.
            </p>
            <p className="r4w-tooltip-text">
              <span className="r4w-info-highlight">
                Tienes {insufficientWishes.currentWishes} wishes, pero necesitas{" "}
                {insufficientWishes.costWishes} para reservar esta carrera.
              </span>
            </p>
            <div className="r4w-tooltip-actions">
              <button
                type="button"
                className="r4w-primary-btn r4w-tooltip-action-btn"
                onClick={() => {
                  setInsufficientWishes(null);
                  router.push("/wishes");
                }}
              >
                Comprar wishes 🛒
              </button>
              <button
                type="button"
                className="r4w-secondary-btn r4w-tooltip-action-btn"
                onClick={() => setInsufficientWishes(null)}
              >
                De momento no
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}