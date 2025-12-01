// app/pregunta/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useWishes } from "../hooks/useWishes";
import { useRaceProgress } from "../hooks/useRaceProgress";
import { useStreak } from "../hooks/useStreak";
import { useUser } from "../hooks/useUser";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { getQuestionMessage, formatTimeToHHMM } from "../lib/questionHelpers";
import { calculateUserAdvance } from "../lib/simulatedRunners";
import { updateNextDaySchedule } from "../lib/userSchedule";

type Option = {
  id: number;
  label: string;
  text: string;
};

// Fallback para cuando no hay pregunta disponible
const FALLBACK_QUESTION_TEXT =
  "Si quieres mejorar tu constancia en Run4Wish, ¿qué es lo más importante?";

const FALLBACK_OPTIONS: Option[] = [
  { id: 0, label: "A", text: "Responder solo cuando te apetezca" },
  { id: 1, label: "B", text: "Entrar cada día aunque sea 1 minuto" },
  { id: 2, label: "C", text: "Esperar al último día para responder todo" },
];

const FALLBACK_CORRECT_OPTION_ID = 1;

export default function PreguntaPage() {
  const router = useRouter();
  const { user } = useUser() as any;

  const { wishes, setWishes } = useWishes(user?.id ?? null);
  const { answeredToday, markAnsweredToday } = useRaceProgress("r7", 7);
  const { registerCorrectAnswer } = useStreak();
  
  // Obtener la pregunta del día desde Supabase
  const { 
    question: dailyQuestion, 
    loading: questionLoading, 
    error: questionError,
    windowState,
    windowInfo 
  } = useDailyQuestion("7d_mvp");

  // Convertir las opciones de Supabase al formato que usa la UI
  const options: Option[] = useMemo(() => {
    if (dailyQuestion && dailyQuestion.options.length > 0) {
      return dailyQuestion.options.map((opt, index) => ({
        id: index,
        label: String.fromCharCode(65 + index), // A, B, C, D...
        text: opt,
      }));
    }
    return FALLBACK_OPTIONS;
  }, [dailyQuestion]);

  // Determinar cuál es la opción correcta
  const correctOptionId = useMemo(() => {
    if (dailyQuestion) {
      // Buscar el índice de la opción correcta en el array
      const correctIndex = dailyQuestion.options.findIndex(
        (opt) => opt === dailyQuestion.correctOption
      );
      return correctIndex >= 0 ? correctIndex : FALLBACK_CORRECT_OPTION_ID;
    }
    return FALLBACK_CORRECT_OPTION_ID;
  }, [dailyQuestion]);

  // Texto de la pregunta
  const questionText = dailyQuestion?.question || FALLBACK_QUESTION_TEXT;
  
  // Ventana horaria
  const windowText = dailyQuestion
    ? `${formatTimeToHHMM(dailyQuestion.windowStart)} - ${formatTimeToHHMM(dailyQuestion.windowEnd)}`
    : "09:00 - 00:00";

  const [attempts, setAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [celebration, setCelebration] =
    useState<{ positions: number; nextDayWindow?: { start: string; end: string } | null } | null>(null);

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

  const [showMotivationalModal, setShowMotivationalModal] = useState(false);

  const handleOptionClick = async (option: Option) => {
    // Si ya respondió bien, no hacemos nada
    if (hasAnsweredCorrectly) return;

    // Si no hay wishes, no permitimos responder
    if (wishes <= 0) {
      return;
    }

    setSelectedOption(option.id);
    setAttempts((a) => a + 1);
    setWishes((w) => w - 1); // 🔥 siempre consume 1 wish, aciertes o falles

    if (option.id === correctOptionId) {
      setIsCorrect(true);
      setHasAnsweredCorrectly(true);

      // 🎉 Confeti al acertar
      confetti({
        particleCount: 160,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FF7A1A", "#ffffff", "#ffc065"],
      });

      // 🔥 Actualizamos la racha de días al acertar
      registerCorrectAnswer();

      // Calcular puestos adelantados basado en runners simulados
      const currentDay = dailyQuestion?.dayNumber || 1;
      const puestosAdelantados = await calculateUserAdvance(true, currentDay);

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

      // Generar y guardar ventana horaria para el día siguiente
      let nextDayWindowInfo: { start: string; end: string } | null = null;
      if (user?.id && currentDay < 7) {
        try {
          const nextWindow = await updateNextDaySchedule(user.id, currentDay);
          if (nextWindow) {
            nextDayWindowInfo = {
              start: formatTimeToHHMM(nextWindow.windowStart),
              end: formatTimeToHHMM(nextWindow.windowEnd),
            };
          }
        } catch (err) {
          console.error("Error generando ventana del día siguiente:", err);
          // No bloqueamos si falla, simplemente no mostramos la pista
        }
      }

      setCelebration({ 
        positions: puestosAdelantados,
        nextDayWindow: nextDayWindowInfo 
      });
    } else {
      // Respuesta incorrecta: mostrar modal motivador
      setIsCorrect(false);
      setShowMotivationalModal(true);
    }
  };

  const handleCloseMotivationalModal = () => {
    setShowMotivationalModal(false);
    setSelectedOption(null); // Resetear selección para permitir volver a intentar
    setFeedback(null);
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

  // 🔒 Estados de error de la pregunta
  if (questionLoading) {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Cargando pregunta...</div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              Preparando tu pregunta del día
            </h1>
            <p className="r4w-question-subtitle">
              Un momento, estamos cargando la pregunta de hoy...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (questionError === "no_schedule") {
    // Durante la primera semana (días 1-7), no mostrar este mensaje
    // El hook useDailyQuestion ya debería haber intentado crear el schedule
    // Si llegamos aquí, mostrar un mensaje de carga o reintentar
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Preparando tu pregunta...</div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              Estamos preparando tu pregunta del día
            </h1>
            <p className="r4w-question-subtitle" style={{ marginTop: 8 }}>
              Por favor, espera un momento mientras cargamos tu pregunta.
            </p>
            <Link href="/panel" className="r4w-primary-btn" style={{ marginTop: 16 }}>
              Volver a mi panel
              <span>📊</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (questionError === "before_window") {
    const message = getQuestionMessage("before_window", windowInfo || undefined);
    
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">⏱ Ventana aún no abierta</div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              {message}
            </h1>
            <p className="r4w-question-subtitle" style={{ marginTop: 8 }}>
              La pregunta estará disponible en ese horario. Vuelve entonces para responder.
            </p>
            <Link href="/panel" className="r4w-primary-btn" style={{ marginTop: 16 }}>
              Volver a mi panel
              <span>📊</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (questionError === "after_window") {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">⏱ Ventana cerrada</div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              {getQuestionMessage("after_window")}
            </h1>
            <p className="r4w-question-subtitle" style={{ marginTop: 8 }}>
              La ventana horaria de hoy ya ha finalizado. Mañana tendrás una nueva oportunidad.
            </p>
            <Link href="/panel" className="r4w-primary-btn" style={{ marginTop: 16 }}>
              Volver a mi panel
              <span>📊</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (questionError === "error_carga") {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Error al cargar</div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              {getQuestionMessage("error_carga")}
            </h1>
            <p className="r4w-question-subtitle" style={{ marginTop: 8 }}>
              Por favor, intenta recargar la página o vuelve más tarde.
            </p>
            <Link href="/panel" className="r4w-primary-btn" style={{ marginTop: 16 }}>
              Volver a mi panel
              <span>📊</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="r4w-question-page">
      <section className="r4w-question-layout">
        {/* Card de pregunta con borde naranja */}
        <div className="r4w-question-card-main">
          {/* Header de la tarjeta */}
          <div className="r4w-question-card-header">
            <div className="r4w-question-card-label">Pregunta del día</div>
            <div className="r4w-question-card-window">
              VENTANA ACTIVA: {windowText}
            </div>
          </div>

          {/* Pregunta centrada */}
          <div className="r4w-question-card-question">{questionText}</div>

          {/* Opciones con cuadrados naranjas */}
          <div className="r4w-options-grid-new">
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectOption =
                hasAnsweredCorrectly && opt.id === correctOptionId;
              const isLocked = hasAnsweredCorrectly || wishes <= 0;

              const classes = [
                "r4w-option-card-new",
                isSelected ? "selected" : "",
                isCorrectOption ? "correct" : "",
                isLocked ? "locked" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={opt.id}
                  type="button"
                  className={classes}
                  onClick={() => handleOptionClick(opt)}
                  disabled={isLocked}
                >
                  <span className="r4w-option-letter-new">{opt.label}</span>
                  <span className="r4w-option-text-new">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Texto informativo */}
          <div className="r4w-question-card-hint">
            Cada respuesta consume un wish
          </div>

          {/* CTA para comprar wishes cuando no quedan */}
          {!hasAnsweredCorrectly && wishes <= 0 && (
            <div className="r4w-question-buy-wishes">
              <p className="r4w-question-buy-text">
                Te has quedado sin wishes para responder esta pregunta.
              </p>
              <Link href="/wishes" className="r4w-primary-btn r4w-question-buy-btn">
                Ir a comprar wishes
                <span>💸</span>
              </Link>
            </div>
          )}
        </div>

        {/* Modal de celebración cuando acierta */}
        {celebration && (
          <div className="r4w-cele-overlay">
            <div className="r4w-cele-card">
              <div className="r4w-cele-title">¡Lo has hecho! 🎉</div>
              <div className="r4w-cele-text">
                Tu respuesta ha sido correcta y has adelantado{" "}
                <strong>{celebration.positions}</strong> puestos en la carrera.
              </div>
              
              {/* Pista para mañana */}
              {celebration.nextDayWindow && (
                <div className="r4w-cele-next-day-hint">
                  Pista para mañana: tu pregunta saldrá entre{" "}
                  <strong>{celebration.nextDayWindow.start}</strong> y{" "}
                  <strong>{celebration.nextDayWindow.end}</strong> ✨
                </div>
              )}

              <div className="r4w-cele-actions">
                <button
                  type="button"
                  className="r4w-primary-btn r4w-cele-action-btn"
                  onClick={() => {
                    setCelebration(null);
                    router.push("/ranking");
                  }}
                >
                  Ver mi ranking
                  <span>📈</span>
                </button>
                <button
                  type="button"
                  className="r4w-secondary-btn r4w-cele-action-btn"
                  onClick={() => {
                    setCelebration(null);
                    router.push("/panel");
                  }}
                >
                  Ver mi panel
                  <span>📊</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal motivador cuando no acierta */}
        {showMotivationalModal && (
          <div className="r4w-cele-overlay">
            <div className="r4w-cele-card">
              <div className="r4w-cele-title">¡Sigue intentando! 💪</div>
              <div className="r4w-cele-text">
                No te preocupes, cada intento te acerca más a la respuesta correcta. 
                La constancia es la clave en Run4Wish.
              </div>
              <button
                type="button"
                className="r4w-primary-btn"
                style={{ marginTop: 16, width: "100%" }}
                onClick={handleCloseMotivationalModal}
              >
                Volver a intentar
                <span>🔄</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}