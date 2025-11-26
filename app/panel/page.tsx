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
  const userName = "Runner"; // luego vendrá del perfil
  const mainRace = activeRaces[0];

  const totalRaces = activeRaces.length;

  return (
    <main className="r4w-panel-page">
      <div className="r4w-panel-layout">
        {/* COLUMNA IZQUIERDA: resumen + carreras activas */}
        <section className="r4w-panel-main">
          {/* Cabecera */}
          <header className="r4w-panel-header">
            <div>
              <div className="r4w-panel-hello">Hola, {userName} 👋</div>
              <div className="r4w-panel-title">
                Esta es tu posición en Run4Wish
              </div>
              <div className="r4w-panel-tagline">
                Aquí gana quien aparece cada día. La constancia pesa más que la
                suerte.
              </div>
            </div>
            <div className="r4w-panel-chip">
              carreras activas: {totalRaces}
            </div>
          </header>

          {/* Stats rápidas de la carrera principal */}
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
                  {mainRace.daysPlayed} 🔥
                </div>
                <div className="r4w-panel-stat-caption">
                  Si mantienes la racha, sigues subiendo puestos.
                </div>
              </div>
            </div>
          )}

          {/* Lista de carreras en las que participa */}
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
                    <Link
                      href={`/carrera/${race.id}`}
                      className="r4w-secondary-btn"
                    >
                      Ir a la carrera
                      <span>➜</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* COLUMNA DERECHA: motivación + siguiente movimiento */}
        <section className="r4w-panel-side">
          <h2 className="r4w-panel-side-title">Mensaje para hoy ✨</h2>
          <p className="r4w-panel-quote">
            Cada vez que respondes una pregunta, le dices a tu mente:{" "}
            <em>"estoy apareciendo por mí y por mi deseo".</em> No importa si hoy
            subes mucho o poco en el ranking; lo importante es que no te salgas
            de la carrera.
          </p>

          <p className="r4w-panel-tip">
            Tip rápido: reserva 2 minutos al día para entrar a Run4Wish. Si lo
            conviertes en un mini ritual, tu constancia se dispara sola.
          </p>

          <div className="r4w-panel-next">
            <div className="r4w-panel-next-label">tu siguiente movimiento</div>
            <div className="r4w-panel-next-main">
              Comprueba si la pregunta de hoy ya está abierta y respóndela desde
              la pantalla de carrera. Cada día respondido es un punto más a tu
              favor frente al resto.
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