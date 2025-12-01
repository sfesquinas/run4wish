"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "./hooks/useUser";

export default function HomePage() {
  const { user, isReady } = useUser();
  const [openInfo, setOpenInfo] = useState<"step1" | "step2" | "step3" | null>(null);

  if (!isReady) {
    return (
      <main className="r4w-home-page">
        <section className="r4w-home-hero">
          <p className="r4w-home-subtitle">Cargando Run4Wish…</p>
        </section>
      </main>
    );
  }

  // Si el usuario NO está logueado → diseño minimalista
  if (!user) {
    return (
      <main className="r4w-home-simple">
        <section className="r4w-home-simple-content">
          <div className="r4w-home-simple-ctas">
            <Link href="/login" className="r4w-primary-btn r4w-home-simple-btn">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="r4w-secondary-btn r4w-home-simple-btn">
              Registrar nuevo usuario
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Si el usuario ESTÁ logueado → redirigir al panel o mostrar contenido completo
  return (
    <main className="r4w-home">
      <section className="r4w-home-hero-pill">
        <h1 className="r4w-home-hero-title-orange">
          Corre por tus deseos
        </h1>
        <p className="r4w-home-hero-subtitle">
          <span>RUN</span>
          <span className="r4w-home-hero-4">4</span>
          <span>WISH</span> es una declaración de intenciones. Te mereces la oportunidad de demostrar que eres capaz de lograrlo. Responde preguntas y sube puestos en la carrera hacia tu deseo.
        </p>
      </section>

      <section className="r4w-home-howto">
        <p className="r4w-home-howto-subtitle">
          Tu misión es sencilla: responder, acertar y avanzar.
        </p>

        <div className="r4w-home-howto-steps">
          <div 
            className="r4w-home-howto-step r4w-home-howto-step-clickable"
            onClick={() => setOpenInfo("step1")}
            style={{ cursor: "pointer" }}
          >
            <span className="r4w-home-howto-step-number">1</span>
            <h3>Elige una carrera</h3>
            <p>Selecciona entre carreras de 24h, 7 días o 30 días.</p>
          </div>

          <div 
            className="r4w-home-howto-step r4w-home-howto-step-clickable"
            onClick={() => setOpenInfo("step2")}
            style={{ cursor: "pointer" }}
          >
            <span className="r4w-home-howto-step-number">2</span>
            <h3>Responde una pregunta</h3>
            <p>Sigue la ventana horaria. Cada acierto te hace adelantar posiciones.</p>
          </div>

          <div 
            className="r4w-home-howto-step r4w-home-howto-step-clickable"
            onClick={() => setOpenInfo("step3")}
            style={{ cursor: "pointer" }}
          >
            <span className="r4w-home-howto-step-number">3</span>
            <h3>Llega a la meta</h3>
            <p>Cuanta más constancia tengas, más cerca estarás del premio final.</p>
          </div>
        </div>
      </section>

      <section className="r4w-home-card">
        <div className="r4w-home-ctas">
          <Link href="/carreras" className="r4w-primary-btn r4w-home-start-btn">
            Empezar a jugar
          </Link>
        </div>
      </section>

      {/* Overlay de información para los pasos */}
      {openInfo && (
        <div className="r4w-info-overlay" onClick={() => setOpenInfo(null)}>
          <div className="r4w-info-card" onClick={(e) => e.stopPropagation()}>
            {openInfo === "step1" && (
              <>
                <div className="r4w-info-chip">💡 Información</div>
                <h3 className="r4w-info-title">Elige tus carreras</h3>
                <p className="r4w-info-text">
                  Puedes registrarte en <strong>tantas carreras como quieras</strong>. 
                  No hay límite. Participa en todas las que te interesen y compite 
                  simultáneamente en varias carreras.
                </p>
                <p className="r4w-info-text">
                  Cada carrera tiene su propio ranking y premio. ¡Cuanta más constancia 
                  tengas, más oportunidades de ganar tendrás!
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={() => setOpenInfo(null)}
                >
                  Entendido ✨
                </button>
              </>
            )}

            {openInfo === "step2" && (
              <>
                <div className="r4w-info-chip">⚡ Estrategia</div>
                <h3 className="r4w-info-title">Responde rápido y todas las preguntas</h3>
                <p className="r4w-info-text">
                  Con cada respuesta acertada <strong>adelantas posiciones</strong> en el ranking. 
                  Pero hay más: si respondes <strong>antes que tus competidores</strong>, 
                  adelantarás <strong>más puestos aún</strong>.
                </p>
                <p className="r4w-info-text">
                  <span className="r4w-info-highlight">
                    Es imprescindible responder todas las preguntas.
                  </span>
                </p>
                <p className="r4w-info-text">
                  <strong>🎯 Importante:</strong> Si has respondido a <strong>todas las preguntas 
                  en todas las carreras</strong>, habrá una pregunta especial que te puede 
                  posicionar en el <strong>primer lugar</strong>. Pero solo si has completado 
                  todas las preguntas anteriores.
                </p>
                <p className="r4w-info-text">
                  <strong>💪 Consejo:</strong> Responde todas las preguntas e intenta ser el más 
                  rápido. La constancia y la velocidad son tus aliadas.
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={() => setOpenInfo(null)}
                >
                  ¡A por todas! 🚀
                </button>
              </>
            )}

            {openInfo === "step3" && (
              <>
                <div className="r4w-info-chip">💪 Motivación</div>
                <h3 className="r4w-info-title">Sigue adelante, no decaigas</h3>
                <p className="r4w-info-text">
                  <strong>La constancia es tu mayor poder.</strong> Cada día que respondes, 
                  cada pregunta que contestas, te acerca más a tu deseo.
                </p>
                <p className="r4w-info-text">
                  No importa si hoy subes mucho o poco en el ranking. Lo importante es que 
                  <strong> no te salgas de la carrera</strong>. Mantén el ritmo, sé constante.
                </p>
                <p className="r4w-info-text">
                  <span className="r4w-info-highlight">
                    Cada paso cuenta. Cada respuesta te hace más fuerte. 
                    Sigue adelante, tu deseo te espera al final.
                  </span>
                </p>
                <button
                  type="button"
                  className="r4w-primary-btn r4w-info-close-btn"
                  onClick={() => setOpenInfo(null)}
                >
                  ¡Sigo adelante! 💫
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}