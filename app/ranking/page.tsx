// app/ranking/page.tsx
import Link from "next/link";

type RankingItem = {
  position: number;
  name: string;
  progressPercent: number; // % de constancia
  delta: number; // cambio de posición hoy
  isYou?: boolean;
};

const rankingData: RankingItem[] = [
  { position: 1, name: "Constante_01", progressPercent: 100, delta: +1 },
  { position: 2, name: "R4W_Focus", progressPercent: 100, delta: 0 },
  { position: 3, name: "DreamBig", progressPercent: 100, delta: +2 },
  { position: 11, name: "Runner_You", progressPercent: 60, delta: +5, isYou: true },
  { position: 12, name: "Calma_y_Ritmo", progressPercent: 60, delta: -1 },
  { position: 20, name: "SlowButSure", progressPercent: 40, delta: -3 },
];

const totalParticipants = 100;

export default function RankingPage() {
  const you = rankingData.find((r) => r.isYou);

  return (
    <main className="r4w-ranking-page">
      <section className="r4w-ranking-layout">
        {/* Cabecera */}
        <header className="r4w-ranking-header-row">
          <div>
            <div className="r4w-question-label">ranking carrera activa</div>
            <h1 className="r4w-ranking-title-main">
              Clasificación general · Carrera 7 días
            </h1>
            <p className="r4w-ranking-subtitle">
              Aquí ves cómo se mueve la carrera: posiciones, constancia y cambios
              de hoy. Recuerda que cada respuesta cuenta.
            </p>
          </div>
          <div className="r4w-ranking-chip">
            {totalParticipants} participantes
          </div>
        </header>

        {/* Resumen superior */}
        <div className="r4w-ranking-summary">
          <span>
            🥇 El top 3 mantiene el 100% de constancia. Tu objetivo es aparecer
            cada día, no hacer un sprint.
          </span>
          {you && (
            <span>
              🔍 Tú estás en la posición{" "}
              <strong>#{you.position}</strong> con{" "}
              <strong>{you.progressPercent}%</strong> de constancia.
            </span>
          )}
        </div>

        {/* Tabla ranking */}
        <div className="r4w-ranking-table">
          <div className="r4w-ranking-header">
            <div>Pos.</div>
            <div>Jugador</div>
            <div>Constancia</div>
            <div>Hoy</div>
          </div>

          {rankingData.map((item) => {
            const isTop3 = item.position <= 3;
            const isYou = item.isYou;

            let medal = "🏃";
            if (item.position === 1) medal = "🥇";
            else if (item.position === 2) medal = "🥈";
            else if (item.position === 3) medal = "🥉";

            return (
              <div
                key={item.position}
                className={
                  "r4w-ranking-row" + (isYou ? " r4w-ranking-row-you" : "")
                }
              >
                <div className="r4w-ranking-pos-cell">#{item.position}</div>

                <div className="r4w-ranking-name-cell">
                  <span className="r4w-ranking-medal">
                    {isTop3 ? medal : "🏃"}
                  </span>
                  <span>{item.name}</span>
                </div>

                <div className="r4w-ranking-progress-cell">
                  {item.progressPercent}% constancia
                </div>

                <div className="r4w-ranking-delta-cell">
                  {item.delta > 0 && (
                    <span className="r4w-ranking-delta-positive">
                      ▲ +{item.delta}
                    </span>
                  )}
                  {item.delta < 0 && (
                    <span className="r4w-ranking-delta-negative">
                      ▼ {item.delta}
                    </span>
                  )}
                  {item.delta === 0 && <span>─ sin cambios</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="r4w-ranking-footer">
          <span>
            Este ranking es una demo visual. Más adelante vendrá alimentado por
            los datos reales de tus carreras.
          </span>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/carrera/r7" className="r4w-secondary-btn">
              Volver a la carrera
              <span>🏁</span>
            </Link>
            <Link href="/panel" className="r4w-secondary-btn">
              Ir a mi panel
              <span>📊</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}