// app/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useWishes } from "../hooks/useWishes";

export default function LoginPage() {
  const router = useRouter();
  const { setWishes } = useWishes(null); // en login aún no tenemos userId
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Introduce tu email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      // 1) Login en Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn("Error de login:", error);

        const isInvalid = error.message
          ?.toLowerCase()
          .includes("invalid login credentials");

        setErrorMsg(
          isInvalid
            ? "Email o contraseña incorrectos. Revísalos e inténtalo de nuevo."
            : "No se pudo iniciar sesión. Inténtalo de nuevo en unos segundos."
        );

        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setErrorMsg("No se pudo recuperar tu usuario. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }

      // 2) Leer perfil para obtener wishes reales
      const { data: profileData, error: profileError } = await supabase
        .from("r4w_profiles")
        .select("wishes")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn("No se pudo leer el perfil:", profileError.message);
        // Fallback suave: dejamos wishes por defecto
        setWishes(() => 5);
      } else {
        const wishesFromProfile =
          typeof profileData?.wishes === "number" ? profileData.wishes : 5;
          setWishes(() => wishesFromProfile);
      }

      // 3) Redirigir a la pantalla principal
      router.push("/");
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
        <h1 className="r4w-auth-title">
          Inicia sesión en <span className="r4w-auth-title-run">RUN</span><span className="r4w-auth-title-4">4</span><span className="r4w-auth-title-wish">WISH</span>
        </h1>
        <p className="r4w-auth-subtitle">
          Entra con tu email y contraseña para seguir corriendo por tu deseo.
        </p>

        <form className="r4w-auth-form" onSubmit={handleSubmit}>
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
            Contraseña
            <input
              className="r4w-auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {errorMsg && <p className="r4w-auth-error">{errorMsg}</p>}

          <button
            type="submit"
            className="r4w-primary-btn"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar en Run4Wish 🚀"}
          </button>
        </form>

        <p className="r4w-auth-footer">
          ¿Aún no tienes acceso?{" "}
          <a href="/registro" className="r4w-auth-link">
            Crea tu acceso aquí
          </a>
        </p>
      </section>
    </main>
  );
}