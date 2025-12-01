// app/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type R4WProfile = {
  id: string;
  email: string | null;
  username: string | null;
  birthdate: string | null;
  wishes: number | null;
};

// Devolvemos tipos muy abiertos (any) para no romper nada existente
export function useUser() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<R4WProfile | null>(null);
  const [wishes, setWishes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Por compatibilidad con código que ya usa `preregistrations`
  const [preregistrations] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserAndProfile = async () => {
      setLoading(true);

      try {
        // 1) Obtener sesión actual
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Manejar errores de refresh token silenciosamente
        if (sessionError) {
          // Si es un error de refresh token, simplemente no hay sesión válida
          if (sessionError.message?.includes("Refresh Token") || 
              sessionError.message?.includes("refresh_token") ||
              (sessionError as any).status === 401) {
            console.log("ℹ️ Sesión expirada o inválida, usuario no autenticado");
            if (isMounted) {
              setUser(null);
              setProfile(null);
              setWishes(0);
              setLoading(false);
            }
            return;
          }
          // Para otros errores, loguear pero continuar
          console.warn("⚠️ Error obteniendo sesión:", sessionError.message);
        }
        
        const currentUser = sessionData?.session?.user ?? null;

        if (!isMounted) return;

        setUser(currentUser);

        if (currentUser?.id) {
          // 2) Cargar perfil de r4w_profiles
          const { data: profileData, error: profileError } = await supabase
            .from("r4w_profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

          if (!isMounted) return;

          if (!profileError && profileData) {
            setProfile(profileData as R4WProfile);
            setWishes(profileData.wishes ?? 0);
          } else {
            // si no hay perfil aún, lo dejamos en null
            setProfile(null);
            setWishes(0);
          }
        } else {
          setProfile(null);
          setWishes(0);
        }
      } catch (err: any) {
        // Manejar errores inesperados
        console.warn("⚠️ Error inesperado en fetchUserAndProfile:", err?.message || err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setWishes(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Carga inicial
    fetchUserAndProfile();

    // 3) Escuchar cambios de sesión (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Si hay un nuevo login, recargar el perfil
        if (currentUser?.id) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("r4w_profiles")
              .select("*")
              .eq("id", currentUser.id)
              .single();

            if (!profileError && profileData) {
              setProfile(profileData as R4WProfile);
              setWishes(profileData.wishes ?? 0);
            }
          } catch (err) {
            // Silenciar errores al recargar perfil después de login
            console.warn("⚠️ Error recargando perfil después de login:", err);
          }
        } else {
          setProfile(null);
          setWishes(0);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWishes(0);
  };

  const refreshProfile = async () => {
    if (!user?.id) return;

    // Refrescar perfil de r4w_profiles
    const { data: profileData, error } = await supabase
      .from("r4w_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && profileData) {
      setProfile(profileData as R4WProfile);
      setWishes(profileData.wishes ?? 0);
    }

    // Refrescar usuario y su metadata (incluye username_game)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
    }
  };

  return {
    user,
    profile,
    wishes,
    setWishes,
    // por compatibilidad con el resto del código
    preregistrations,
    isReady: !loading,
    loading,
    logout,
    refreshProfile,
  };
}