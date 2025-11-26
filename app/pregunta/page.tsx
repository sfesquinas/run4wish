// app/pregunta/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useWishes } from "../hooks/useWishes";

type Option = {
  id: number;
  label: string;
  text: string;
};

const QUESTION_TEXT =
  "Si quieres mejorar tu constancia en Run4Wish, ¿qué es lo más importante?";

const OPTIONS: Option[] = [
  { id: 0, label: "A", text: "Responder solo cuando te apetezca" },
  { id: 1, label: "B", text: "Entrar cada día aunque sea 1 minuto" },
  { id: 2, label: "C", text: "Esperar al último día para responder todo" },
];

const CORRECT_OPTION_ID = 1;

// Wishes iniciales del día
const INITIAL_WISHES = 2; // solo referencia visual, el valor real viene del hook

export default function PreguntaPage() {
  const { wishes, setWishes, isReady } = useWishes();
  const [attempts, setAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);

  const handleOptionClick = (option: Option) => {
    // Si ya respondió bien, no hacemos nada
    if (hasAnsweredCorrectly) return;

    setSelectedOption(option.id);

    // PRIMER INTENTO: no gasta wishes
    if (attempts === 0) {
      setAttempts(1);

      if (option.id === CORRECT_OPTION_ID) {
        setIsCorrect(true);
        setHasAnsweredCorrectly(true);
        setFeedback(
          "¡Respuesta correcta! Has sumado constancia en la carrera de hoy."
        );
      } else {
        setIsCorrect(false);
        setFeedback(
          "No es correcta. Puedes volver a intentarlo gastando 1 wish."
        );
      }
      if (!isReady) {
        return (
          <main className="r4w-question-page">
            <section className="r4w-question-layout">
              <div className="r4w-question-card-standalone">
                <div className="r4w-question-status">Cargando wishes...</div>
              </div>
            </section>
          </main>
        );
      }
      return;
    }

    // A PARTIR DEL SEGUNDO INTENTO: gasta 1 wish por intento
    if (wishes <= 0) {
      setIsCorrect(false);
      setFeedback(
        "Te has quedado sin wishes para esta pregunta. En la versión completa podrás comprar más."
      );
      return;
    }

    setAttempts((a) => a + 1);
    setWishes((w) => w - 1);

    if (option.id === CORRECT_OPTION_ID) {
      setIsCorrect(true);
      setHasAnsweredCorrectly(true);
      setFeedback(
        "¡Correcto! Has usado un wish extra, pero sigues en la carrera."
      );
    } else {
      setIsCorrect(false);
      setFeedback(
        "Sigue sin ser correcta. Mientras te queden wishes, puedes volver a intentarlo."
      );
    }
  };

  const canRetry = !hasAnsweredCorrectly && wishes > 0;

  return (
    <main className="r4w-question-page">
      <section className="r4w-question-layout">
        {/* Cabecera */}
        <header className="r4w-question-header">
          <div>
            <div className="r4w-question-label">Pregunta del día · demo</div>
            <h1 className="r4w-question-title">
              Suma constancia respondiendo a la pregunta de hoy
            </h1>
            <p className="r4w-question-subtitle">
              Recuerda: el primer intento del día no gasta wishes. Cada intento
              extra consumirá 1 wish.
            </p>
          </div>

          <div className="r4w-panel-chip">
            Wishes disponibles: {wishes}
          </div>
        </header>

        {/* Card de pregunta */}
        <div className="r4w-question-card-standalone">
          <div className="r4w-question-status">
            Ventana activa de 09:00 a 00:00 (hora local)
          </div>

          <div className="r4w-question-main-text">{QUESTION_TEXT}</div>

          {/* Opciones */}
          <div className="r4w-options-grid">
            {OPTIONS.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectOption =
                hasAnsweredCorrectly && opt.id === CORRECT_OPTION_ID;

              const classes = [
                "r4w-option-card",
                isSelected ? "selected" : "",
                isCorrectOption ? "correct" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={opt.id}
                  type="button"
                  className={classes}
                  onClick={() => handleOptionClick(opt)}
                  disabled={
                    hasAnsweredCorrectly ||
                    (!canRetry && attempts > 0 && opt.id !== selectedOption)
                  }
                >
                  <span className="r4w-option-letter">{opt.label}</span>
                  <span className="r4w-option-text">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={
                isCorrect ? "r4w-answer-feedback" : "r4w-answer-feedback-error"
              }
            >
              {feedback}
            </div>
          )}

          {/* CTA para recargar wishes cuando no quedan */}
          {!hasAnsweredCorrectly && wishes <= 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--r4w-text-muted)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>
                Te has quedado sin wishes para esta pregunta. En la versión demo
                puedes recargarlos manualmente.
              </span>
              <Link href="/wishes" className="r4w-secondary-btn">
                Recargar wishes
                <span>💸</span>
              </Link>
            </div>
          )}

          {/* Info wishes */}
          <div className="r4w-question-timer" style={{ marginTop: 10 }}>
            Primer intento del día: <strong>0 wishes</strong>. <br />
            Cada intento extra: <strong>−1 wish</strong> (cuando haya sistema de
            compra podrás recargar).
          </div>

          {/* Navegación */}
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
        </div>
      </section>
    </main>
  );
}