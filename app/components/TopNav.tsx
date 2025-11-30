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
  
  // Nombre de usuario: primero username_game (de user_metadata), luego username del user, luego username del profile, si no hay ninguno, "Runner"
  const displayName =
    (user?.user_metadata?.username_game as string) || 
    user?.username || 
    profile?.username || 
    "Runner";
  
  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <header className="r4w-topbar">
      <div className="r4w-topnav">
        <div className={user ? "r4w-topnav-inner" : "r4w-topnav-inner-centered"}>
          {user ? (
            <>
              {/* Logo a la izquierda: abre el menú */}
              <button
                type="button"
                className="r4w-topnav-logo-btn"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className="r4w-topnav-logo">
                  <img
                    src="/r4w-icon.png"
                    alt="Run4Wish"
                    width={32}
                    height={32}
                  />
                </div>
              </button>

              {/* Texto Run4Wish centrado: abre el menú */}
              <button
                type="button"
                className="r4w-topnav-center r4w-topnav-center-btn"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className="r4w-topnav-text">
                  RUN<span className="r4w-topnav-4">4</span>WISH
                </div>
              </button>

              {/* Zona derecha: usuario y wishes */}
              <div className="r4w-topnav-right">
                <button
                  type="button"
                  className="r4w-topnav-user r4w-topnav-user-btn"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="r4w-topnav-user-name">{displayName}</span>
                </button>
                <div className="r4w-topnav-wishes">
                  Wishes:&nbsp;<span>{wishes}</span>
                </div>
              </div>
            </>
          ) : (
            /* Logo y nombre centrados cuando no hay usuario */
            <button
              type="button"
              className="r4w-topnav-brand-centered"
              onClick={() => router.push("/")}
            >
              <div className="r4w-topnav-logo">
                <img
                  src="/r4w-icon.png"
                  alt="Run4Wish"
                  width={36}
                  height={36}
                />
              </div>
              <div className="r4w-topnav-text">
                RUN<span className="r4w-topnav-4">4</span>WISH
              </div>
            </button>
          )}
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

              <button
                type="button"
                className="r4w-menu-item"
                onClick={() => handleNavigate("/perfil")}
              >
                Mi Perfil
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
                  router.push("/");
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