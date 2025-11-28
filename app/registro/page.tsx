// app/registro/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useWishes } from "../hooks/useWishes";

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
  const { setWishes } = useWishes();   // 👈 NUEVO

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validaciones básicas
    if (!username || !email || !birthdate || !password || !password2) {
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
      // 1) Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            birthdate,
          },
          // 👇 A dónde queremos que vuelva tras confirmar el email
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        console.warn("Error al crear acceso:", error);

        const msg = error.message.toLowerCase();

        if (msg.includes("14 seconds")) {
          setErrorMsg(
            "Tenemos que esperar unos segundos antes de volver a intentarlo. Prueba de nuevo en un momento."
          );
        } else if (msg.includes("user already registered")) {
          setErrorMsg(
            "Ya existe un acceso con este email. Prueba a iniciar sesión."
          );
        } else {
          setErrorMsg(
            "No se pudo crear tu acceso. Inténtalo de nuevo en unos segundos."
          );
        }

        setLoading(false);
        return;
      }

      // 2) Crear / actualizar perfil en la tabla profiles
      const { error: profileError } = await supabase.from("r4w_profiles").upsert(
        {
          username,
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

      // ✅ Sincronizar wishes en el store global
      setWishes(INITIAL_WISHES);

      // 3) Redirigir al panel
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
            <input
              className="r4w-auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </label>

          <label className="r4w-auth-label">
            Repite la contraseña
            <input
              className="r4w-auth-input"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              minLength={6}
            />
          </label>

          {errorMsg && <p className="r4w-auth-error">{errorMsg}</p>}

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
    </main>
  );
}