// app/panel/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

import { useStreak } from "../hooks/useStreak";
import { useUser } from "../hooks/useUser";
import { useUserRaces } from "../hooks/useUserRaces";
import { useWishes } from "../hooks/useWishes";
import { usePreregistrations } from "../hooks/usePreregistrations";

type MessageKey = "today" | "nextMove" | "nextRaces" | "fullRanking";

type LastAdvance = {
  positions: number;
  ts: number;
} | null;

export default function PanelPage() {
  const router = useRouter();
  const { user, isReady } = useUser() as any;

  // 🔁 Datos del usuario
  const { races, loading, refresh } = useUserRaces(user?.email ?? null);
  const { streak, loading: streakLoading } = useStreak();
  const { wishes, loading: wishesLoading } = useWishes(user?.id ?? null);
  const { preregistrations = [] } = usePreregistrations(user?.email ?? null);

  const activeRaces = races.filter((r: any) => r.status === "active");

  // Estado local del panel
  const [openMessage, setOpenMessage] = useState<MessageKey | null>(null);
  const [localPreregCount, setLocalPreregCount] = useState<number | null>(null);
  const [lastAdvance, setLastAdvance] = useState<LastAdvance>(null);

  // 👤 Nombre para mostrar
  const baseName =
    (user as any)?.username_game ??
    (user as any)?.username ??
    (user as any)?.displayName ??
    "Runner";

  const displayName = `${baseName} ✨`;

  // Guard: si no hay usuario cuando ya hemos cargado, lo mandamos a /login
  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  // Leer datos guardados en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prerregistros
    const storedPrereg = window.localStorage.getItem("r4w_prereg_count");
    if (storedPrereg) setLocalPreregCount(Number(storedPrereg));

    // Último avance (puestos adelantados)
    const storedAdvance = window.localStorage.getItem("r4w_last_advance");
    if (storedAdvance) {
      try {
        const parsed = JSON.parse(storedAdvance);
        setLastAdvance(parsed);
      } catch {
        // si por lo que sea está corrupto, lo ignoramos
      }
    }
  }, []);

  // mini-confeti suave al abrir cualquier mensaje
  useEffect(() => {
    if (!openMessage) return;
    if (typeof window === "undefined") return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.2 },
      scalar: 0.6,
      ticks: 120,
    });
  }, [openMessage]);

  // 🔢 Número de prerreservas (BBDD → localStorage como backup)
  const preregCount =
    (preregistrations ?? []).length > 0
      ? (preregistrations ?? []).length
      : localPreregCount ?? 0;

  // 🔄 RETURNS DESPUÉS DE LOS HOOKS
  if (!isReady) {
    return (
      <main className="r4w-panel-page">
        <section className="r4w-panel-layout r4w-panel-enter">
          <div className="r4w-panel-main">
            <div className="r4w-panel-hello">Cargando tu panel…</div>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    // No mostrar nada, el useEffect ya redirige a /login
    return null;
  }

  const handleOpenMessage = (key: MessageKey) => setOpenMessage(key);
  const handleCloseMessage = () => setOpenMessage(null);

  return (
    <>
      <main className="r4w-panel-page">
        <div className="r4w-panel-layout r4w-panel-enter">
          {/* COLUMNA IZQUIERDA: resumen carrera + stats */}
          <section className="r4w-panel-main">
            {/* Header: saludo en una línea */}
            <header className="r4w-panel-header">
              <div className="r4w-panel-header-left">
                <h1 className="r4w-panel-greeting">
                  Cada día que apareces, te acercas más a tu deseo ✨
                </h1>
              </div>
            </header>

            {/* Sección de KPIs en cuadrícula 3x2 */}
            <div className="r4w-panel-kpis">
              {/* Fila 1 */}
              <div className="r4w-panel-kpi-card r4w-kpi-anim-1">
                <div className="r4w-panel-kpi-icon">🔮</div>
                <div className="r4w-panel-kpi-label">Wishes disponibles</div>
                <div className="r4w-panel-kpi-value">
                  {wishesLoading ? "…" : wishes}
                </div>
              </div>

              <div className="r4w-panel-kpi-card r4w-kpi-anim-2">
                <div className="r4w-panel-kpi-icon">🔥</div>
                <div className="r4w-panel-kpi-label">Racha actual</div>
                <div className="r4w-panel-kpi-value">
                  {streakLoading ? "…" : `${streak} día${streak === 1 ? "" : "s"}`}
                </div>
              </div>

              <div className="r4w-panel-kpi-card r4w-kpi-anim-3">
                <div className="r4w-panel-kpi-icon">🏁</div>
                <div className="r4w-panel-kpi-label">Carreras activas</div>
                <div className="r4w-panel-kpi-value">{activeRaces.length}</div>
              </div>

              {/* Fila 2 */}
              <div className="r4w-panel-kpi-card r4w-kpi-anim-4">
                <div className="r4w-panel-kpi-icon">📈</div>
                <div className="r4w-panel-kpi-label">Puestos desde ayer</div>
                <div className="r4w-panel-kpi-value">
                  {lastAdvance ? `+${lastAdvance.positions}` : "0"}
                </div>
              </div>

              <div className="r4w-panel-kpi-card r4w-kpi-anim-5">
                <div className="r4w-panel-kpi-icon">⭐</div>
                <div className="r4w-panel-kpi-label">Mejor posición</div>
                <div className="r4w-panel-kpi-value">
                  {activeRaces.length > 0 
                    ? `#${Math.min(...activeRaces.map((r: any) => r.position ?? 999))}`
                    : "—"}
                </div>
              </div>

              <Link href="/carreras" className="r4w-panel-kpi-card r4w-panel-kpi-card-button r4w-kpi-anim-6">
                <div className="r4w-panel-kpi-icon">🚀</div>
                <div className="r4w-panel-kpi-label">Ver carreras</div>
                <div className="r4w-panel-kpi-value">→</div>
              </Link>
            </div>

            {/* Wish Meter */}
            <div className="r4w-meter-container">
              <div className="r4w-meter-header">
                <h3 className="r4w-meter-title">Wish Meter</h3>
                <p className="r4w-meter-subtitle">
                  Cuanta más actividad, más wishes.
                </p>
              </div>
              <div className="r4w-meter-bar-container">
                <div 
                  className="r4w-meter-bar"
                  style={{ width: `${Math.min((wishes / 10) * 100, 100)}%` }}
                />
                <div className="r4w-meter-labels">
                  <span className="r4w-meter-label-min">0</span>
                  <span className="r4w-meter-label-max">10</span>
                </div>
              </div>
              {wishes >= 10 ? (
                <>
                  <div className="r4w-meter-message r4w-meter-message-full">
                    Tienes energía de sobra para tu próximo deseo ✨
                  </div>
                  <Link href="/pregunta" className="r4w-meter-action-btn">
                    Pregunta de hoy
                  </Link>
                </>
              ) : (
                <div className="r4w-meter-value">
                  {wishesLoading ? "…" : wishes} / 10 wishes
                </div>
              )}
            </div>

            {/* Tarjeta demo cuando no hay carreras activas */}
            {activeRaces.length === 0 && (
              <div className="r4w-panel-demo-card">
                <div className="r4w-panel-demo-label">MVP · Demo</div>
                <div className="r4w-panel-demo-title">Demo · Carrera 7 días</div>
                <div className="r4w-panel-demo-text">
                  Este es un ejemplo de cómo verías tu carrera cuando esté activa.
                </div>
                <div className="r4w-panel-demo-hint">
                  Únete a una carrera real para empezar a sumar puntos y avanzar posiciones.
                </div>
                <Link href="/carreras" className="r4w-panel-demo-btn">
                  Ver carreras disponibles <span>🏁</span>
                </Link>
              </div>
            )}
          </section>

          {/* COLUMNA DERECHA: mensajes + siguiente movimiento */}
          <section className="r4w-panel-side">
            <h2 className="r4w-panel-side-title">Mensajes Run4Wish</h2>
            <p className="r4w-panel-quote">
              Recordatorios para que sigas en carrera.
            </p>

            {/* Chip de prerreservas */}
            <div
              className="r4w-panel-chip r4w-panel-chip-left"
              style={{ marginBottom: 12 }}
            >
              Prerreservas: <strong>{preregCount}</strong>
            </div>

            <div className="r4w-message-buttons">
              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("today")}
              >
                <span>Mensaje de hoy</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>

              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("nextMove")}
              >
                <span>Siguiente movimiento</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>

              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("nextRaces")}
              >
                <span>Próximas carreras</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>

              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("fullRanking")}
              >
                <span>Ranking completo</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* OVERLAY FLOTANTE DE MENSAJES */}
      {openMessage && (
        <div className="r4w-info-overlay">
          <div className="r4w-info-card">
            {/* Chip superior */}
            <div className="r4w-info-chip">
              {openMessage === "today" && "Mensaje de hoy"}
              {openMessage === "nextMove" && "Siguiente movimiento"}
              {openMessage === "nextRaces" && "Próximas carreras"}
              {openMessage === "fullRanking" && "Ranking completo"}
            </div>

            {/* Contenidos por tipo */}
            {openMessage === "today" && (
              <>
                <h3 className="r4w-info-title">
                  Aparece cada día y suma puntos ✨
                </h3>
                <p className="r4w-info-text">
                  Cada respuesta suma. No importa si subes mucho o poco; lo importante es que sigas en carrera.
                </p>
                <p className="r4w-info-text">
                  <strong>Tip:</strong> 2 minutos al día. Conviértelo en ritual y tu constancia se dispara sola.
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Hoy sumo puntos 💪
                </button>
              </>
            )}

            {openMessage === "nextMove" && (
              <>
                <h3 className="r4w-info-title">Siguiente movimiento</h3>
                <p className="r4w-info-text">
                  Responde la pregunta de hoy y suma puntos. Cada día respondido te acerca más a tu meta.
                </p>
                <p className="r4w-info-text">
                  <span className="r4w-info-highlight">
                    Ventana: 09:00 - 00:00 (hora local).
                  </span>
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Ir a responder 🏃‍♀️
                </button>
              </>
            )}

            {openMessage === "nextRaces" && (
              <>
                <h3 className="r4w-info-title">Próximas carreras</h3>
                <p className="r4w-info-text">
                  Tienes plaza en <strong>{preregCount} carrera{preregCount !== 1 ? "s" : ""}</strong>. Pronto verás el detalle de cada una.
                </p>
                <p className="r4w-info-text">
                  <span className="r4w-info-highlight">
                    Gestiona tus preregistros en la sección Carreras.
                  </span>
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Ver carreras 🚀
                </button>
              </>
            )}

            {openMessage === "fullRanking" && (
              <>
                <h3 className="r4w-info-title">Ranking completo</h3>
                <p className="r4w-info-text">
                  Ve cómo se mueve tu posición día a día frente al resto de runners.
                </p>
                <Link
                  href="/ranking"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Ver ranking 📈
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}