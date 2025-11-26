// app/ranking/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoRace, demoRanking } from "../data/r4wDemo";

type LastAdvance = {
  positions: number;
  ts: number;
};

export default function RankingPage() {
  const totalParticipants = demoRace.totalParticipants;

  const [rankingData, setRankingData] = useState(demoRanking);
  const [lastAdvance, setLastAdvance] = useState<LastAdvance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("r4w_last_advance");
      if (!raw) return;

      const parsed = JSON.parse(raw) as LastAdvance;
      setLastAdvance(parsed);

      // Ajustamos el delta de la fila del usuario según el último avance
      const updated = demoRanking.map((item) =>
        item.isYou
          ? {
              ...item,
              delta: parsed.positions,
            }
          : item
      );
      setRankingData(updated);
    } catch {
      // silencioso
    }
  }, []);

  return (
    <main className="r4w-ranking-page">
      <section className="r4w-ranking-layout">
        <header className="r4w-ranking-header">
          <div>
            <div className="r4w-question-label">ranking demo</div>
            <h1 className="r4w-question-title">
              Movimiento de posiciones en la carrera
            </h1>
            <p className="r4w-question-subtitle">
              Este ranking representa la lógica de Run4Wish: tu posición cambia
              según tu constancia y la velocidad con la que respondes la
              pregunta del día.
            </p>
          </div>

          <div className="r4w-panel-chip">
            Participantes: {totalParticipants}
          </div>
        </header>

        {/* Banner de último avance si existe */}
        {lastAdvance && (
          <div className="r4w-panel-advance-banner" style={{ marginTop: 8 }}>
            <div className="r4w-panel-advance-main">
              <span className="r4w-panel-advance-emoji">📈</span>
              <div>
                <div className="r4w-panel-advance-title">
                  Tu último movimiento
                </div>
                <div className="r4w-panel-advance-text">
                  En tu última respuesta correcta adelantaste{" "}
                  <strong>{lastAdvance.positions}</strong> puestos en la
                  clasificación.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta de ranking */}
        <div className="r4w-ranking-card" style={{ marginTop: 14 }}>
          <div className="r4w-ranking-title">Ranking de la carrera demo</div>
          <div className="r4w-ranking-list">
            {rankingData.map((item) => (
              <div
                key={item.position}
                className={
                  "r4w-ranking-item" + (item.isYou ? " r4w-ranking-you" : "")
                }
              >
                <div className="r4w-ranking-pos">#{item.position}</div>
                <div className="r4w-ranking-name">
                  {item.name}
                  {item.isYou && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        opacity: 0.8,
                      }}
                    >
                      (tú)
                    </span>
                  )}
                </div>
                <div className="r4w-ranking-progress">
                  {item.progressPercent}%
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

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <Link href="/carrera/r7" className="r4w-secondary-btn">
            Volver a la carrera
            <span>🏁</span>
          </Link>
          <Link href="/panel" className="r4w-secondary-btn">
            Ir a mi panel
            <span>📊</span>
          </Link>
        </div>
      </section>
    </main>
  );
}