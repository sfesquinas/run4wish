// app/perfil/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { supabase } from "../lib/supabaseClient";

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
  const { user, profile, isReady, refreshProfile } = useUser();
  const router = useRouter();

  const [username, setUsername] = useState(profile?.username || "Usuario");
  const [country, setCountry] = useState("España");
  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  // Cargar datos del perfil desde Supabase
  useEffect(() => {
    if (!isReady || !profile) return;

    if (profile.username) setUsername(profile.username);
    
    // Cargar preferencias desde localStorage (sonido, vibración, avatar)
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("r4w_profile");
        if (raw) {
          const p = JSON.parse(raw) as Partial<StoredProfile>;
          if (typeof p.soundOn === "boolean") setSoundOn(p.soundOn);
          if (typeof p.vibrationOn === "boolean") setVibrationOn(p.vibrationOn);
          if (p.avatarId) setSelectedAvatar(p.avatarId);
        }
      } catch {
        // silencioso
      }
    }
  }, [isReady, profile]);

  const handleShare = () => {
    alert(
      "En la versión final podrás compartir tu link de invitación y ganar wishes cuando tus amigos se unan."
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      // 1) Actualizar username en Supabase
      const { error: updateError } = await supabase
        .from("r4w_profiles")
        .update({ username })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error actualizando perfil:", updateError);
        setProfileNotice("Error al guardar el nombre de usuario");
        setTimeout(() => setProfileNotice(null), 2000);
        return;
      }

      // 2) Guardar preferencias locales (sonido, vibración, avatar)
      if (typeof window !== "undefined") {
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
      }

      // 3) Refrescar el perfil en el hook para actualizar la cabecera
      await refreshProfile();

      setProfileNotice("Perfil actualizado ✔️");
      setTimeout(() => {
        setProfileNotice(null);
        router.push("/panel");
      }, 1500);
    } catch (err) {
      console.error("Error guardando perfil:", err);
      setProfileNotice("Error al guardar el perfil");
      setTimeout(() => setProfileNotice(null), 2000);
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
      {profileNotice && (
        <div className="r4w-toast">
          <div className="r4w-toast-card">
            <div className="r4w-toast-title">Perfil guardado ✅</div>
            <p className="r4w-toast-text">{profileNotice}</p>
          </div>
        </div>
      )}
      </main>
    );
  }

  return (
    <main className="r4w-profile-page">
      <section className="r4w-profile-layout">
        {/* COLUMNA IZQUIERDA: datos básicos + toggles + avatares */}
        <div>
          <h1 className="r4w-profile-main-title">
            Tu perfil RUN<span className="r4w-profile-4">4</span>WISH
          </h1>

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
            <div className="r4w-toggle-container">
              <button
                type="button"
                className={`r4w-toggle-row r4w-toggle-clickable ${soundOn ? "r4w-toggle-active" : ""}`}
                onClick={() => setSoundOn((v) => !v)}
                aria-label={soundOn ? "Desactivar sonido" : "Activar sonido"}
              >
                <div className="r4w-toggle-label">
                  <span className={`r4w-toggle-icon ${soundOn ? "r4w-toggle-icon-active" : ""}`}>
                    {soundOn ? "🔊" : "🔇"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`r4w-toggle-row r4w-toggle-clickable ${vibrationOn ? "r4w-toggle-active" : ""}`}
                onClick={() => setVibrationOn((v) => !v)}
                aria-label={vibrationOn ? "Desactivar vibración" : "Activar vibración"}
              >
                <div className="r4w-toggle-label">
                  <span className={`r4w-toggle-icon ${vibrationOn ? "r4w-toggle-icon-active" : ""}`}>
                    {vibrationOn ? "📳" : "🔕"}
                  </span>
                </div>
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
              className="r4w-primary-btn r4w-profile-save-btn"
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
            Comparte RUN<span className="r4w-profile-4">4</span>WISH con tus amigos
          </h2>
          <p className="r4w-profile-side-text">
            En las próximas versiones, cuando invites a alguien y se registre
            usando tu link, ganarás wishes extra para usarlos en tus carreras.
          </p>

          <button
            type="button"
            className="r4w-primary-btn r4w-profile-share-btn"
            onClick={handleShare}
          >
            Compartir mi link (demo)
            <span>🔗</span>
          </button>

          <p className="r4w-profile-share-info">
            La idea: 1 amigo que entra, 1 wish para ti. Todo controlado desde
            aquí, sin complicaciones.
          </p>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
            <Link href="/panel" className="r4w-secondary-btn" style={{ flex: "1 1 0", minWidth: "120px", justifyContent: "center" }}>
              Mi panel
              <span>📊</span>
            </Link>
            <Link href="/carrera/r7" className="r4w-secondary-btn" style={{ flex: "1 1 0", minWidth: "120px", justifyContent: "center" }}>
              Ir a carreras
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