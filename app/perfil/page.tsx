// app/perfil/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type StoredProfile = {
  username: string;
  country: string;
  soundOn: boolean;
  vibrationOn: boolean;
  avatarId: string;
};

export default function PerfilPage() {
  const { user, isReady } = useUser();

  const [username, setUsername] = useState("Runner_You");
  const [country, setCountry] = useState("España");
  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");
  const [saving, setSaving] = useState(false);

  // Aviso suave al guardar el perfil
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  // Cargar datos del perfil guardado o, si no hay, datos del usuario
  useEffect(() => {
    if (!isReady) return;
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem("r4w_profile");
      if (raw) {
        const p = JSON.parse(raw) as Partial<StoredProfile>;
        if (p.username) setUsername(p.username);
        if (p.country) setCountry(p.country);
        if (typeof p.soundOn === "boolean") setSoundOn(p.soundOn);
        if (typeof p.vibrationOn === "boolean") setVibrationOn(p.vibrationOn);
        if (p.avatarId) setSelectedAvatar(p.avatarId);
        return;
      }

      // Si no había perfil guardado, usamos algunos datos del user
      if (user?.country) setCountry(user.country);
      if ((user as any).avatarId) {
        setSelectedAvatar((user as any).avatarId as string);
      }
    } catch {
      // silencioso
    }
  }, [isReady, user]);

  const handleShare = () => {
    alert(
      "En la versión final podrás compartir tu link de invitación y ganar wishes cuando tus amigos se unan."
    );
  };

  const handleSave = () => {
    if (typeof window === "undefined") return;

    setSaving(true);
    try {
      const profileToStore: StoredProfile = {
        username,
        country,
        soundOn,
        vibrationOn,
        avatarId: selectedAvatar,
      };

      window.localStorage.setItem(
        "r4w_profile",
        JSON.stringify(profileToStore)
      );

      // Aviso bonito en lugar del alert nativo
      setProfileNotice(
        "Perfil actualizado ✔️ Tus cambios ya se han guardado en Run4Wish."
      );
      setTimeout(() => setProfileNotice(null), 3000);
    } finally {
      setSaving(false);
    }
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

  return (
    <main className="r4w-profile-page">
      <section className="r4w-profile-layout">
        {/* COLUMNA IZQUIERDA: datos básicos + toggles + avatares */}
        <div>
          <h1 className="r4w-profile-main-title">Tu perfil Run4Wish</h1>
          <p className="r4w-profile-subtitle">
            Ajusta tu nombre de usuario, país, sonido y el avatar con el que
            compites en cada carrera.
          </p>

          <div className="r4w-profile-form">
            {/* Nombre usuario (juego) */}
            <div>
              <div className="r4w-profile-label">
                Nombre de usuario (juego)
              </div>
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
              <select
                className="r4w-profile-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="España">España</option>
                <option value="Portugal">Portugal</option>
                <option value="Francia">Francia</option>
                <option value="Italia">Italia</option>
                <option value="Alemania">Alemania</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="r4w-toggle-row">
              <div className="r4w-toggle-label">
                <span>Sonido</span>
                <span>
                  Activar efectos cuando respondes o subes de posición.
                </span>
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
                Tienes 3 avatares desbloqueados. El resto se irán
                desbloqueando según tu constancia y logros en las carreras.
              </div>
            </div>

            {/* Botón guardar */}
            <button
              type="button"
              className="r4w-primary-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
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

      {/* Toast de confirmación de perfil */}
      {profileNotice && (
        <div className="r4w-toast">
          <div className="r4w-toast-card">
            <div className="r4w-toast-title">Perfil actualizado ✨</div>
            <p className="r4w-toast-text">{profileNotice}</p>
            <button
              type="button"
              className="r4w-primary-btn r4w-toast-btn"
              onClick={() => setProfileNotice(null)}
            >
              Seguir jugando 🚀
            </button>
          </div>
        </div>
      )}
    </main>
  );
}