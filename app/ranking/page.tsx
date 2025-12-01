// app/ranking/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoRace, demoRanking } from "../data/r4wDemo";
import { useCombinedRanking } from "../hooks/useCombinedRanking";
import { useRaceProgress } from "../hooks/useRaceProgress";

type LastAdvance = {
  positions: number;
  ts: number;
};

export default function RankingPage() {
  const { daysPlayed } = useRaceProgress("r7", 7);
  const { ranking: combinedRanking, totalParticipants, userPosition, loading: rankingLoading } = useCombinedRanking("r7", "7d_mvp");
  
  const [rankingData, setRankingData] = useState(demoRanking);
  const [lastAdvance, setLastAdvance] = useState<LastAdvance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("r4w_last_advance");
      if (raw) {
        const parsed = JSON.parse(raw) as LastAdvance;
        setLastAdvance(parsed);
      }
    } catch {
      // silencioso
    }
  }, []);

  // Usar ranking combinado si está disponible, sino usar demo
  useEffect(() => {
    if (combinedRanking.length > 0 && !rankingLoading) {
      setRankingData(combinedRanking);
    }
  }, [combinedRanking, rankingLoading]);

  // Obtener top 3 para el podio (orden: 2do, 1ro, 3ro para el podio visual)
  const top3 = rankingData.slice(0, 3);
  const restRanking = rankingData.slice(3);
  
  // Encontrar la posición del usuario en el ranking completo
  const userRankingIndex = rankingData.findIndex(item => item.isYou);
  
  // Calcular qué elementos mostrar: 3 anteriores, el usuario, y 3 posteriores
  const getVisibleRanking = () => {
    if (userRankingIndex < 0) {
      // Si no se encuentra el usuario, mostrar los primeros
      return rankingData.slice(0, 7);
    }
    
    const startIndex = Math.max(0, userRankingIndex - 3);
    const endIndex = Math.min(rankingData.length, userRankingIndex + 4); // +4 porque incluye el usuario
    
    return rankingData.slice(startIndex, endIndex);
  };
  
  const visibleRanking = getVisibleRanking();
  
  // Scroll automático a la posición del usuario cuando se carga
  useEffect(() => {
    if (userRankingIndex >= 0 && typeof document !== "undefined") {
      const timer = setTimeout(() => {
        const userElement = document.querySelector(`[data-position="${userRankingIndex + 1}"]`);
        if (userElement) {
          userElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userRankingIndex, rankingData]);

  // Mensaje motivador basado en la posición
  const getMotivationalMessage = () => {
    if (!userPosition) return null;
    if (userPosition <= 3) return "¡Estás en el podio! 🏆 Sigue así";
    if (userPosition <= 10) return "¡Top 10! 💪 Estás cerca del podio";
    if (userPosition <= 25) return "¡Bien posicionado! 🚀 Sigue avanzando";
    return "¡Sigue corriendo! 💫 Cada día cuenta";
  };

  return (
    <main className="r4w-ranking-page">
      <section className="r4w-ranking-layout">
        <header className="r4w-ranking-header">
        </header>

        {/* Banner de último avance si existe */}
        {lastAdvance && (
          <div className="r4w-ranking-advance-banner">
            <div className="r4w-ranking-advance-icon">📈</div>
            <div className="r4w-ranking-advance-content">
              <div className="r4w-ranking-advance-title">¡Último movimiento!</div>
              <div className="r4w-ranking-advance-text">
                Adelantaste <strong>{lastAdvance.positions} puestos</strong> en tu última respuesta correcta
              </div>
            </div>
          </div>
        )}

        {/* Podio visual real para top 3 */}
        {top3.length >= 3 && (
          <div className="r4w-ranking-podium-container">
            <div className="r4w-ranking-podium-title">🏆 Podio de la carrera</div>
            <div className="r4w-ranking-podium">
              {/* 2do lugar (izquierda) */}
              <div className="r4w-ranking-podium-item r4w-ranking-podium-second">
                <div className="r4w-ranking-podium-medal">🥈</div>
                <div className="r4w-ranking-podium-stand">
                  <div className="r4w-ranking-podium-name">{top3[1].name}</div>
                  <div className="r4w-ranking-podium-pos">#{top3[1].position}</div>
                </div>
              </div>
              
              {/* 1er lugar (centro, más alto) */}
              <div className="r4w-ranking-podium-item r4w-ranking-podium-first">
                <div className="r4w-ranking-podium-medal">🥇</div>
                <div className="r4w-ranking-podium-stand r4w-ranking-podium-stand-first">
                  <div className="r4w-ranking-podium-name">{top3[0].name}</div>
                  <div className="r4w-ranking-podium-pos">#{top3[0].position}</div>
                </div>
              </div>
              
              {/* 3er lugar (derecha) */}
              <div className="r4w-ranking-podium-item r4w-ranking-podium-third">
                <div className="r4w-ranking-podium-medal">🥉</div>
                <div className="r4w-ranking-podium-stand">
                  <div className="r4w-ranking-podium-name">{top3[2].name}</div>
                  <div className="r4w-ranking-podium-pos">#{top3[2].position}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recuadro de estadísticas */}
        <div className="r4w-ranking-stats-box">
          <div className="r4w-ranking-stats-item">
            <span className="r4w-ranking-stats-label">Participantes</span>
            <span className="r4w-ranking-stats-number">{totalParticipants}</span>
          </div>
          {userPosition && (
            <div className="r4w-ranking-stats-item r4w-ranking-stats-item-highlight">
              <span className="r4w-ranking-stats-label">Tu posición</span>
              <span className="r4w-ranking-stats-number">#{userPosition}</span>
            </div>
          )}
        </div>

        {/* Lista del ranking (solo 3 anteriores y 3 posteriores al usuario) */}
        {rankingData.length > 0 && (
          <div className="r4w-ranking-list-container">
            <div className="r4w-ranking-list-title">📊 Clasificación</div>
            <div className="r4w-ranking-list-header">
              <span>Pos</span>
              <span>Runner</span>
              <span>Progreso</span>
              <span>Cambio</span>
            </div>
            <div className="r4w-ranking-list" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {visibleRanking.map((item) => (
                <div
                  key={item.position}
                  data-position={item.position}
                  className={`r4w-ranking-item ${item.isYou ? "r4w-ranking-you" : ""} ${item.position <= 3 ? "r4w-ranking-top3" : ""}`}
                >
                  <div className="r4w-ranking-pos">
                    {item.position <= 3 ? (
                      <span className="r4w-ranking-medal-icon">
                        {item.position === 1 ? "🥇" : item.position === 2 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      `#${item.position}`
                    )}
                  </div>
                  <div className="r4w-ranking-name">
                    {item.isYou && <span className="r4w-ranking-you-badge">TÚ</span>}
                    <span className="r4w-ranking-name-text">{item.name}</span>
                  </div>
                  <div className="r4w-ranking-progress">
                    <div className="r4w-ranking-progress-bar">
                      <div
                        className="r4w-ranking-progress-fill"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <span className="r4w-ranking-progress-text">{item.progressPercent}%</span>
                  </div>
                  <div
                    className={`r4w-ranking-delta ${
                      item.delta > 0
                        ? "r4w-ranking-delta-positive"
                        : item.delta < 0
                        ? "r4w-ranking-delta-negative"
                        : "r4w-ranking-delta-neutral"
                    }`}
                  >
                    {item.delta > 0 && `↑ +${item.delta}`}
                    {item.delta < 0 && `↓ ${item.delta}`}
                    {item.delta === 0 && "─"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="r4w-ranking-footer" style={{ display: "flex", gap: 8, width: "100%" }}>
          <Link href="/carreras" className="r4w-secondary-btn" style={{ flex: 1 }}>
            Ver Carreras
            <span>🏁</span>
          </Link>
          <Link href="/perfil" className="r4w-secondary-btn" style={{ flex: 1 }}>
            Ver mi perfil
            <span>👤</span>
          </Link>
          <Link href="/panel" className="r4w-secondary-btn" style={{ flex: 1 }}>
            Ver mi panel
            <span>📊</span>
          </Link>
        </div>
      </section>
    </main>
  );
}