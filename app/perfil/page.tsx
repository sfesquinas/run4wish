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
  const { user, profile, isReady } = useUser();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("España");
  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("a1");
  const [saving, setSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState<string>("");

  // Cargar datos del perfil desde Supabase y localStorage
  useEffect(() => {
    if (!isReady || !user) return;
    if (typeof window === "undefined") return;

    const loadProfile = async () => {
      try {
        // 1) Cargar datos desde Supabase (username, country, avatar_id)
        if (profile) {
          if (profile.username) setUsername(profile.username);
          if ((profile as any).country) setCountry((profile as any).country);
          if ((profile as any).avatar_id) {
            setSelectedAvatar((profile as any).avatar_id);
          }
        } else {
          // Si no hay perfil en Supabase, intentar cargar desde la tabla
          const { data: profileData } = await supabase
            .from("r4w_profiles")
            .select("username, country, avatar_id")
            .eq("id", user.id)
            .single();

          if (profileData) {
            if (profileData.username) setUsername(profileData.username);
            if (profileData.country) setCountry(profileData.country);
            if (profileData.avatar_id) setSelectedAvatar(profileData.avatar_id);
          }
        }

        // 2) Cargar preferencias locales (soundOn, vibrationOn) desde localStorage
        const raw = window.localStorage.getItem("r4w_profile");
        if (raw) {
          const p = JSON.parse(raw) as Partial<StoredProfile>;
          if (typeof p.soundOn === "boolean") setSoundOn(p.soundOn);
          if (typeof p.vibrationOn === "boolean") setVibrationOn(p.vibrationOn);
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      }
    };

    loadProfile();
  }, [isReady, user, profile]);

  const handleShare = () => {
    alert(
      "En la versión final podrás compartir tu link de invitación y ganar wishes cuando tus amigos se unan."
    );
  };

  // Función para generar un nombre alternativo disponible
  const generateAlternativeUsername = async (baseUsername: string): Promise<string | null> => {
    if (!user) return null;

    // Intentar variaciones del nombre
    const variations = [
      `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
      `${baseUsername}${Math.floor(Math.random() * 100)}`,
      `${baseUsername}_${Date.now().toString().slice(-4)}`,
      `${baseUsername}_${Math.floor(Math.random() * 9999)}`,
    ];

    // Probar cada variación hasta encontrar una disponible
    for (const variation of variations) {
      const { data: existing } = await supabase
        .from("r4w_profiles")
        .select("id")
        .eq("username", variation)
        .neq("id", user.id)
        .maybeSingle();

      if (!existing) {
        return variation;
      }
    }

    // Si ninguna variación funciona, generar una completamente nueva
    const randomSuffix = Math.floor(Math.random() * 99999);
    return `${baseUsername}_${randomSuffix}`;
  };

  // Función para guardar el perfil (usada tanto en handleSave como en el modal)
  const saveProfile = async (usernameToSave: string) => {
    if (typeof window === "undefined" || !user) return false;

    try {
      // Preparar los datos a actualizar (solo incluir campos que tienen valor)
      const updateData: any = {
        username: usernameToSave.trim(),
      };

      // Solo incluir country si tiene valor
      if (country) {
        updateData.country = country;
      }

      // Solo incluir avatar_id si tiene valor
      if (selectedAvatar) {
        updateData.avatar_id = selectedAvatar;
      }

      // Guardar username, country y avatar_id en Supabase
      const { error: updateError, data } = await supabase
        .from("r4w_profiles")
        .update(updateData)
        .eq("id", user.id)
        .select();

      if (updateError) {
        console.error("Error actualizando perfil:", updateError);
        console.error("Datos intentados:", updateData);
        console.error("Detalles del error:", updateError.message, updateError.code);
        
        // Mensaje de error más específico
        if (updateError.code === "PGRST116" || updateError.message?.includes("column")) {
          setErrorMsg("Error: La columna avatar_id o country no existe en la base de datos. Ejecuta el SQL de migración.");
        } else {
          setErrorMsg(`No se pudo guardar el perfil: ${updateError.message || "Error desconocido"}`);
        }
        return false;
      }

      // Guardar preferencias locales (soundOn, vibrationOn) en localStorage
      const profileToStore: StoredProfile = {
        username: usernameToSave.trim(),
        country,
        soundOn,
        vibrationOn,
        avatarId: selectedAvatar,
      };

      window.localStorage.setItem(
        "r4w_profile",
        JSON.stringify(profileToStore)
      );

      // Actualizar el estado del username
      setUsername(usernameToSave.trim());

      return true;
    } catch (err: any) {
      console.error("Error guardando perfil:", err);
      setErrorMsg("Ha ocurrido un error inesperado.");
      return false;
    }
  };

  const handleSave = async () => {
    if (typeof window === "undefined" || !user) return;

    // Validaciones
    if (!username || username.trim().length === 0) {
      setErrorMsg("El nombre de usuario es obligatorio.");
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg("El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    setErrorMsg(null);
    setSaving(true);

    try {
      const trimmedUsername = username.trim();
      
      // 1) Verificar si el username es el mismo que ya tiene guardado en su perfil
      // Si es el mismo, no necesitamos validar duplicados, solo guardar
      const currentUsername = profile?.username || (user as any)?.username_game || (user as any)?.username;
      const isSameUsername = currentUsername && currentUsername.trim().toLowerCase() === trimmedUsername.toLowerCase();

      if (!isSameUsername) {
        // 2) Solo validar duplicados si está cambiando a un nombre diferente
        const { data: existingUser } = await supabase
          .from("r4w_profiles")
          .select("id")
          .eq("username", trimmedUsername)
          .neq("id", user.id)
          .maybeSingle();

        if (existingUser) {
          // El nombre ya existe, generar una alternativa y mostrar el modal
          const alternative = await generateAlternativeUsername(trimmedUsername);
          if (alternative) {
            setSuggestedUsername(alternative);
            setShowUsernameModal(true);
          } else {
            setErrorMsg("Este nombre de usuario ya está en uso. Elige otro.");
          }
          setSaving(false);
          return;
        }
      }

      // 3) Guardar el perfil (ya sea porque es el mismo nombre o porque es único)
      const saved = await saveProfile(trimmedUsername);
      if (!saved) {
        setSaving(false);
        return;
      }

      setProfileNotice("Perfil actualizado ✔️");
      setTimeout(() => {
        setProfileNotice(null);
        router.push("/panel");
      }, 1500);
    } catch (err: any) {
      console.error("Error guardando perfil:", err);
      setErrorMsg("Ha ocurrido un error inesperado.");
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
          <h1 className="r4w-profile-main-title">Tu perfil Run4Wish</h1>
          <p className="r4w-profile-subtitle">
            Ajusta tu nombre de usuario, país, sonido y el avatar con el que
            compites en cada carrera.
          </p>

          <div className="r4w-profile-form">
            {/* Nombre usuario (juego) */}
            <div>
              <div className="r4w-profile-label">
                Nombre de usuario (juego) <span style={{ color: "var(--r4w-accent)" }}>*</span>
              </div>
              <input
                className="r4w-profile-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMsg(null); // Limpiar error al escribir
                }}
                maxLength={20}
                placeholder="Ej: Runner_SAO"
              />
              {errorMsg && (
                <p style={{ marginTop: 6, fontSize: 12, color: "var(--r4w-error, #ef4444)" }}>
                  {errorMsg}
                </p>
              )}
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

      {/* Modal flotante: nombre de usuario ya existe */}
      {showUsernameModal && (
        <div
          className="r4w-tooltip-overlay"
          onClick={(e) => {
            // Cerrar al hacer clic fuera del modal
            if (e.target === e.currentTarget) {
              setShowUsernameModal(false);
            }
          }}
        >
          <div className="r4w-tooltip-card">
            <div className="r4w-tooltip-title">Ese nombre ya existe</div>
            <p className="r4w-tooltip-text">
              El nombre de usuario <strong>{username.trim()}</strong> ya está en
              uso. Te proponemos este alternativo:
            </p>
            <div
              style={{
                background: "rgba(255, 122, 26, 0.1)",
                border: "1px solid rgba(255, 122, 26, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <strong style={{ color: "var(--r4w-orange)", fontSize: "16px" }}>
                {suggestedUsername}
              </strong>
            </div>
            <button
              type="button"
              className="r4w-tooltip-close"
              onClick={async () => {
                setSaving(true);
                const saved = await saveProfile(suggestedUsername);
                if (saved) {
                  setShowUsernameModal(false);
                  setProfileNotice("Perfil actualizado ✔️");
                  setTimeout(() => {
                    setProfileNotice(null);
                    router.push("/panel");
                  }, 1500);
                } else {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Aceptar"}
            </button>
            <button
              type="button"
              style={{
                marginTop: "8px",
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "10px 12px",
                fontSize: "14px",
                color: "var(--r4w-text-muted)",
                cursor: "pointer",
              }}
              onClick={() => {
                setShowUsernameModal(false);
                setErrorMsg("Elige otro nombre de usuario.");
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}