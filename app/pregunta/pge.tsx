// app/pregunta/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function PreguntaDiaPage() {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;

    // Aquí luego conectaremos con API: guardar respuesta, calcular posición, etc.
    console.log("Respuesta enviada:", answer);

    setSubmitted(true);
  };

  return (
    <main className="r4w-question-page">
      <section className="r4w-question-layout">
        {/* CABECERA */}
        <header className="r4w-question-header">
          <div className="r4w-question-header-main">
            <div className="r4w-question-label">pregunta del día</div>
            <h1 className="r4w-question-main-title">
              Cada respuesta te acerca a tu deseo
            </h1>
            <p className="r4w-question-subtitle">
              Recuerda: la constancia es lo que te hace avanzar. Esta pregunta
              cuenta para tu posición en la carrera activa.
            </p>
          </div>
          <div className="r4w-question-chip">carrera 7 días</div>
        </header>

        {/* INFO SUPERIOR */}
        <div className="r4w-question-info-row">
          <div className="r4w-question-timer-pill">
            ⏱ Tiempo restante (demo): 01:23:45
          </div>
          <div className="r4w-question-window">
            Ventana disponible hoy: de 09:00 a 00:00 (hora local).
          </div>
        </div>

        {/* TARJETA PREGUNTA */}
        <div className="r4w-question-body">
          <div className="r4w-question-text">
            Si hoy pudieras dar un paso concreto hacia uno de tus deseos, ¿qué
            harías exactamente?
          </div>
          <div className="r4w-question-hint">
            Responde en una frase o dos. No hay respuestas correctas o
            incorrectas, pero tu constancia sí marca la diferencia en la
            clasificación.
          </div>

          {/* RESPUESTA */}
          <div className="r4w-answer-area">
            <textarea
              className="r4w-textarea"
              placeholder="Escribe aquí tu respuesta..."
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                if (submitted) setSubmitted(false);
              }}
            />

            <div className="r4w-answer-foot">
              <span>
                Podrás responder una sola vez a esta pregunta. Revísala antes de
                enviar.
              </span>

              <button
                type="button"
                className="r4w-primary-btn"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                style={{
                  opacity: answer.trim() ? 1 : 0.6,
                  paddingInline: 16,
                  minWidth: 150,
                }}
              >
                <span>Enviar respuesta</span>
                <span>➜</span>
              </button>
            </div>

            {submitted && (
              <div className="r4w-answer-feedback">
                ✅ Respuesta enviada. En cuanto se procese, tu posición en la
                carrera se actualizará según tu constancia y velocidad.
              </div>
            )}
          </div>
        </div>

        {/* ENLACES INFERIORES */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--r4w-muted)",
          }}
        >
          <Link href="/carrera/r7" className="r4w-secondary-btn">
            Volver a la carrera
            <span>🏁</span>
          </Link>

          <Link href="/panel" className="r4w-secondary-btn">
            Ver mi panel
            <span>📊</span>
          </Link>
        </div>
      </section>
    </main>
  );
}