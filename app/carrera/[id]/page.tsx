// app/carrera/[id]/page.tsx
import Link from "next/link";

type Race = {
  id: string;
  name: string;
  daysTotal: number;
  daysPlayed: number;
  position: number;
  totalParticipants: number;
  window: string;
};

type RankingItem = {
  position: number;
  name: string;
  avatarEmoji: string;
  delta: number; // posiciones ganadas o perdidas hoy
};

const races: Record<string, Race> = {
  r7: {
    id: "r7",
    name: "Carrera 7 días · MVP",
    daysTotal: 7,
    daysPlayed: 3,
    position: 12,
    totalParticipants: 100,
    window: "de 09:00 a 00:00 (hora local)",
  },
};

const rankingTop5: RankingItem[] = [
  { position: 1, name: "Constante_01", avatarEmoji: "🏃‍♀️", delta: +1 },
  { position: 2, name: "R4W_Focus", avatarEmoji: "🎯", delta: 0 },
  { position: 3, name: "DreamBig", avatarEmoji: "💫", delta: +2 },
  { position: 11, name: "Runner_You", avatarEmoji: "🔥", delta: +5 },
  { position: 20, name: "SlowButSure", avatarEmoji: "🐢", delta: -3 },
];

interface RacePageProps {
  params: { id: string };
}

export default function CarreraDetallePage({ params }: RacePageProps) {
  // Por ahora, si no existe el id, usamos r7 como fallback
  const race = races[params.id] ?? races["r7"];

  const progress = Math.round((race.daysPlayed / race.daysTotal) * 100);

  const todayIndex = Math.min(race.daysPlayed, race.daysTotal - 1);

  const questionAvailable = true; // más adelante se conectará a la lógica real

  return (
    <main className="r4w-race-detail-page">
      <div className="r4w-race-detail-layout">
        {/* COLUMNA IZQUIERDA: detalle carrera */}
        <section className="r4w-race-detail-main">
          <header className="r4w-race-detail-header">
            <div>
              <h1 className="r4w-race-detail-title">{race.name}</h1>
              <p className="r4w-race-detail-subtitle">
                Esta es tu carrera activa. Aquí verás tu avance, tu posición y
                la pregunta del día.
              </p>
            </div>
            <div className="r4w-race-detail-badge">carrera activa</div>
          </header>

          {/* Meta */}
          <div className="r4w-race-detail-meta">
            <span>
              <span className="r4w-dot" />
              1 pregunta al día
            </span>
            <span>
              Días jugados: {race.daysPlayed}/{race.daysTotal}
            </span>
            <span>
              Posición actual: #{race.position} / {race.totalParticipants}
            </span>
          </div>

          {/* Progreso + timeline */}
          <div className="r4w-race-detail-progress-row">
            <div className="r4w-race-detail-progress-label">
              <span>Constancia</span>
              <span>{progress}%</span>
            </div>
            <div className="r4w-race-detail-progress-bar">
              <div
                className="r4w-race-detail-progress-fill"
                style={{ width: `${Math.max(8, progress)}%` }}
              />
            </div>

            <div className="r4w-race-detail-timeline">
              {Array.from({ length: race.daysTotal }).map((_, idx) => {
                const isDone = idx < race.daysPlayed;
                const isToday = idx === todayIndex;

                return (
                  <div
                    key={idx}
                    className={[
                      "r4w-race-detail-day",
                      isDone ? "done" : "",
                      isToday ? "today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="r4w-race-detail-day-marker" />
                    <div className="r4w-race-detail-day-label">D{idx + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pregunta del día */}
          <div className="r4w-question-card">
            <div className="r4w-question-status">
              Pregunta del día · ventana {race.window}
            </div>
            <div className="r4w-question-title">
              {questionAvailable
                ? "La pregunta de hoy ya está disponible. ¿Preparado para sumar constancia?"
                : "La pregunta de hoy aún no está activa. En cuanto se abra, podrás responder desde aquí."}
            </div>
            <div className="r4w-question-timer">
              {questionAvailable
                ? "Tiempo restante: 01:23:45"
                : "Recuerda: quien responde antes, adelanta posiciones frente al resto."}
            </div>

            <div className="r4w-question-actions">
              <Link
                href="/pregunta"
                className="r4w-primary-btn"
                style={{ opacity: questionAvailable ? 1 : 0.6 }}
              >
                <span>
                  {questionAvailable
                    ? "Responder pregunta"
                    : "Esperando apertura"}
                </span>
                <span>➜</span>
              </Link>

              <Link href="/panel" className="r4w-secondary-btn">
                Ver mi panel
                <span>🏁</span>
              </Link>
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: ranking mini + mensaje */}
        <section className="r4w-race-detail-side">
          <div className="r4w-ranking-card" style={{ marginBottom: 14 }}>
            <div className="r4w-ranking-title">Top & movimiento de hoy</div>
            <div className="r4w-ranking-list">
              {rankingTop5.map((item) => (
                <div key={item.position} className="r4w-ranking-item">
                  <div className="r4w-ranking-pos">#{item.position}</div>
                  <div className="r4w-ranking-name">
                    <span className="r4w-ranking-emoji">
                      {item.avatarEmoji}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <div
                    className={[
                      "r4w-ranking-delta",
                      item.delta > 0
                        ? "positive"
                        : item.delta < 0
                          ? "negative"
                          : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {item.delta > 0 && `+${item.delta}`}
                    {item.delta < 0 && item.delta}
                    {item.delta === 0 && "─"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="r4w-panel-next">
            <div className="r4w-panel-next-label">recordatorio</div>
            <div className="r4w-panel-next-main">
              Tu posición cambia cada vez que alguien responde más rápido que tú
              o mantiene más constancia. No se trata de un sprint de un día, sino
              de aparecer toda la carrera.
            </div>
            <div className="r4w-panel-next-time">
              Cuando la pregunta esté activa, aprovéchala cuanto antes.
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Link href="/ranking" className="r4w-secondary-btn">
              Ver ranking completo
              <span>📈</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}