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

      // 1) Obtener sesión actual
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

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

      if (isMounted) {
        setLoading(false);
      }
    };

    // Carga inicial
    fetchUserAndProfile();

    // 3) Escuchar cambios de sesión (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
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