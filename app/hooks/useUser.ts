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

  const fetchUserAndProfile = async () => {
    setLoading(true);

    // 1) Obtener sesión actual
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    setUser(currentUser);

    if (currentUser?.id) {
      // 2) Cargar perfil de r4w_profiles
      const { data: profileData, error: profileError } = await supabase
        .from("r4w_profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

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

    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

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
        if (currentUser) {
          fetchUserAndProfile();
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

  const refreshProfile = async () => {
    await fetchUserAndProfile();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWishes(0);
  };

  return {
    user,
    profile,
    username: profile?.username ?? null,
    email: user?.email ?? null,
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