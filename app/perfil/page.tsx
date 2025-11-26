// app/perfil/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { demoUserName } from "../data/r4wDemo";

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
  const [username, setUsername] = useState(demoUserName);
  const [country, setCountry] = useState("España");
  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");

  const handleShare = () => {
    // En el futuro aquí conectaremos el link real + wishes
    alert(
      "En la versión final podrás compartir tu link de invitación y ganar wishes cuando tus amigos se unan."
    );
  };

  return (
    <main className="r4w-profile-page">
      <section className="r4w-profile-layout">
        {/* COLUMNA IZQUIERDA: datos básicos + toggles + avatares */}
        <div>
          <h1 className="r4w-profile-main-title">Tu perfil Run4Wish</h1>
          <p className="r4w-profile-subtitle">
            Ajusta tu nombre, país, sonido y el avatar con el que compites en
            cada carrera.
          </p>

          <div className="r4w-profile-form">
            {/* Nombre usuario */}
            <div>
              <div className="r4w-profile-label">Nombre de usuario</div>
              <input
                className="r4w-profile-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* País */}
            <div>
              <div className="r4w-profile-label">País</div>
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

        {/* COLUMNA DERECHA: compartir + navegación */}
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

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link href="/panel" className="r4w-secondary-btn">
              Volver a mi panel
              <span>📊</span>
            </Link>
            <Link href="/carrera/r7" className="r4w-secondary-btn">
              Ir a la carrera
              <span>🏁</span>
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
