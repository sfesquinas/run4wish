// app/components/TopNav.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";

export default function TopNav() {
  const router = useRouter();
  const { user, profile, isReady, logout } = useUser() as any;
  const { wishes } = useWishes(user?.id ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Nombre de usuario: primero username del profile (Supabase), luego username_game, luego username del user, si no hay ninguno, "Runner"
  const displayName =
    profile?.username || user?.username_game || user?.username || "Runner";
  
  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <header className="r4w-topbar">
      <div className="r4w-topnav">
        <div className="r4w-topnav-inner">
          {/* Logo / brand + botón menú: agrupados a la izquierda */}
          <div className="r4w-topnav-left">
            <button
              type="button"
              className="r4w-topnav-brand"
              onClick={() => router.push("/")}
            >
              <div className="r4w-topnav-logo">
                <img
                  src="/r4w-icon.png"
                  alt="Run4Wish"
                  width={32}
                  height={32}
                />
              </div>
              <div className="r4w-topnav-text">
                RUN<span className="r4w-topnav-4">4</span>WISH
              </div>
            </button>

            {/* Botón del menú justo después del nombre (solo si hay usuario) */}
            {user && (
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="r4w-menu-trigger"
              >
                ▾
              </button>
            )}
          </div>

          {/* Zona derecha: usuario y wishes alineados a la derecha */}
          <div className="r4w-topnav-right">
            {user ? (
              <>
                <div className="r4w-topnav-user">
                  <span className="r4w-topnav-user-name">{displayName} ✨</span>
                </div>
                <div className="r4w-topnav-wishes">
                  Wishes:&nbsp;<span>{wishes}</span>
                </div>
              </>
            ) : (
              <div className="r4w-topnav-auth">
                <Link href="/login" className="r4w-topnav-link">
                  Iniciar sesión
                </Link>
                <Link href="/registro" className="r4w-topnav-link">
                  Crear acceso
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MENÚ DESPLEGABLE EN OVERLAY */}
        {menuOpen && user && (
          <div
            className="r4w-menu-overlay"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="r4w-menu-card"
              onClick={(e) => e.stopPropagation()} // para que no se cierre al pulsar dentro
            >
              <button
                type="button"
                className="r4w-menu-item"
                onClick={() => handleNavigate("/panel")}
              >
                Mi panel
              </button>

              <button
                type="button"
                className="r4w-menu-item"
                onClick={() => handleNavigate("/carreras")}
              >
                Carreras
              </button>

              <button
                type="button"
                className="r4w-menu-item"
                onClick={() => handleNavigate("/wishes")}
              >
                Tienda de wishes
              </button>

              <hr className="r4w-menu-divider" />

              <button
                type="button"
                className="r4w-menu-item r4w-menu-logout"
                onClick={async () => {
                  setMenuOpen(false);
                  if (logout) {
                    await logout();
                  }
                  // Redirigir a la pantalla de login después de cerrar sesión
                  router.push("/login");
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}