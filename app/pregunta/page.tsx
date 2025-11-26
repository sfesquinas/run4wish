// app/pregunta/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const INITIAL_WISHES_TODAY = 1; // 1 intento incluido; más intentos consumirían wishes extra

const question = {
  text:
    "Si hoy pudieras dar un paso concreto hacia uno de tus deseos, ¿qué harías exactamente?",
  options: [
    {
      id: "A",
      label: "Daría un pequeño paso realista hoy mismo.",
      correct: true,
    },
    {
      id: "B",
      label: "Esperaría a tener más tiempo o dinero.",
      correct: false,
    },
    {
      id: "C",
      label: "Lo dejaría para más adelante, ahora no es el momento.",
      correct: false,
    },
  ],
};

export default function PreguntaDiaPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [wishesLeft, setWishesLeft] = useState<number>(INITIAL_WISHES_TODAY);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (locked) return;
    if (!selected) return;
    if (wishesLeft <= 0) return;

    const option = question.options.find((o) => o.id === selected);
    const correct = option?.correct ?? false;

    const remaining = wishesLeft - 1;
    setWishesLeft(remaining);

    if (correct) {
      setIsCorrect(true);
      setFeedback(
        "✅ Respuesta correcta. Has sumado constancia para la carrera de hoy."
      );
      setLocked(true);
    } else {
      setIsCorrect(false);
      if (remaining > 0) {
        setFeedback(
          "❌ No es correcta. Puedes volver a intentarlo, gastando otro wish."
        );
      } else {
        setFeedback(
          "❌ No es correcta y te has quedado sin wishes para hoy. Podrás seguir compitiendo en la próxima pregunta o comprando más wishes (próximamente)."
        );
        setLocked(true);
      }
    }
  };

  const handleSelect = (id: string) => {
    if (locked) return;
    setSelected(id);
    setFeedback(null);
    setIsCorrect(null);
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
              Pregunta tipo test con 3 opciones. Tu constancia y la velocidad
              con la que respondes impactan en tu posición en la carrera.
            </p>
          </div>
          <div className="r4w-question-chip">carrera 7 días</div>
        </header>

        {/* INFO SUPERIOR */}
        <div className="r4w-question-info-row">
          <div className="r4w-question-timer-pill">
            ⏱ Tiempo restante (demo): 01:23:45
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignItems: "flex-end",
            }}
          >
            <div className="r4w-question-window">
              Ventana disponible hoy: de 09:00 a 00:00 (hora local).
            </div>
            <div className="r4w-wishes-pill">
              Wishes para responder hoy: {wishesLeft}
            </div>
          </div>
        </div>

        {/* TARJETA PREGUNTA */}
        <div className="r4w-question-body">
          <div className="r4w-question-text">{question.text}</div>
          <div className="r4w-question-hint">
            Elige una de las tres opciones. Si fallas y quieres volver a
            intentarlo, gastarás otro wish. Más adelante podrás comprar wishes
            extra si los necesitas.
          </div>

          {/* OPCIONES */}
          <div className="r4w-options-grid">
            {question.options.map((opt) => {
              const isSelected = selected === opt.id;
              const classes = ["r4w-option-card"];
              if (isSelected) classes.push("selected");
              if (locked) classes.push("locked");
              if (isSelected && locked && isCorrect === false)
                classes.push("incorrect");
              if (isSelected && locked && isCorrect === true)
                classes.push("correct");

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={classes.join(" ")}
                  disabled={locked}
                >
                  <div className="r4w-option-letter">{opt.id}</div>
                  <div className="r4w-option-text">{opt.label}</div>
                </button>
              );
            })}
          </div>

          {/* PIE + BOTÓN */}
          <div className="r4w-answer-area">
            <div className="r4w-answer-foot">
              <span>
                Cada intento consume 1 wish. Cuando te quedes sin wishes, ya no
                podrás responder más a la pregunta de hoy.
              </span>

              <button
                type="button"
                className="r4w-primary-btn"
                onClick={handleSubmit}
                disabled={!selected || wishesLeft <= 0 || locked}
                style={{
                  opacity: !selected || wishesLeft <= 0 || locked ? 0.6 : 1,
                  paddingInline: 16,
                  minWidth: 150,
                }}
              >
                <span>
                  {locked
                    ? "Respuesta registrada"
                    : wishesLeft > 0
                    ? "Enviar respuesta"
                    : "Sin wishes"}
                </span>
                <span>➜</span>
              </button>
            </div>

            {feedback && (
              <div
                className={
                  isCorrect === false
                    ? "r4w-answer-feedback-error"
                    : "r4w-answer-feedback"
                }
              >
                {feedback}
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