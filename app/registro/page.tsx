// app/registro/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useWishes } from "../hooks/useWishes";
import { useUser } from "../hooks/useUser";
import { ensureSimulatedRunners } from "../lib/simulatedRunners";
import { createUserScheduleFor7dMvp } from "../lib/userSchedule";

const INITIAL_WISHES = 5;

function calculateAge(dateStr: string): number {
  const today = new Date();
  const birth = new Date(dateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Formatea la fecha de nacimiento como ddmmaaaa
 */
function formatBirthdateForUsername(birthdate: string): string {
  const date = new Date(birthdate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
}

/**
 * Verifica si un username existe en la base de datos
 */
async function usernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("r4w_profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();
  
  if (error && error.code !== "PGRST116") {
    // PGRST116 es "no rows returned", que es esperado si no existe
    console.warn("Error verificando username:", error);
  }
  
  return !!data;
}

/**
 * Genera un username único basado en el username original y la fecha de nacimiento
 */
async function generateUniqueUsername(
  baseUsername: string,
  birthdate: string
): Promise<string> {
  // Primero intentamos con el username original
  if (!(await usernameExists(baseUsername))) {
    return baseUsername;
  }

  // Si existe, añadimos .ddmmaaaa
  const birthdateSuffix = formatBirthdateForUsername(birthdate);
  const usernameWithDate = `${baseUsername}.${birthdateSuffix}`;
  
  if (!(await usernameExists(usernameWithDate))) {
    return usernameWithDate;
  }

  // Si aún existe, añadimos un número aleatorio de 3 dígitos
  let attempts = 0;
  while (attempts < 100) {
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const finalUsername = `${usernameWithDate}${randomSuffix}`;
    
    if (!(await usernameExists(finalUsername))) {
      return finalUsername;
    }
    
    attempts++;
  }

  // Como último recurso, añadimos timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `${usernameWithDate}${timestamp}`;
}

export default function RegistroPage() {
  const router = useRouter();

  // 👇 user puede ser null en registro, no pasa nada
  const { user } = useUser();
  const { setWishes } = useWishes(user?.id ?? null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones básicas
    if (!username || !email || !birthdate || !password || !password2) {
      setErrorMsg("Por favor, rellena todos los campos.");
      return;
    }

    if (!acceptedPolicies) {
      setErrorMsg("Debes aceptar las políticas de privacidad y términos de uso.");
      return;
    }

    if (password !== password2) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    const age = calculateAge(birthdate);
    if (age < 18) {
      setErrorMsg("Run4Wish es solo para mayores de 18 años.");
      return;
    }

    setLoading(true);

    try {
      // 0) Generar username único si es necesario
      const uniqueUsername = await generateUniqueUsername(username, birthdate);
      
      // 1) Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: uniqueUsername,
            birthdate,
          },
        },
      });

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "No se pudo crear tu acceso.");
        setLoading(false);
        return;
      }

      const createdUser = data.user;
      
      // Si no hay usuario pero tampoco hay error, significa que se requiere verificación de email
      // Esto ocurre cuando Supabase está configurado para requerir verificación de email
      if (!createdUser && !error && data.session === null) {
        setRegisteredEmail(email);
        setShowEmailVerificationModal(true);
        setLoading(false);
        return;
      }
      
      // Si hay un error pero es relacionado con verificación de email
      if (error && (error as any).message && ((error as any).message.includes("email") || (error as any).message.includes("verification"))) {
        setRegisteredEmail(email);
        setShowEmailVerificationModal(true);
        setLoading(false);
        return;
      }
      
      if (!createdUser) {
        // Fallback: mostrar modal genérico si no hay usuario
        setRegisteredEmail(email);
        setShowEmailVerificationModal(true);
        setLoading(false);
        return;
      }

      // 2) Crear / actualizar perfil en la tabla r4w_profiles
      const { error: profileError } = await supabase
        .from("r4w_profiles")
        .upsert(
          {
            id: createdUser.id,
            email: createdUser.email,
            username: uniqueUsername,
            birthdate,
            wishes: INITIAL_WISHES,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.warn("Error guardando perfil:", profileError);
        setErrorMsg(
          "Tu acceso se ha creado, pero hubo un problema guardando el perfil. Inténtalo más tarde."
        );
        setLoading(false);
        return;
      }

      // 3) Sincronizar wishes iniciales en el store local
      setWishes(() => INITIAL_WISHES);

      // 4) Asegurar que existen los runners simulados (en background, no bloquea)
      ensureSimulatedRunners().catch((err) => {
        console.warn("Error generando runners simulados (no crítico):", err);
      });

      // 5) Crear schedule personalizado de 7 días para el usuario
      // IMPORTANTE: Lo hacemos en background para no bloquear el registro
      // Si falla, el usuario puede seguir usando la app y el schedule se creará automáticamente cuando acceda a /pregunta
      createUserScheduleFor7dMvp(createdUser.id).catch((err) => {
        console.error("❌ Error creando schedule personalizado (no crítico):", err);
        // No bloqueamos el registro, el schedule se creará automáticamente cuando acceda a /pregunta
      });

      // 6) Redirigir al panel
      router.push("/panel");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ha ocurrido un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="r4w-auth-page">
      <section className="r4w-auth-card">
        <h1 className="r4w-auth-title">Crea tu acceso Run4Wish</h1>
        <p className="r4w-auth-subtitle">
          Necesitas ser mayor de 18 años. Usaremos tu email para validar tu
          cuenta y guardar tus wishes.
        </p>

        <form className="r4w-auth-form" onSubmit={handleSubmit}>
          <label className="r4w-auth-label">
            Nombre de juego
            <input
              className="r4w-auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              placeholder="Ej: Runner_SAO"
            />
          </label>

          <label className="r4w-auth-label">
            Email
            <input
              className="r4w-auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@email.com"
            />
          </label>

          <label className="r4w-auth-label">
            Fecha de nacimiento
            <input
              className="r4w-auth-input"
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </label>

          <label className="r4w-auth-label">
            Contraseña
            <div className="r4w-auth-password-wrapper">
              <input
                className="r4w-auth-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
              <button
                type="button"
                className="r4w-auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </label>

          <label className="r4w-auth-label">
            Repite la contraseña
            <div className="r4w-auth-password-wrapper">
              <input
                className="r4w-auth-input"
                type={showPassword2 ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                minLength={6}
              />
              <button
                type="button"
                className="r4w-auth-password-toggle"
                onClick={() => setShowPassword2(!showPassword2)}
                aria-label={showPassword2 ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword2 ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </label>

          {errorMsg && <p className="r4w-auth-error">{errorMsg}</p>}

          <label className="r4w-auth-checkbox-label">
            <input
              type="checkbox"
              className="r4w-auth-checkbox"
              checked={acceptedPolicies}
              onChange={(e) => setAcceptedPolicies(e.target.checked)}
            />
            <span className="r4w-auth-checkbox-text">
              Acepto las{" "}
              <a href="/politica-privacidad" target="_blank" className="r4w-auth-link">
                políticas de privacidad
              </a>{" "}
              y los{" "}
              <a href="/terminos-uso" target="_blank" className="r4w-auth-link">
                términos de uso
              </a>
            </span>
          </label>

          <button
            type="submit"
            className="r4w-primary-btn"
            disabled={loading}
          >
            {loading ? "Creando acceso..." : "Crear acceso y empezar 🚀"}
          </button>
        </form>

        <p className="r4w-auth-footer">
          ¿Ya tienes acceso?{" "}
          <a href="/login" className="r4w-auth-link">
            Inicia sesión aquí
          </a>
        </p>
      </section>

      {/* Modal de verificación de email */}
      {showEmailVerificationModal && (
        <div className="r4w-email-verification-overlay">
          <div className="r4w-email-verification-card">
            <div className="r4w-email-verification-icon">📧</div>
            <h2 className="r4w-email-verification-title">
              Verifica tu correo electrónico
            </h2>
            <p className="r4w-email-verification-text">
              Hemos enviado un enlace de confirmación a:
            </p>
            <p className="r4w-email-verification-email">
              <strong>{registeredEmail}</strong>
            </p>
            <p className="r4w-email-verification-text">
              Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace para activar tu cuenta.
            </p>
            <p className="r4w-email-verification-hint">
              Una vez verificado, podrás iniciar sesión y empezar a jugar.
            </p>
            <button
              type="button"
              className="r4w-primary-btn r4w-email-verification-btn"
              onClick={() => {
                setShowEmailVerificationModal(false);
                router.push("/login");
              }}
            >
              Entendido, ir a iniciar sesión
            </button>
          </div>
        </div>
      )}
    </main>
  );
}