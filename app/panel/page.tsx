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

  const handleOpenMessage = (key: MessageKey) => setOpenMessage(key);
  const handleCloseMessage = () => setOpenMessage(null);

  return (
    <>
      <main className="r4w-panel-page">
        <div className="r4w-panel-layout">
          {/* 👋 Burbuja de bienvenida */}
          <div className="r4w-panel-welcome">
            <div className="r4w-panel-chip r4w-panel-chip-left">
              <strong>{displayName}</strong>
            </div>
          </div>

          {/* COLUMNA IZQUIERDA: resumen carrera + stats */}
          <section className="r4w-panel-main">
            <header className="">
              <div>
                <h1 className="r4w-panel-title">
                  Esta es tu posición en Run4Wish 📊
                </h1>

                <p className="r4w-panel-tagline">
                  Aquí gana quien aparece cada día. La constancia pesa más que
                  la suerte.
                </p>

                {/* 🔮 Wishes actuales */}
                <div className="r4w-panel-chip">
                  🔮 Wishes disponibles:{" "}
                  <strong>{wishesLoading ? "…" : wishes}</strong>
                </div>

                {/* 🔥 Racha actual */}
                <div className="r4w-panel-chip">
                  🔥 Racha actual:{" "}
                  <strong>
                    {streakLoading ? "…" : `${streak} día${streak === 1 ? "" : "s"}`}
                  </strong>
                </div>

                {/* Contador de carreras activas */}
                <div className="r4w-panel-chip r4w-panel-chip-center">
                  Carreras activas: {activeRaces.length}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <Link href="/pregunta" className="r4w-secondary-btn">
                  Pregunta de hoy <span>❓</span>
                </Link>

                <Link href="/perfil" className="r4w-secondary-btn">
                  Editar perfil <span>👤</span>
                </Link>
              </div>
            </header>

            {/* Último avance en la carrera */}
            {lastAdvance && (
              <div className="r4w-panel-next" style={{ marginTop: 16 }}>
                <div className="r4w-panel-next-label">Tu último avance 🎉</div>
                <div className="r4w-panel-next-main">
                  En tu última respuesta correcta adelantaste{" "}
                  <strong>{lastAdvance.positions}</strong> puestos en la
                  carrera.
                </div>
                <div className="r4w-panel-next-time">
                  Sigue respondiendo cada día para mantener el ritmo.
                </div>
              </div>
            )}

            {/* Lista de carreras activas */}
            {activeRaces.length > 0 ? (
              <div className="r4w-panel-racelist">
                {activeRaces.map((race: any) => {
                  const hasAnsweredToday = Boolean(
                    race.hasAnsweredToday ?? false
                  );

                  return (
                    <div key={race.id ?? "r7"} className="r4w-panel-racecard">
                      <div className="r4w-panel-race-header">
                        <div className="r4w-panel-race-name">
                          {race.name ?? "Carrera 7 días · MVP"}
                        </div>
                      </div>

                      <div className="r4w-panel-race-meta">
                        <span>
                          <span className="r4w-dot" />
                          Días jugados: {race.daysPlayed ?? 0}/
                          {race.daysTotal ?? 7}
                        </span>
                        <span>Posición: #{race.position ?? 12}</span>
                        <span>
                          Participantes: {race.totalParticipants ?? 100}
                        </span>
                      </div>

                      <div className="r4w-panel-race-footer">
                        <span>
                          {hasAnsweredToday
                            ? "Ya has respondido la pregunta de hoy. Mañana seguimos."
                            : "Tienes una pregunta pendiente hoy. Responde para seguir avanzando."}
                        </span>
                        <Link
                          href={`/carrera/${race.id ?? "r7"}`}
                          className={[
                            "r4w-panel-race-button",
                            hasAnsweredToday ? "done" : "pending",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {hasAnsweredToday
                            ? "Pregunta ya respondida"
                            : "Ir a la carrera"}{" "}
                          <span>🏁</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="r4w-panel-next" style={{ marginTop: 16 }}>
                <div className="r4w-panel-next-label">Sin carreras activas</div>
                <div className="r4w-panel-next-main">
                  Aún no tienes ninguna carrera en marcha.
                </div>
                <div className="r4w-panel-next-time">
                  Tu constancia empieza el día que te apuntas.
                </div>
                <div style={{ marginTop: 12 }}>
                  <Link href="/carreras" className="r4w-secondary-btn">
                    Ir a carreras <span>🏁</span>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* COLUMNA DERECHA: mensajes + siguiente movimiento */}
          <section className="r4w-panel-side">
            <h2 className="r4w-panel-side-title">Mensajes Run4Wish</h2>
            <p className="r4w-panel-quote">
              Pequeños recordatorios para que sigas{" "}
              <em>apareciendo por ti y por tu deseo.</em>
            </p>

            {/* Chip de prerreservas */}
            <div
              className="r4w-panel-chip r4w-panel-chip-left"
              style={{ marginBottom: 12 }}
            >
              Prerreservas de carreras: <strong>{preregCount}</strong>
            </div>

            <div className="r4w-message-buttons">
              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("today")}
              >
                <span>Mensaje de hoy ✨</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>

              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("nextMove")}
              >
                <span>Tu siguiente movimiento ➡️</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>

              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("nextRaces")}
              >
                <span>Próximas carreras 🏁</span>
                <span className="r4w-message-btn-icon">➜</span>
              </button>

              <button
                type="button"
                className="r4w-message-btn"
                onClick={() => handleOpenMessage("fullRanking")}
              >
                <span>Ver ranking completo 📈</span>
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