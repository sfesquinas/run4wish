// app/panel/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

import { useStreak } from "../hooks/useStreak";
import { useUser } from "../hooks/useUser";
import { useUserRaces } from "../hooks/useUserRaces";
import { useWishes } from "../hooks/useWishes";
import { usePreregistrations } from "../hooks/usePreregistrations";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { useSimulatedRunners, useSimulateDailyProgress } from "../hooks/useSimulatedRunners";
import { useCombinedRanking } from "../hooks/useCombinedRanking";
import { useRaceProgress } from "../hooks/useRaceProgress";

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
  
  // 📝 Estado de la pregunta del día
  const { question: dailyQuestion, loading: questionLoading, error: questionError } = useDailyQuestion("7d_mvp");

  // 🤖 Runners simulados
  const { initialized: runnersInitialized } = useSimulatedRunners();
  const { daysPlayed } = useRaceProgress("r7", 7);
  const { simulated: dailyProgressSimulated } = useSimulateDailyProgress(daysPlayed);
  
  // 📊 Ranking combinado (real + simulado)
  const { ranking: combinedRanking, totalParticipants, userPosition } = useCombinedRanking("r7", "7d_mvp");

  const activeRaces = races.filter((r: any) => r.status === "active");

  // Estado local del panel
  const [openMessage, setOpenMessage] = useState<MessageKey | null>(null);
  const [localPreregCount, setLocalPreregCount] = useState<number | null>(null);
  const [lastAdvance, setLastAdvance] = useState<LastAdvance>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  // Handlers (deben estar antes de los returns tempranos)
  const handleOpenMessage = (key: MessageKey) => setOpenMessage(key);
  const handleCloseMessage = () => setOpenMessage(null);

  // Handler para regenerar carrera 7d_mvp (solo admin)
  const handleRegenerate7d = useCallback(async () => {
    try {
      setIsRegenerating(true);

      // Llamar al endpoint admin
      const res = await fetch("/api/admin/regenerate-7d-schedule", {
        method: "POST",
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        console.error("❌ Error regenerando carrera 7 días (frontend):", {
          status: res.status,
          statusText: res.statusText,
          body,
        });
        alert("No se ha podido regenerar tu carrera de 7 días.");
        return;
      }

      console.log("✅ Carrera 7 días regenerada correctamente", body);
      alert("Tu carrera de 7 días se ha regenerado con nuevas preguntas.");
      // Opcional: refrescar la página o el estado si hace falta
      // router.refresh?.();
    } catch (err: any) {
      console.error("💥 Error inesperado en handleRegenerate7d:", {
        message: err?.message || String(err),
        stack: err?.stack,
      });
      alert("Se ha producido un error inesperado al regenerar tu carrera.");
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  // 🔢 Número de prerreservas (BBDD → localStorage como backup)
  const preregCount =
    (preregistrations ?? []).length > 0
      ? (preregistrations ?? []).length
      : localPreregCount ?? 0;

  // 🔄 RETURNS DESPUÉS DE LOS HOOKS
  if (!isReady) {
    return (
      <main className="r4w-panel-page">
        <section className="r4w-panel-layout">
          <div className="r4w-panel-main">
            <div className="r4w-panel-hello">Cargando tu panel…</div>
          </div>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="r4w-panel-page">
        <section className="r4w-panel-layout">
          <div className="r4w-panel-main">
            <h1 className="r4w-panel-title">Tu panel Run4Wish</h1>
            <p className="r4w-panel-hello">
              Para ver tu posición y tus carreras, primero crea tu acceso.
            </p>
            <Link href="/registro" className="r4w-primary-btn">
              Ir a registro ➜
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="r4w-panel-page">
        <div className="r4w-panel-layout">
          {/* COLUMNA IZQUIERDA: resumen carrera + stats */}
          <section className="r4w-panel-main">
            {/* Mensaje de bienvenida */}
            <div style={{ marginBottom: 16, textAlign: "center", position: "relative" }}>
              <div style={{
                background: "linear-gradient(135deg, rgba(255, 122, 26, 0.15), rgba(255, 141, 58, 0.1))",
                borderRadius: "16px",
                padding: "14px 16px",
                border: "1px solid rgba(255, 122, 26, 0.3)",
                boxShadow: "0 4px 20px rgba(255, 122, 26, 0.15)"
              }}>
                <h1 style={{ 
                  fontSize: 18, 
                  fontWeight: 700, 
                  background: "linear-gradient(135deg, #FF7A1A, #FFC065)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  margin: 0, 
                  lineHeight: 1.4 
                }}>
                  Cada día que apareces, te acercas más a tu deseo ✨
                </h1>
              </div>
            </div>

            {/* Grid de estadísticas (3x2) */}
            <div className="r4w-panel-kpis">
              {/* WISHES DISPONIBLES */}
              <Link href="/wishes" className="r4w-panel-kpi-card">
                <div className="r4w-panel-kpi-icon">🔮</div>
                <div className="r4w-panel-kpi-label">WISHES DISPONIBLES</div>
                <div className="r4w-panel-kpi-value">{wishesLoading ? "…" : wishes}</div>
              </Link>

              {/* RACHA ACTUAL */}
              <Link href="/ranking" className="r4w-panel-kpi-card">
                <div className="r4w-panel-kpi-icon">🔥</div>
                <div className="r4w-panel-kpi-label">RACHA ACTUAL</div>
                <div className="r4w-panel-kpi-value">
                  {streakLoading ? "…" : `${streak} día${streak === 1 ? "" : "s"}`}
                </div>
              </Link>

              {/* CARRERAS ACTIVAS */}
              <Link href="/carreras" className="r4w-panel-kpi-card">
                <div className="r4w-panel-kpi-icon">🏁</div>
                <div className="r4w-panel-kpi-label">CARRERAS ACTIVAS</div>
                <div className="r4w-panel-kpi-value">{activeRaces.length}</div>
              </Link>

              {/* PUESTOS DESDE AYER */}
              <Link href="/ranking" className="r4w-panel-kpi-card">
                <div className="r4w-panel-kpi-icon">📈</div>
                <div className="r4w-panel-kpi-label">PUESTOS DESDE AYER</div>
                <div className="r4w-panel-kpi-value">
                  {lastAdvance ? `+${lastAdvance.positions}` : "0"}
                </div>
              </Link>

              {/* MEJOR POSICIÓN */}
              <Link href="/ranking" className="r4w-panel-kpi-card">
                <div className="r4w-panel-kpi-icon">⭐</div>
                <div className="r4w-panel-kpi-label">MEJOR POSICIÓN</div>
                <div className="r4w-panel-kpi-value">
                  {userPosition ? `#${userPosition}` : "—"}
                </div>
              </Link>

              {/* VER CARRERAS */}
              <Link href="/carreras" className="r4w-panel-kpi-card r4w-panel-kpi-button">
                <div className="r4w-panel-kpi-icon">🚀</div>
                <div className="r4w-panel-kpi-label">VER CARRERAS</div>
                <div className="r4w-panel-kpi-arrow">➜</div>
              </Link>
            </div>

            {/* Botón admin para regenerar carrera 7d_mvp */}
            {user?.email === "sara.fernandez@run4wish.com" && (
              <div
                className="r4w-admin-tools"
                style={{
                  marginTop: 24,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px dashed rgba(255,255,255,0.15)",
                  fontSize: 12,
                  opacity: 0.8,
                }}
              >
                <p style={{ marginBottom: 8 }}>
                  Herramientas ADMIN (solo visibles para ti).
                </p>
                <button
                  type="button"
                  onClick={handleRegenerate7d}
                  disabled={isRegenerating}
                  className="r4w-secondary-btn"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  {isRegenerating ? "Regenerando carrera 7 días..." : "Regenerar mi carrera 7 días (ADMIN)"}
                </button>
              </div>
            )}

            {/* Wish Meter */}
            <div className="r4w-meter-section">
              <h3 className="r4w-meter-title">Wish Meter</h3>
              <p className="r4w-meter-subtitle">Cuanta más actividad, más wishes.</p>
              <div className="r4w-meter-bar-container">
                <div className="r4w-meter-bar">
                  <div
                    className="r4w-meter-bar-fill"
                    style={{ width: `${Math.min((wishes / 10) * 100, 100)}%` }}
                  />
                </div>
                <div className="r4w-meter-labels">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            {/* Botón de energía */}
            <div className="r4w-panel-energy-card">
              <p className="r4w-panel-energy-text">
                Tienes energía de sobra para tu próximo deseo ✨✨
              </p>
            </div>
          </section>

          {/* COLUMNA DERECHA: mensajes + siguiente movimiento */}
          <section className="r4w-panel-side">
            <div className="r4w-message-buttons">
              <button
                type="button"
                className="r4w-message-btn-simple"
                onClick={() => handleOpenMessage("today")}
                title="Mensaje de hoy"
              >
                ✨
              </button>

              <button
                type="button"
                className="r4w-message-btn-simple"
                onClick={() => handleOpenMessage("nextMove")}
                title="Tu siguiente movimiento"
              >
                ➡️
              </button>

              <button
                type="button"
                className="r4w-message-btn-simple"
                onClick={() => handleOpenMessage("nextRaces")}
                title="Próximas carreras"
              >
                🏁
              </button>

              <button
                type="button"
                className="r4w-message-btn-simple"
                onClick={() => handleOpenMessage("fullRanking")}
                title="Ver ranking completo"
              >
                📈
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
              {openMessage === "nextMove" && "Tu siguiente movimiento"}
              {openMessage === "nextRaces" && "Próximas carreras"}
              {openMessage === "fullRanking" && "Ranking completo"}
            </div>

            {/* Contenidos por tipo */}
            {openMessage === "today" && (
              <>
                <h3 className="r4w-info-title">
                  Cada vez que respondes, estás apareciendo por ti ✨
                </h3>
                <p className="r4w-info-text">
                  Cada vez que respondes una pregunta, le dices a tu mente:
                  <strong>“estoy apareciendo por mí y por mi deseo”.</strong>{" "}
                  No importa si hoy subes mucho o poco en el ranking; lo
                  importante es que no te salgas de la carrera.
                </p>
                <p className="r4w-info-text">
                  Tip rápido: reserva 2 minutos al día para entrar a Run4Wish.
                  Si lo conviertes en un mini ritual, tu constancia se dispara
                  sola.
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Hoy aparezco por mí 💪
                </button>
              </>
            )}

            {openMessage === "nextMove" && (
              <>
                <h3 className="r4w-info-title">Tu siguiente movimiento</h3>
                <p className="r4w-info-text">
                  Comprueba si la pregunta de hoy ya está abierta y respóndela
                  desde la pantalla de carrera. Cada día respondido es un punto
                  más a tu favor frente al resto.
                </p>
                <p className="r4w-info-text">
                  <span className="r4w-info-highlight">
                    Ventana de preguntas: de 09:00 a 00:00 (hora local).
                  </span>
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Voy a moverme ahora 🏃‍♀️
                </button>
              </>
            )}

            {openMessage === "nextRaces" && (
              <>
                <h3 className="r4w-info-title">Próximas carreras</h3>
                <p className="r4w-info-text">
                  Ya tienes plaza asegurada en{" "}
                  <strong>{preregCount} futura(s) carrera(s)</strong>. En las
                  siguientes versiones podrás ver aquí el detalle de cada una.
                </p>
                <p className="r4w-info-text">
                  <span className="r4w-info-highlight">
                    Puedes gestionar tus preregistros desde la sección Carreras.
                  </span>
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Quiero seguir en la carrera 🚀
                </button>
              </>
            )}

            {openMessage === "fullRanking" && (
              <>
                <h3 className="r4w-info-title">Ranking completo</h3>
                <p className="r4w-info-text">
                  En el ranking completo verás cómo se mueve tu posición día a
                  día respecto al resto de runners.
                </p>
                <Link
                  href="/ranking"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={handleCloseMessage}
                >
                  Ver mi ranking ahora 📈
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}