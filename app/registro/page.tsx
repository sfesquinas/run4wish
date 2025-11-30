// app/registro/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useWishes } from "../hooks/useWishes";
import { useUser } from "../hooks/useUser";

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

export default function RegistroPage() {
  const router = useRouter();

  // 👇 user puede ser null en registro, no pasa nada
  const { user } = useUser();
  const { setWishes } = useWishes(user?.id ?? null);

  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones básicas (sin username, se rellenará en el perfil)
    if (!email || !birthdate || !password || !password2) {
      setErrorMsg("Por favor, rellena todos los campos.");
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
      // 1) Crear usuario en Supabase Auth (sin username, se rellenará en el perfil)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
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
      if (!createdUser) {
        setErrorMsg(
          "Hemos enviado un email de confirmación. Revisa tu bandeja e inténtalo de nuevo."
        );
        setLoading(false);
        return;
      }

      // 2) Crear perfil inicial en la tabla r4w_profiles (sin username, se rellenará en /perfil)
      const { error: profileError } = await supabase
        .from("r4w_profiles")
        .upsert(
          {
            id: createdUser.id,
            email: createdUser.email,
            username: null, // Se rellenará en la página de perfil
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

      // 4) Redirigir a la página de perfil para que complete su nombre, país y avatar
      router.push("/perfil");
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
          <div className="r4w-auth-fields">
            <label className="r4w-auth-label">
              <span className="r4w-auth-label-text">Email</span>
              <input
                className="r4w-auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@email.com"
                required
              />
            </label>

            <label className="r4w-auth-label">
              <span className="r4w-auth-label-text">Fecha de nacimiento</span>
              <input
                className="r4w-auth-input"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
              />
            </label>

            <label className="r4w-auth-label">
              <span className="r4w-auth-label-text">Contraseña</span>
              <div className="r4w-auth-input-wrapper">
                <input
                  className="r4w-auth-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
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
              <span className="r4w-auth-label-text">Repite la contraseña</span>
              <div className="r4w-auth-input-wrapper">
                <input
                  className="r4w-auth-input"
                  type={showPassword2 ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Repite tu contraseña"
                  minLength={6}
                  required
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
          </div>

          {errorMsg && <p className="r4w-auth-error">{errorMsg}</p>}

          <button
            type="submit"
            className="r4w-primary-btn r4w-auth-submit"
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
    </main>
  );
}