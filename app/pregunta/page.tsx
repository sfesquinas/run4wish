// app/pregunta/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useWishes } from "../hooks/useWishes";
import { useRaceProgress } from "../hooks/useRaceProgress";
import { useStreak } from "../hooks/useStreak";
import { useUser } from "../hooks/useUser";

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

export default function PreguntaPage() {
  const { user } = useUser() as any;

  const { wishes, subtractWishes } = useWishes(user?.id ?? null);
  const { answeredToday, markAnsweredToday } = useRaceProgress("r7", 7);
  const { registerCorrectAnswer } = useStreak();

  const [attempts, setAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [celebration, setCelebration] =
    useState<{ positions: number } | null>(null);

  // 🎉 Lanzar confeti suave cuando se muestra el overlay de respuesta correcta
  useEffect(() => {
    if (isCorrect && feedback) {
      // Pequeño delay para que el overlay aparezca primero
      const timer = setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 60,
          origin: { y: 0.5 },
          colors: ["#22c55e", "#16a34a", "#FF7A1A", "#ffffff", "#ffc065"],
          gravity: 0.8,
          ticks: 200,
          scalar: 0.8,
        });
      }, 400); // Delay para que coincida con la animación del overlay

      return () => clearTimeout(timer);
    }
  }, [isCorrect, feedback]);

  const handleSubmitAnswer = async () => {
    // si ya se respondió, no hacemos nada.
    if (hasAnswered) return;

    setIsSubmitting(true);
    try {
      // 🔸 aquí va tu lógica actual de guardar la respuesta
      // await submitAnswer(...);

      // cuando el backend confirme:
      setHasAnswered(true);
    } catch (e) {
      console.error(e);
      // si quieres, algún aviso de error aquí
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionClick = (option: Option) => {
    // Si ya respondió bien, no hacemos nada
    if (hasAnsweredCorrectly) return;

    // Si no hay wishes, no permitimos responder
    if (wishes <= 0) {
      setSelectedOption(option.id);
      setIsCorrect(false);
      setFeedback(
        "Te has quedado sin wishes para responder esta pregunta. Recarga wishes para seguir jugando."
      );
      return;
    }

    setSelectedOption(option.id);
    setAttempts((a) => a + 1);
    // 🔥 siempre consume 1 wish, aciertes o falles (y persiste en Supabase)
    subtractWishes(1);

    if (option.id === CORRECT_OPTION_ID) {
      setIsCorrect(true);
      setHasAnsweredCorrectly(true);

      // Mensaje temporal de puestos adelantados (simulado)
      const puestosAdelantados = Math.floor(Math.random() * 8) + 3; // entre 3 y 10

      // 🔥 Actualizamos la racha de días al acertar
      registerCorrectAnswer()

      // Guardamos el avance para mostrarlo en el panel personal
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "r4w_last_advance",
          JSON.stringify({
            positions: puestosAdelantados,
            ts: Date.now(),
          })
        );
      }

      // Marcamos que hoy ya has respondido en esta carrera
      markAnsweredToday();

      setCelebration({ positions: puestosAdelantados });

      setFeedback(
        `¡Respuesta correcta! 🎉 Has adelantado ${puestosAdelantados} puestos.`

      );
    } else {
      setIsCorrect(false);
      setFeedback(
        "No es correcta. Cada respuesta consume 1 wish; si te quedan, puedes volver a intentarlo."
      );
    }
  };

  //if (!isReady) {
  //return (
  //<main className="r4w-question-page">
  //<section className="r4w-question-layout">
  //<div className="r4w-question-card-standalone">
  //</div>
  //</section>
  //</main>
  //);
  //}

  // 🔒 Si ya has respondido la pregunta de hoy, mostramos mensaje y no dejamos jugar
  if (answeredToday) {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">
              Pregunta de hoy ya respondida
            </div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              Tu constancia ya está sumada 💪
            </h1>
            <p className="r4w-question-subtitle">
              Ya has respondido la pregunta de hoy en esta carrera. Vuelve
              mañana para seguir adelantando puestos.
            </p>

            <a href="/carrera/r7" className="r4w-primary-btn" style={{ marginTop: 16 }}>
              Volver a mi carrera
              <span>🏁</span>
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="r4w-question-page">
      <section className="r4w-question-layout">
        {/* Cabecera con chip de carrera y subtítulo motivador */}
        <header className="r4w-question-header-new">
          <div className="r4w-question-header-top">
            <div className="r4w-question-chip-new">
              Carrera 7 días · Día {attempts + 1}/7
            </div>
            <div className="r4w-question-wishes-badge">
              🔮 <strong>{wishes}</strong> wishes
            </div>
          </div>
          <h2 className="r4w-question-subtitle-motivator">
            Cada respuesta te acerca más a tu meta. ¡Sigue adelante! 💪
          </h2>
        </header>

        {/* Tarjeta grande para la pregunta */}
        <div className="r4w-question-card-new">
          <div className="r4w-question-card-header">
            <h1 className="r4w-question-card-title">Pregunta del día</h1>
            <div className="r4w-question-card-time">
              Ventana activa: 09:00 - 00:00
            </div>
          </div>
          
          <div className="r4w-question-card-body">
            <p className="r4w-question-card-text">{QUESTION_TEXT}</p>
          </div>
        </div>

        {/* Opciones como tarjetas grandes clicables */}
        <div className="r4w-question-options-container">
          {OPTIONS.map((opt) => {
            const isSelected = selectedOption === opt.id;
            const isCorrectOption =
              hasAnsweredCorrectly && opt.id === CORRECT_OPTION_ID;

            const classes = [
              "r4w-question-option-card",
              isSelected ? "r4w-question-option-selected" : "",
              isCorrectOption ? "r4w-question-option-correct" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={opt.id}
                type="button"
                className={classes}
                onClick={() => handleOptionClick(opt)}
                disabled={hasAnsweredCorrectly || wishes <= 0}
              >
                <div className="r4w-question-option-label">{opt.label}</div>
                <div className="r4w-question-option-text">{opt.text}</div>
              </button>
            );
          })}
        </div>

        {/* Nota sutil */}
        <div className="r4w-question-hint-new">
          Solo puedes responder una vez. Piensa… pero no demasiado 😉
        </div>

        {/* CTA para recargar wishes cuando no quedan */}
        {!hasAnsweredCorrectly && wishes <= 0 && (
          <div className="r4w-question-no-wishes">
            <p className="r4w-question-no-wishes-text">
              Te has quedado sin wishes para esta pregunta.
            </p>
            <Link href="/wishes" className="r4w-question-reload-btn">
              Recargar wishes 💸
            </Link>
          </div>
        )}

        {/* Navegación */}
        <div className="r4w-question-navigation">
          <Link href="/panel" className="r4w-question-nav-link">
            Ver mi panel 📊
          </Link>
        </div>

        {/* Overlay de feedback - Respuesta correcta o incorrecta */}
        {feedback && (isCorrect !== null) && (
          <div className="r4w-question-overlay">
            <div className="r4w-question-overlay-backdrop" />
            <div className={`r4w-question-overlay-card ${isCorrect ? 'r4w-question-overlay-success' : 'r4w-question-overlay-error'}`}>
              {isCorrect ? (
                <>
                  <div className="r4w-question-overlay-icon">🎉</div>
                  <h2 className="r4w-question-overlay-title">
                    Respuesta correcta 🎉
                  </h2>
                  <p className="r4w-question-overlay-message">
                    Has adelantado <strong>{celebration?.positions || 0}</strong> puestos
                  </p>
                  <p className="r4w-question-overlay-motivator">
                    ¡Sigue así! Cada día que respondes te acerca más a tu meta. La constancia es tu mejor aliada. 💪
                  </p>
                  <Link href="/panel" className="r4w-question-overlay-btn">
                    Ir a mi posición 📊
                  </Link>
                </>
              ) : (
                <>
                  <div className="r4w-question-overlay-icon">💪</div>
                  <h2 className="r4w-question-overlay-title">
                    Hoy no has adelantado puestos, pero sigues en carrera 💪
                  </h2>
                  <p className="r4w-question-overlay-message">
                    No te rindas. Mañana es una nueva oportunidad.
                  </p>
                  <p className="r4w-question-overlay-motivator">
                    La constancia es lo que cuenta. Vuelve mañana y sigue sumando días. Cada intento te hace más fuerte. 🚀
                  </p>
                  <Link href="/panel" className="r4w-question-overlay-btn">
                    Volver al panel
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}