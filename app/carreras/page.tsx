// app/carreras/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";
import { usePreregistrations } from "../hooks/usePreregistrations";

type UpcomingRace = {
  id: string;
  name: string;
  durationLabel: string;
  reward: string;
  wishCost: number;
};

const UPCOMING_RACES: UpcomingRace[] = [
  {
    id: "r24h_1",
    name: "Carrera 24h · Sprint de deseos",
    durationLabel: "Duración: 1 día (24 preguntas)",
    reward: "Insignias exclusivas + wishes extra",
    wishCost: 2,
  },
  {
    id: "r7d_2",
    name: "Carrera 7 días · Experiencia sensorial",
    durationLabel: "Duración: 7 días (1 pregunta al día)",
    reward: "Experiencia sensorial para el ganador",
    wishCost: 3,
  },
  {
    id: "r30d_3",
    name: "Carrera 30 días · Smartphone",
    durationLabel: "Duración: 30 días (1 pregunta al día)",
    reward: "Smartphone última generación",
    wishCost: 5,
  },
];

export default function CarrerasPage() {
  const router = useRouter();
  const { user, isReady: userReady } = useUser();
  const { wishes, setWishes, isReady: wishesReady } = useWishes();
  const { preregistrations, addPrereg, isReady: preregReady } =
    usePreregistrations();

  const isLoading = !userReady || !wishesReady || !preregReady;

  const handlePreregister = (race: UpcomingRace) => {
    // Si no hay usuario → registro
    if (!user) {
      router.push("/registro");
      return;
    }

    // Si ya está preregistrado, nada
    const already = preregistrations.some((p) => p.raceId === race.id);
    if (already) return;

    // Si no hay wishes suficientes
    if (wishes < race.wishCost) {
      alert(
        `Te faltan wishes. Necesitas ${race.wishCost} wishes para asegurar tu plaza en esta carrera.`
      );
      return;
    }

    // Descontamos wishes y guardamos prerregistro
    setWishes((w) => Math.max(0, w - race.wishCost));
    addPrereg(race.id);

    alert("Plaza asegurada ✨ Ya estás dentro de esta próxima carrera.");
  };

  const userHasPrereg = (raceId: string) =>
    preregistrations.some((p) => p.raceId === raceId);

  return (
    <main className="r4w-races-page">
      <section className="r4w-races-layout">
        {/* Bloque carrera activa actual */}
        <section className="r4w-races-active">
          <h1 className="r4w-races-title">Carreras Run4Wish</h1>
          <p className="r4w-races-subtitle">
            Aquí verás tus carreras activas y podrás asegurar plaza en las
            próximas. La constancia manda, pero llegar a tiempo también cuenta.
          </p>

          <div className="r4w-race-card">
            <div className="r4w-race-card-header">
              <div>
                <h2 className="r4w-race-card-title">Carrera 7 días · MVP</h2>
                <p className="r4w-race-card-meta">
                  1 pregunta al día · premio demo
                </p>
              </div>
              <span className="r4w-badge-active">Activa</span>
            </div>

            <p className="r4w-race-card-text">
              Esta es la carrera que estamos usando para probar el MVP. Aquí
              verás cómo funciona el sistema de preguntas diarias, wishes y
              posiciones.
            </p>

            <div className="r4w-race-card-actions">
              <Link href="/carrera/r7" className="r4w-primary-btn">
                Ir a mi carrera
                <span>🏁</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Bloque próximas carreras */}
        <section className="r4w-races-upcoming">
          <h2 className="r4w-races-upcoming-title">Próximas carreras</h2>
          <p className="r4w-races-upcoming-subtitle">
            Asegura tu plaza antes de que empiecen. El prerregistro se hace con
            wishes y queda guardado para las próximas versiones con base de
            datos real.
          </p>

          {isLoading && (
            <div className="r4w-race-card">
              <div className="r4w-question-status">
                Cargando próximas carreras...
              </div>
            </div>
          )}

          {!isLoading && (
            <div className="r4w-upcoming-grid">
              {UPCOMING_RACES.map((race) => {
                const already = userHasPrereg(race.id);
                const notEnoughWishes = wishes < race.wishCost;

                return (
                  <article key={race.id} className="r4w-upcoming-card">
                    <header className="r4w-upcoming-header">
                      <h3 className="r4w-upcoming-title">{race.name}</h3>
                      <div className="r4w-upcoming-duration">
                        {race.durationLabel}
                      </div>
                    </header>

                    <div className="r4w-upcoming-body">
                      <div className="r4w-upcoming-reward-label">
                        Premio principal
                      </div>
                      <div className="r4w-upcoming-reward">{race.reward}</div>

                      <div className="r4w-upcoming-cost">
                        Asegura tu plaza por{" "}
                        <span className="r4w-upcoming-cost-number">
                          {race.wishCost} wishes
                        </span>
                        .
                      </div>

                      {already && (
                        <div className="r4w-upcoming-status">
                          ✔ Plaza asegurada. En próximas versiones podrás ver
                          aquí todos tus prerregistros en tu perfil.
                        </div>
                      )}
                    </div>

                    <div className="r4w-upcoming-actions">
                      <button
                        type="button"
                        className="r4w-primary-btn"
                        disabled={already || notEnoughWishes}
                        onClick={() => handlePreregister(race)}
                      >
                        {already
                          ? "Ya estás dentro"
                          : notEnoughWishes
                          ? "Te faltan wishes"
                          : "Asegurar plaza"}
                        <span>✨</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}