// app/panel/page.tsx
import Link from "next/link";

type ActiveRace = {
  id: string;
  name: string;
  position: number;
  totalParticipants: number;
  progress: number; // 0–100 constancia
  daysPlayed: number;
  daysTotal: number;
};

const activeRaces: ActiveRace[] = [
  {
    id: "r7",
    name: "Carrera 7 días · MVP",
    position: 12,
    totalParticipants: 100,
    progress: 40,
    daysPlayed: 3,
    daysTotal: 7,
  },
];

export default function PanelPage() {
  const userName = "Runner"; // más adelante vendrá del perfil
  const mainRace = activeRaces[0];

  return (
    <main className="r4w-panel-page">
      <div className="r4w-panel-layout">
        {/* COLUMNA IZQUIERDA: resumen y carreras activas */}
        <section className="r4w-panel-main">
          <header className="r4w-panel-header">
            <div>
              <div className="r4w-panel-hello">Hola, {userName} 👋</div>
              <div className="r4w-panel-title">
                Esta es tu posición en la carrera
              </div>
              <div className="r4w-panel-tagline">
                Recuerda: aquí gana quien es constante, no quien tiene más suerte.
              </div>
            </div>
            <div className="r4w-panel-chip">panel personal</div>
          </header>

          {/* Stats rápidas */}
          {mainRace && (
            <div className="r4w-panel-stats">
              <div className="r4w-panel-stat">
                <div className="r4w-panel-stat-label">Tu posición</div>
                <div className="r4w-panel-stat-value">
                  #{mainRace.position}
                </div>
                <div className="r4w-panel-stat-caption">
                  De {mainRace.totalParticipants} participantes
                </div>
              </div>

              <div className="r4w-panel-stat">
                <div className="r4w-panel-stat-label">Constancia</div>
                <div className="r4w-panel-stat-value">
                  {mainRace.progress}%
                </div>
                <div className="r4w-panel-stat-caption">
                  Has respondido {mainRace.daysPlayed} de {mainRace.daysTotal} días
                </div>
              </div>

              <div className="r4w-panel-stat">
                <div className="r4w-panel-stat-label">Racha activa</div>
                <div className="r4w-panel-stat-value">
                  {mainRace.daysPlayed}🔥
                </div>
                <div className="r4w-panel-stat-caption">
                  Mantén la racha para adelantar posiciones.
                </div>
              </div>
            </div>
          )}

          {/* Lista de carreras activas del usuario */}
          <div className="r4w-panel-racelist">
            {activeRaces.map((race) => {
              const ratio = race.progress / 100;

              return (
                <article key={race.id} className="r4w-panel-racecard">
                  <div className="r4w-panel-race-header">
                    <div className="r4w-panel-race-name">{race.name}</div>
                    <div className="r4w-panel-race-pos">
                      #{race.position} / {race.totalParticipants}
                    </div>
                  </div>

                  <div className="r4w-panel-race-meta">
                    <span>
                      <span className="r4w-dot" />
                      Carrera activa
                    </span>
                    <span>
                      Días jugados: {race.daysPlayed}/{race.daysTotal}
                    </span>
                    <span>Modo: constancia + velocidad de respuesta</span>
                  </div>

                  <div className="r4w-panel-bar">
                    <div
                      className="r4w-panel-bar-fill"
                      style={{ width: `${Math.max(6, ratio * 100)}%` }}
                    />
                  </div>

                  <div className="r4w-panel-race-footer">
                    <span>
                      Accede a la carrera para ver el ranking completo y la
                      pregunta del día.
                    </span>
                    <Link href="/carreras" className="r4w-secondary-btn">
                      Ir a la carrera
                      <span>➜</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* COLUMNA DERECHA: motivación + siguiente pregunta */}
        <section className="r4w-panel-side">
          <h2 className="r4w-panel-side-title">Mensaje para hoy ✨</h2>
          <p className="r4w-panel-quote">
            Cada respuesta es un pequeño paso.{" "}
            <em>No se trata de acertar una vez,</em> se trata de aparecer todos
            los días. Tu constancia es lo que te acerca a tu deseo.
          </p>

          <p className="r4w-panel-tip">
            Consejo rápido: responde lo antes posible cuando salga la pregunta
            del día. A misma constancia, la velocidad te hace escalar posiciones
            frente al resto.
          </p>

          <div className="r4w-panel-next">
            <div className="r4w-panel-next-label">tu siguiente movimiento</div>
            <div className="r4w-panel-next-main">
              En cuanto se active la pregunta de hoy, contesta desde este panel
              o desde la pantalla de carrera.
            </div>
            <div className="r4w-panel-next-time">
              Ventana de preguntas: de 09:00 a 00:00 (hora local).
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}