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
  const { user, isReady, refreshProfile } = useUser();
  const router = useRouter();

  const [username, setUsername] = useState("Runner_You");
  const [country, setCountry] = useState("España");
  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar datos del perfil desde Supabase
  useEffect(() => {
    if (!isReady || !user?.id) return;

    const loadProfile = async () => {
      try {
        // Cargar desde r4w_profiles
        const { data: profileData, error } = await supabase
          .from("r4w_profiles")
          .select("username, country, avatar_id")
          .eq("id", user.id)
          .single();

        if (!error && profileData) {
          if (profileData.username) setUsername(profileData.username);
          if (profileData.country) setCountry(profileData.country);
          if (profileData.avatar_id) setSelectedAvatar(profileData.avatar_id);
        }

        // También cargar desde localStorage para sonido y vibración (temporal)
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem("r4w_profile");
            if (raw) {
              const p = JSON.parse(raw) as Partial<StoredProfile>;
              if (typeof p.soundOn === "boolean") setSoundOn(p.soundOn);
              if (typeof p.vibrationOn === "boolean") setVibrationOn(p.vibrationOn);
            }
          } catch {
            // silencioso
          }
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      }
    };

    loadProfile();
  }, [isReady, user]);

  const handleShare = () => {
    alert(
      "En la versión final podrás compartir tu link de invitación y ganar wishes cuando tus amigos se unan."
    );
  };

  const handleSave = async () => {
    if (!user?.id) {
      setErrorMsg("No se pudo identificar tu usuario. Por favor, inicia sesión de nuevo.");
      return;
    }

    if (!username || username.trim().length === 0) {
      setErrorMsg("El nombre de usuario es obligatorio.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // 1) Validar que el username sea único (excepto si es el mismo usuario)
      const { data: existingUser, error: checkError } = await supabase
        .from("r4w_profiles")
        .select("id, username")
        .eq("username", username.trim())
        .neq("id", user.id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 significa "no rows found", que es lo que queremos
        console.error("Error verificando username:", checkError);
        setErrorMsg("Error al verificar el nombre de usuario. Inténtalo de nuevo.");
        setSaving(false);
        return;
      }

      if (existingUser) {
        setErrorMsg("Este nombre de usuario ya está en uso. Por favor, elige otro.");
        setSaving(false);
        return;
      }

      // 2) Actualizar r4w_profiles
      const { error: profileError } = await supabase
        .from("r4w_profiles")
        .update({
          username: username.trim(),
          country: country,
          avatar_id: selectedAvatar,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error actualizando perfil:", profileError);
        setErrorMsg("No se pudo actualizar el perfil. Inténtalo de nuevo.");
        setSaving(false);
        return;
      }

      // 3) Actualizar user_metadata con username_game
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          username_game: username.trim(),
        },
      });

      if (metadataError) {
        console.error("Error actualizando metadata:", metadataError);
        // No bloqueamos si falla, pero lo registramos
      }

      // 4) Guardar sonido y vibración en localStorage (temporal)
      if (typeof window !== "undefined") {
        const profileToStore: StoredProfile = {
          username: username.trim(),
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

      // 5) Refrescar perfil para actualizar TopNav
      await refreshProfile();
      
      setProfileNotice("Perfil actualizado ✔️");
      setTimeout(() => {
        setProfileNotice(null);
        router.push("/panel");
      }, 1500);
    } catch (err: any) {
      console.error("Error guardando perfil:", err);
      setErrorMsg("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
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

  const unlockedCount = initialAvatars.filter((a) => a.unlocked).length;

  return (
    <main className="r4w-profile-page">
      <section className="r4w-profile-layout">
        <div className="r4w-profile-main">
          <h1 className="r4w-profile-main-title">Tu perfil Run4Wish</h1>
          <p className="r4w-profile-subtitle">
            Ajusta tu nombre de usuario, país, sonido y el avatar con el que compites en cada carrera.
          </p>

          <div className="r4w-profile-form">
            {/* Nombre usuario (juego) */}
            <div className="r4w-profile-field">
              <label className="r4w-profile-label">
                Nombre de usuario (juego) *
              </label>
              <input
                className="r4w-profile-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                placeholder="Ej: Runner_SAO"
              />
            </div>
            {errorMsg && <p className="r4w-auth-error" style={{ marginTop: 8 }}>{errorMsg}</p>}

            {/* País */}
            <div className="r4w-profile-field">
              <label className="r4w-profile-label">País</label>
              <div className="r4w-profile-select-wrapper">
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
                <span className="r4w-profile-select-arrow">▼</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="r4w-profile-field">
              <div className="r4w-toggle-row">
                <div className="r4w-toggle-label">
                  <span className="r4w-toggle-title">Sonido</span>
                  <span className="r4w-toggle-desc">
                    Activar efectos cuando respondes o subes de posición.
                  </span>
                </div>
                <button
                  type="button"
                  className={`r4w-switch ${soundOn ? "on" : ""}`}
                  onClick={() => setSoundOn((v) => !v)}
                  aria-label="Toggle sonido"
                >
                  <div className="r4w-switch-knob" />
                </button>
              </div>
            </div>

            <div className="r4w-profile-field">
              <div className="r4w-toggle-row">
                <div className="r4w-toggle-label">
                  <span className="r4w-toggle-title">Vibración</span>
                  <span className="r4w-toggle-desc">
                    Notificaciones sutiles cuando se abre la pregunta.
                  </span>
                </div>
                <button
                  type="button"
                  className={`r4w-switch ${vibrationOn ? "on" : ""}`}
                  onClick={() => setVibrationOn((v) => !v)}
                  aria-label="Toggle vibración"
                >
                  <div className="r4w-switch-knob" />
                </button>
              </div>
            </div>

            {/* Avatares */}
            <div className="r4w-profile-field">
              <label className="r4w-profile-label">Avatar para las carreras</label>
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
                      aria-label={`Seleccionar avatar ${avatar.emoji}`}
                    >
                      {avatar.emoji}
                    </button>
                  );
                })}
              </div>
              <p className="r4w-profile-avatars-info">
                Tienes {unlockedCount} avatares desbloqueados. El resto se irán desbloqueando según tu constancia y logros en las carreras.
              </p>
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

        {/* COLUMNA DERECHA: compartir */}
        <aside className="r4w-profile-side">
          <h2 className="r4w-profile-side-title">
            Comparte Run4Wish con tus amigos
          </h2>
          <p className="r4w-profile-side-text">
            En las próximas versiones, cuando invites a alguien y se registre usando tu link, ganarás wishes extra para usarlos en tus carreras.
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
            La idea: 1 amigo que entra, 1 wish para ti. Todo controlado desde aquí, sin complicaciones.
          </p>
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