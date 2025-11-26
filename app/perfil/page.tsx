// app/perfil/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";

const initialAvatars = [
  { id: "a1", emoji: "🏃‍♀️", unlocked: true },
  { id: "a2", emoji: "🏃‍♂️", unlocked: true },
  { id: "a3", emoji: "🎯", unlocked: true },
  { id: "a4", emoji: "💫", unlocked: false },
  { id: "a5", emoji: "🔥", unlocked: false },
  { id: "a6", emoji: "🚀", unlocked: false },
  { id: "a7", emoji: "🏆", unlocked: false },
  { id: "a8", emoji: "🌍", unlocked: false },
];

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout, isReady } = useUser();

  const [username, setUsername] = useState("Runner_You");
  const [country, setCountry] = useState("España");
  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");

  // cuando haya usuario, usamos su país como valor inicial
  useEffect(() => {
    if (user?.country) {
      setCountry(user.country);
    }
  }, [user]);

  const handleShare = () => {
    // En el futuro aquí conectaremos el link real + wishes
    alert(
      "En la versión final podrás compartir tu link de invitación y ganar wishes cuando tus amigos se unan."
    );
  };

  if (!isReady) {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Cargando perfil...</div>
          </div>
        </section>
      </main>
    );
  }

  // si no hay usuario registrado, invitamos a registro
  if (!user) {
    return (
      <main className="r4w-question-page">
        <section className="r4w-question-layout">
          <div className="r4w-question-card-standalone">
            <div className="r4w-question-status">Perfil no disponible</div>
            <h1 className="r4w-question-title" style={{ marginBottom: 8 }}>
              Aún no te has registrado
            </h1>
            <p className="r4w-question-subtitle">
              Para poder guardar tu progreso real en Run4Wish, necesitamos que
              te registres con tu email y confirmes que eres mayor de edad.
            </p>

            <Link
              href="/registro"
              className="r4w-primary-btn"
              style={{ marginTop: 16, display: "inline-flex" }}
            >
              Ir a registro
              <span>➜</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const age = new Date().getFullYear() - user.birthYear;

  return (
    <main className="r4w-profile-page">
      <section className="r4w-profile-layout">
        {/* COLUMNA IZQUIERDA: info cuenta + ajustes */}
        <div>
          <h1 className="r4w-profile-main-title">Tu perfil Run4Wish</h1>
          <p className="r4w-profile-subtitle">
            Aquí verás tus datos de cuenta y podrás ajustar tu experiencia:
            nombre, país, sonido y avatar con el que compites.
          </p>

          {/* Info de cuenta (usuario registrado) */}
          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <div className="r4w-profile-row">
              <span className="r4w-profile-label">Email</span>
              <span className="r4w-profile-value">{user.email}</span>
            </div>
            <div className="r4w-profile-row">
              <span className="r4w-profile-label">Edad aprox.</span>
              <span className="r4w-profile-value">{age} años</span>
            </div>
            <div className="r4w-profile-row">
              <span className="r4w-profile-label">País (cuenta)</span>
              <span className="r4w-profile-value">{user.country}</span>
            </div>
            <div className="r4w-profile-row">
              <span className="r4w-profile-label">Estado de cuenta</span>
              <span className="r4w-profile-value">
                {user.verified ? "Verificada ✅" : "Pendiente de verificar ✉️"}
              </span>
            </div>
          </div>

          {/* Ajustes de juego */}
          <div className="r4w-profile-form">
            {/* Nombre usuario */}
            <div>
              <div className="r4w-profile-label">Nombre de usuario (juego)</div>
              <input
                className="r4w-profile-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* País visual para carreras (puede diferir del de cuenta si quieres) */}
            <div>
              <div className="r4w-profile-label">País (visible en carreras)</div>
              <input
                className="r4w-profile-input"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            {/* Toggles */}
            <div className="r4w-toggle-row">
              <div className="r4w-toggle-label">
                <span>Sonido</span>
                <span>Activar efectos cuando respondes o subes de posición.</span>
              </div>
              <button
                type="button"
                className={`r4w-switch ${soundOn ? "on" : ""}`}
                onClick={() => setSoundOn((v) => !v)}
              >
                <div className="r4w-switch-knob" />
              </button>
            </div>

            <div className="r4w-toggle-row">
              <div className="r4w-toggle-label">
                <span>Vibración</span>
                <span>Notificaciones sutiles cuando se abre la pregunta.</span>
              </div>
              <button
                type="button"
                className={`r4w-switch ${vibrationOn ? "on" : ""}`}
                onClick={() => setVibrationOn((v) => !v)}
              >
                <div className="r4w-switch-knob" />
              </button>
            </div>

            {/* Avatares */}
            <div>
              <div className="r4w-profile-label" style={{ marginBottom: 6 }}>
                Avatar para las carreras
              </div>
              <div className="r4w-avatars-grid">
                {initialAvatars.map((avatar) => {
                  const isSelected = avatar.id === selectedAvatar;
                  const classes = [
                    "r4w-avatar-card",
                    avatar.unlocked ? "" : "locked",
                    isSelected ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      className={classes}
                      disabled={!avatar.unlocked}
                      onClick={() =>
                        avatar.unlocked && setSelectedAvatar(avatar.id)
                      }
                    >
                      {avatar.emoji}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--r4w-text-muted)",
                }}
              >
                Tienes 3 avatares desbloqueados. El resto se irán desbloqueando
                según tu constancia y logros en las carreras.
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: compartir + navegación + logout */}
        <aside>
          <h2 className="r4w-profile-side-title">
            Comparte Run4Wish con tus amigos
          </h2>
          <p className="r4w-profile-side-text">
            En las próximas versiones, cuando invites a alguien y se registre
            usando tu link, ganarás wishes extra para usarlos en tus carreras.
          </p>

          <button
            type="button"
            className="r4w-primary-btn"
            onClick={handleShare}
          >
            Compartir mi link (demo)
            <span>🔗</span>
          </button>

          <p className="r4w-profile-share-info">
            La idea: 1 amigo que entra, 1 wish para ti. Todo controlado desde
            aquí, sin complicaciones.
          </p>

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/panel" className="r4w-secondary-btn">
              Volver a mi panel
              <span>📊</span>
            </Link>
            <Link href="/carrera/r7" className="r4w-secondary-btn">
              Ir a la carrera
              <span>🏁</span>
            </Link>
            <button
              type="button"
              className="r4w-secondary-btn"
              onClick={() => {
                logout();
                router.push("/registro");
              }}
            >
              Cerrar sesión
              <span>🚪</span>
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}