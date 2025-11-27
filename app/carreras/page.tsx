// app/carreras/page.tsx
"use client";

import Link from "next/link";

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
  },
  {
    id: "u2",
    name: "Carrera 7 días · Constancia",
    duration: "7 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Experiencia sensorial Run4Wish",
  },
  {
    id: "u3",
    name: "Carrera 30 días · Maratón",
    duration: "30 días · 1 pregunta al día",
    questions:
      "La pregunta aparece en un horario aleatorio entre las 09:00 y las 00:00.",
    reward: "Smartphone de última generación",
  },
];

export default function CarrerasPage() {
  return (
    <main className="r4w-races-page">
      <div className="r4w-races-layout">
        {/* COLUMNA IZQUIERDA: CARRERAS ACTIVAS */}
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
            <div className="r4w-race-name">{activeRace.name}</div>

            <div className="r4w-race-meta">
              <span>{activeRace.duration}</span>
            </div>

            <div className="r4w-race-meta">
              <span>{activeRace.questions}</span>
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
              <p className="r4w-section-subtitle">
                Elige cómo quieres correr: 24h, 7 días o 30 días.
              </p>
            </div>
          </header>

          <div className="r4w-upcoming-list">
            {upcomingRaces.map((race) => (
              <div key={race.id} className="r4w-race-card">
                <div className="r4w-race-name">{race.name}</div>

                <div className="r4w-race-meta">
                  <span>{race.duration}</span>
                </div>

                <div className="r4w-race-meta">
                  <span>{race.questions}</span>
                </div>

                <div className="r4w-race-reward-row">
                  <span className="r4w-race-reward-icon">🏆</span>
                  <span className="r4w-race-reward-text">{race.reward}</span>
                </div>

                <div className="r4w-race-footer">
                  <span>Muy pronto podrás preregistrarte desde aquí.</span>
                  <button
                    type="button"
                    className="r4w-secondary-btn"
                    style={{ opacity: 0.7, cursor: "default" }}
                  >
                    Preregistro próximamente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}