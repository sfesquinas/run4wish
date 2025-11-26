// app/registro/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, R4WUser } from "../hooks/useUser";

const avatars = [
  { id: "a1", emoji: "🏃‍♀️" },
  { id: "a2", emoji: "🏃‍♂️" },
  { id: "a3", emoji: "🎯" },
];

export default function RegistroPage() {
  const router = useRouter();
  const { user, setUser } = useUser();

  const [email, setEmail] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [country, setCountry] = useState("España");
  const [avatarId, setAvatarId] = useState("a1");
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "email">("form");

  const currentYear = new Date().getFullYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Introduce un email válido.");
      return;
    }

    const yearNum = parseInt(birthYear, 10);
    if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      setError("Introduce un año de nacimiento válido.");
      return;
    }

    const age = currentYear - yearNum;
    if (age < 18 || !adult) {
      setError("Run4Wish es solo para mayores de edad.");
      return;
    }

    // Aquí, en el futuro, enviaríamos el email con el enlace de validación.
    // De momento, simulamos el paso de "revisa tu email".
    const newUser: R4WUser = {
      email: email.trim(),
      birthYear: yearNum,
      country: country.trim() || "—",
      avatarId,
      createdAt: Date.now(),
      verified: false,
    };

    setUser(newUser);
    setStep("email");
  };

  const handleConfirmEmail = () => {
    // En la versión real esto vendría del enlace del correo
    if (!user) {
      router.push("/panel");
      return;
    }
  
    const updated: R4WUser = { ...user, verified: true };
    setUser(updated);
    router.push("/panel");
  };

  return (
    <main className="r4w-question-page">
      <section className="r4w-question-layout">
        <div className="r4w-question-card-standalone">
          {step === "form" && (
            <>
              <div className="r4w-question-status">
                Registro · Solo mayores de 18 años
              </div>
              <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
                Crea tu acceso a Run4Wish
              </h1>
              <p className="r4w-question-subtitle">
                Usaremos tu email para identificarte de forma única y tu año de
                nacimiento para asegurarnos de que eres mayor de edad.
              </p>

              <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <div className="r4w-profile-label">Email</div>
                  <input
                    type="email"
                    className="r4w-profile-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div className="r4w-profile-label">Año de nacimiento</div>
                  <input
                    type="number"
                    className="r4w-profile-input"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="Ej: 1985"
                    required
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div className="r4w-profile-label">País</div>
                  <input
                    type="text"
                    className="r4w-profile-input"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div className="r4w-profile-label">Elige tu avatar inicial</div>
                  <div className="r4w-avatars-grid">
                    {avatars.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className={
                          "r4w-avatar-card" +
                          (avatarId === a.id ? " selected" : "")
                        }
                        onClick={() => setAvatarId(a.id)}
                      >
                        {a.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    marginTop: 10,
                    color: "var(--r4w-text-muted)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={adult}
                    onChange={(e) => setAdult(e.target.checked)}
                  />
                  Confirmo que soy mayor de 18 años.
                </label>

                {error && (
                  <div className="r4w-answer-feedback-error" style={{ marginTop: 10 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="r4w-primary-btn"
                  style={{ marginTop: 14, width: "100%" }}
                >
                  Registrarme
                  <span>➜</span>
                </button>
              </form>
            </>
          )}

          {step === "email" && (
            <>
              <div className="r4w-question-status">Revisa tu email (demo)</div>
              <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
                Te hemos enviado un enlace de acceso
              </h1>
              <p className="r4w-question-subtitle">
                En la versión real deberás abrir el correo y confirmar tu
                cuenta. Aquí lo simulamos: cuando pulses el botón entenderemos
                que ya has validado tu email.
              </p>

              <button
                type="button"
                className="r4w-primary-btn"
                style={{ marginTop: 16, width: "100%" }}
                onClick={handleConfirmEmail}
              >
                Ya he validado mi email
                <span>✅</span>
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}