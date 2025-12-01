// app/pregunta-24h/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useWishes } from "../hooks/useWishes";
import { useStreak } from "../hooks/useStreak";
import { useUser } from "../hooks/useUser";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { getQuestionMessage, formatTimeToHHMM } from "../lib/questionHelpers";
import { calculateUserAdvance } from "../lib/simulatedRunners";
import { supabase } from "../lib/supabaseClient";

type Option = {
  id: number;
  label: string;
  text: string;
};

export default function Pregunta24hPage() {
  const router = useRouter();
  const { user, isReady } = useUser() as any;

  const { wishes, setWishes } = useWishes(user?.id ?? null);
  const { registerCorrectAnswer } = useStreak();

  const {
    question: dailyQuestion,
    loading: questionLoading,
    error: questionError,
    windowState,
    windowInfo,
  } = useDailyQuestion("24h_sprint");

  // Convertir las opciones del hook a formato Option
  const options: Option[] = useMemo(() => {
    if (!dailyQuestion?.options) return [];
    return dailyQuestion.options.map((opt, index) => ({
      id: index,
      label: String.fromCharCode(65 + index), // A, B, C
      text: opt,
    }));
  }, [dailyQuestion?.options]);

  // Determinar la opción correcta
  const correctOptionId = useMemo(() => {
    if (!dailyQuestion?.correctOption) return null;
    const correctIndex = dailyQuestion.options.findIndex(
      (opt) => opt === dailyQuestion.correctOption
    );
    return correctIndex >= 0 ? correctIndex : null;
  }, [dailyQuestion?.correctOption, dailyQuestion?.options]);

  const questionText = dailyQuestion?.question || "";

  const [attempts, setAttempts] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAnsweredCorrectly, setHasAnsweredCorrectly] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [celebration, setCelebration] =
    useState<{ positions: number; nextDayWindow?: { start: string; end: string } | null } | null>(null);
  const [showMotivationalModal, setShowMotivationalModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verificar si el usuario ya ha respondido correctamente esta pregunta
  useEffect(() => {
    let isMounted = true;
    if (celebration) return; // No verificar si ya está mostrando el modal de celebración

    if (!user?.id || !dailyQuestion?.scheduleId || checkingAnswer || hasAnsweredCorrectly) return;

    const checkExistingAnswer = async () => {
      if (!isMounted) return;
      setCheckingAnswer(true);
      setErrorMsg(null);

      try {
        const { data: existingAnswer, error } = await supabase
          .from("r4w_answers")
          .select("id, is_correct, created_at")
          .eq("user_id", user.id)
          .eq("schedule_id", dailyQuestion.scheduleId)
          .eq("is_correct", true)
          .maybeSingle();

        if (!isMounted) return;

        if (error && error.code !== "PGRST116") {
          console.warn("Error verificando respuesta existente:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          setHasAnsweredCorrectly(false);
          setErrorMsg("Error al verificar tu respuesta. Intenta recargar.");
          return;
        }

        if (existingAnswer) {
          console.log("✅ Usuario ya ha respondido correctamente esta pregunta");
          setHasAnsweredCorrectly(true);
        } else {
          setHasAnsweredCorrectly(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Error en checkExistingAnswer:", {
          message: err?.message || String(err),
          error: err,
        });
        setHasAnsweredCorrectly(false);
        setErrorMsg("Error inesperado al verificar respuesta.");
      } finally {
        if (isMounted) {
          setCheckingAnswer(false);
        }
      }
    };

    checkExistingAnswer();

    return () => {
      isMounted = false;
    };
  }, [user?.id, dailyQuestion?.scheduleId, hasAnsweredCorrectly, checkingAnswer, celebration]);

  const handleOptionClick = async (option: Option) => {
    if (hasAnsweredCorrectly || isProcessing || wishes <= 0 || !!celebration) return;

    setIsProcessing(true);
    setSelectedOption(option.id);
    setAttempts((a) => a + 1);
    setWishes((w) => w - 1);
    setErrorMsg(null);

    try {
      if (option.id === correctOptionId) {
        // Respuesta correcta
        setIsCorrect(true);
        setHasAnsweredCorrectly(true);

        // Confeti
        confetti({
          particleCount: 160,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#FF7A1A", "#ffffff", "#ffc065"],
        });

        // Guardar respuesta en r4w_answers
        if (user?.id && dailyQuestion?.scheduleId) {
          const { error: answerError } = await supabase
            .from("r4w_answers")
            .insert({
              user_id: user.id,
              schedule_id: dailyQuestion.scheduleId,
              selected_option: option.label,
              is_correct: true,
            });

          if (answerError) {
            console.error("Error guardando respuesta:", answerError);
            setErrorMsg("Error al guardar tu respuesta. Inténtalo de nuevo.");
          }
        }

        // Actualizar racha
        await registerCorrectAnswer();

        // Calcular avance (simulado)
        const positions = await calculateUserAdvance(true, 1);

        // Guardar avance
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "r4w_last_advance",
            JSON.stringify({
              positions: positions,
              ts: Date.now(),
            })
          );
        }

        setCelebration({
          positions: positions,
          nextDayWindow: windowInfo ? {
            start: formatTimeToHHMM(windowInfo.start),
            end: formatTimeToHHMM(windowInfo.end),
          } : null,
        });

        setFeedback(`¡Respuesta correcta! 🎉 Has adelantado ${positions} puestos.`);
      } else {
        // Respuesta incorrecta
        setIsCorrect(false);
        setShowMotivationalModal(true);
      }
    } catch (error: any) {
      console.error("Error al procesar la respuesta:", error);
      setErrorMsg(error.message || "Ha ocurrido un error al procesar tu respuesta. Inténtalo de nuevo.");
      setIsCorrect(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseMotivationalModal = () => {
    setShowMotivationalModal(false);
    setSelectedOption(null);
    setFeedback(null);
    setErrorMsg(null);
  };

  // Guard: si no hay usuario cuando ya hemos cargado, redirigir
  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user]);

  // 🔒 Si ya has respondido la pregunta de hoy
  if (hasAnsweredCorrectly && !checkingAnswer && !celebration) {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">
              Pregunta de este tramo ya respondida
            </div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              Tu constancia ya está sumada 💪
            </h1>
            <p className="r4w-question-subtitle">
              Ya has respondido correctamente la pregunta de este tramo. El siguiente tramo estará disponible en la próxima hora. ✨
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

  // Guard: si no hay usuario, mostrar nada mientras redirige
  if (isReady && !user) {
    return null;
  }

  // Log para depuración
  console.log("🧩 pregunta-24h state", {
    questionLoading,
    windowState,
    error: questionError,
    hasQuestion: !!dailyQuestion,
    questionText: dailyQuestion?.question,
  });

  // Estados de carga - SOLO cuando loading es true
  if (questionLoading || checkingAnswer) {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Cargando pregunta...</div>
            <h1 className="r4w-question-title">Preparando tu pregunta</h1>
            <p className="r4w-question-subtitle">Un momento, por favor...</p>
          </div>
        </section>
      </main>
    );
  }

  // Manejo explícito de estados de error cuando NO está cargando
  if (!questionLoading) {
    // Error: no hay schedule
    if (windowState === null && questionError === "no_schedule") {
      return (
        <main className="r4w-question-page">
          <section className="r4w-question-layout">
            <div className="r4w-question-card-standalone">
              <div className="r4w-question-status">Sin pregunta disponible</div>
              <h1 className="r4w-question-title">Sin pregunta disponible</h1>
              <p className="r4w-question-subtitle">
                Hoy no hay pregunta programada para este tramo horario.
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

    // Error: error de carga o error de pregunta
    if ((windowState === null && questionError === "error_carga") || questionError === "error_carga") {
      return (
        <main className="r4w-question-page">
          <section className="r4w-question-layout">
            <div className="r4w-question-card-standalone">
              <div className="r4w-question-status">Error cargando tu pregunta</div>
              <h1 className="r4w-question-title">Error cargando tu pregunta</h1>
              <p className="r4w-question-subtitle">
                Ha habido un problema al preparar tu pregunta. Inténtalo de nuevo más tarde.
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
  }

  if (questionError === "before_window" || windowState === "before") {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Ventana aún no abierta</div>
            <h1 className="r4w-question-title">La ventana aún no está abierta</h1>
            <p className="r4w-question-subtitle">
              {windowInfo
                ? `La ventana se abrirá entre ${formatTimeToHHMM(windowInfo.start)} y ${formatTimeToHHMM(windowInfo.end)}.`
                : "La ventana de este tramo aún no está disponible."}
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

  if (questionError === "after_window" || windowState === "after") {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Ventana cerrada</div>
            <h1 className="r4w-question-title">La ventana de hoy ya ha cerrado</h1>
            <p className="r4w-question-subtitle">
              La ventana de hoy para esta carrera 24h ya ha finalizado. Mañana tendrás una nueva oportunidad en esta carrera 24h.
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

  // Guardia: verificar que tenemos pregunta válida antes de renderizar
  if (!questionLoading && (!dailyQuestion || !dailyQuestion.question || windowState !== "active")) {
    console.warn("⚠️ pregunta-24h: estado incoherente, mostrando mensaje genérico", {
      windowState,
      error: questionError,
      dailyQuestion,
      hasQuestionText: !!dailyQuestion?.question,
    });
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Sin pregunta disponible</div>
            <h1 className="r4w-question-title">No hay pregunta disponible</h1>
            <p className="r4w-question-subtitle">
              No hemos podido mostrar tu pregunta en este momento.
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
        {/* Cabecera */}
        <header className="r4w-question-header">
          <div>
            <div className="r4w-question-label">Carrera 24h · Pregunta del tramo actual</div>
            <h1 className="r4w-question-title">
              Suma constancia respondiendo a la pregunta de este tramo
            </h1>
            <p className="r4w-question-subtitle">
              Cada vez que respondes consumes 1 wish, aciertes o falles. Cuando
              te quedes sin wishes, tendrás que recargar.
            </p>
          </div>

          <div className="r4w-panel-chip">
            🔮 Wishes disponibles: <strong>{wishes}</strong>
          </div>
        </header>

        {/* Card de pregunta */}
        <div className="r4w-question-card-standalone">
          <div className="r4w-question-status">
            {windowInfo
              ? `Ventana activa de ${formatTimeToHHMM(windowInfo.start)} a ${formatTimeToHHMM(windowInfo.end)} (hora local)`
              : "Ventana activa"}
          </div>

          <div className="r4w-question-main-text">{questionText}</div>

          {/* Opciones */}
          <div className="r4w-options-grid">
            {options.map((opt) => {
              const isSelected = opt.id === selectedOption;
              const isCorrectOption = hasAnsweredCorrectly && opt.id === correctOptionId;
              const isLocked = hasAnsweredCorrectly || wishes <= 0 || isProcessing || !!celebration;

              const classes = [
                "r4w-option-card",
                isSelected ? "selected" : "",
                isCorrectOption ? "correct" : "",
                isLocked ? "locked" : "",
                isProcessing ? "processing" : "",
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
                  <span className="r4w-option-letter">{opt.label}</span>
                  <span className="r4w-option-text">
                    {isProcessing && isSelected ? "Procesando..." : opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mensaje de error si hay */}
          {errorMsg && (
            <div className="r4w-auth-error" style={{ marginTop: 16, textAlign: "center" }}>
              {errorMsg}
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
                Te has quedado sin wishes para esta pregunta. En la demo puedes
                recargarlos manualmente.
              </span>
              <Link href="/wishes" className="r4w-secondary-btn">
                Recargar wishes
                <span>💸</span>
              </Link>
            </div>
          )}

          {/* Info wishes */}
          <div className="r4w-question-timer" style={{ marginTop: 10 }}>
            Cada respuesta consume <strong>1 wish</strong>, aciertes o falles.{" "}
            <br />
            Si te quedas sin wishes, tendrás que recargar para seguir
            respondiendo.
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
            <Link href="/panel" className="r4w-secondary-btn">
              Ver mi panel
              <span>📊</span>
            </Link>
          </div>
        </div>

        {/* Modal de celebración cuando acierta */}
        {celebration && (
          <div
            className="r4w-cele-overlay"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="r4w-cele-card"
              onClick={(e) => { e.stopPropagation(); }}
              onMouseDown={(e) => { e.stopPropagation(); }}
            >
              <div className="r4w-cele-title">¡Lo has hecho! 🎉</div>
              <div className="r4w-cele-text">
                Tu respuesta ha sido correcta y has adelantado{" "}
                <strong>{celebration.positions}</strong> puestos en la carrera.
              </div>

              {celebration.nextDayWindow && (
                <div className="r4w-cele-next-day-hint">
                  Próximo tramo: tu pregunta saldrá entre{" "}
                  <strong>{celebration.nextDayWindow.start}</strong> y{" "}
                  <strong>{celebration.nextDayWindow.end}</strong> ✨
                </div>
              )}

              <div className="r4w-cele-actions">
                <button
                  type="button"
                  className="r4w-primary-btn r4w-cele-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCelebration(null);
                    router.push("/panel");
                  }}
                >
                  Volver a mi panel
                  <span>📊</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal motivador cuando no acierta */}
        {showMotivationalModal && (
          <div
            className="r4w-cele-overlay"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="r4w-cele-card"
              onClick={(e) => { e.stopPropagation(); }}
              onMouseDown={(e) => { e.stopPropagation(); }}
            >
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

