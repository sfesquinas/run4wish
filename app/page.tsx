// app/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  "España",
  "México",
  "Argentina",
  "Colombia",
  "Chile",
  "Perú",
  "Otro",
];

const AVATARS = [
  { id: "runner", label: "Runner", emoji: "🏃‍♀️" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "dreamer", label: "Dreamer", emoji: "💫" },
];

export default function Home() {
  const router = useRouter();   // <--- añade esto
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("España");
  const [avatar, setAvatar] = useState("runner");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 👉 Aquí luego conectaremos con la API / backend
    console.log({
      email,
      year,
      country,
      avatar,
    });

    // De momento, simulamos éxito y navegamos a /carreras
    router.push("/carreras");
  };

  return (
    <main className="r4w-page">
      <section className="r4w-card">
        {/* LOGO + NOMBRE */}
        <div className="r4w-logo-row">
          <div className="r4w-logo-mark">
            {/* Si prefieres, aquí podemos usar el SVG que subas a /public */}
            <span>R4W</span>
          </div>
          <div className="r4w-logo-text">Run4Wish</div>
        </div>

        {/* CLAIM */}
        <div className="r4w-badge">
          <span>nuevo reto</span>
          <span>·</span>
          <span>constancia &gt; suerte</span>
        </div>

        <h1 className="r4w-title">Corre por tus sueños</h1>
        <p className="r4w-subtitle">
          Esta app no va de suerte, va de constancia. Crea tu perfil y
          prepárate: cada respuesta diaria te acerca a tu próximo deseo.
        </p>

        {/* FORMULARIO */}
        <form className="r4w-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="r4w-field">
            <div className="r4w-label-row">
              <label htmlFor="email" className="r4w-label">
                Correo electrónico
              </label>
              <span className="r4w-label-hint">
                Solo lo usaremos para validar tu cuenta.
              </span>
            </div>
            <input
              id="email"
              type="email"
              required
              placeholder="tucorreo@email.com"
              className="r4w-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Año de nacimiento */}
          <div className="r4w-field">
            <div className="r4w-label-row">
              <label htmlFor="year" className="r4w-label">
                Año de nacimiento
              </label>
              <span className="r4w-label-hint">Mayores de 18 años.</span>
            </div>
            <input
              id="year"
              type="number"
              required
              placeholder="1985"
              min={1900}
              max={new Date().getFullYear()}
              className="r4w-input"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          {/* País */}
          <div className="r4w-field">
            <div className="r4w-label-row">
              <label htmlFor="country" className="r4w-label">
                País
              </label>
            </div>
            <select
              id="country"
              className="r4w-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Avatares */}
          <div className="r4w-field">
            <div className="r4w-label-row">
              <span className="r4w-label">Elige tu avatar inicial</span>
              <span className="r4w-label-hint">
                Podrás desbloquear más según tu constancia.
              </span>
            </div>

            <div className="r4w-avatar-grid">
              {AVATARS.map((a) => (
                <label
                  key={a.id}
                  className="r4w-avatar-option"
                  htmlFor={`avatar-${a.id}`}
                >
                  <input
                    id={`avatar-${a.id}`}
                    type="radio"
                    name="avatar"
                    value={a.id}
                    className="r4w-avatar-radio"
                    checked={avatar === a.id}
                    onChange={() => setAvatar(a.id)}
                  />
                  <div className="r4w-avatar-tile">
                    <div className="r4w-avatar-emoji">{a.emoji}</div>
                    <div className="r4w-avatar-name">{a.label}</div>
                  </div>
                </label>
              ))}

              {/* Ejemplo de avatar bloqueado */}
              <div className="r4w-avatar-option r4w-avatar-locked">
                <div className="r4w-avatar-tile">
                  <div className="r4w-avatar-emoji">🔒</div>
                  <div className="r4w-avatar-name">Se desbloquea al 1º logro</div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTÓN CTA */}
          <button type="submit" className="r4w-primary-btn" disabled={loading}>
            <span>{loading ? "Creando tu perfil..." : "Entrar a Run4Wish"}</span>
            <span>➜</span>
          </button>
        </form>

        <p className="r4w-footnote">
          Al continuar, aceptas participar en carreras digitales donde la
          constancia es la clave. Más adelante podrás revisar nuestras{" "}
          <a href="#">condiciones</a> y <a href="#">política de privacidad</a>.
        </p>
      </section>
    </main>
  );
}