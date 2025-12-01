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
  
  // Nombre de usuario: usa directamente el username del perfil de Supabase
  const displayName = profile?.username || "Usuario";
  
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
              {/* Logo a la izquierda: va a la pantalla principal */}
              <Link
                href="/"
                className="r4w-topnav-logo-btn"
              >
                <div className="r4w-topnav-logo">
                  <img
                    src="/r4w-icon.png"
                    alt="Run4Wish"
                    width={32}
                    height={32}
                  />
                </div>
              </Link>

              {/* Texto Run4Wish centrado: abre el menú */}
              <button
                type="button"
                className="r4w-topnav-center r4w-topnav-center-btn"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <div className="r4w-topnav-text">
                  RUN<span className="r4w-topnav-4">4</span>WISH
                </div>
                <div className="r4w-topnav-triangle-circle">
                  <div className="r4w-topnav-triangle"></div>
                </div>
              </button>

              {/* Zona derecha: usuario y wishes */}
              <div className="r4w-topnav-right">
                <Link
                  href="/perfil"
                  className="r4w-topnav-user r4w-topnav-user-btn"
                >
                  <span className="r4w-topnav-user-name">{displayName}</span>
                </Link>
                <Link
                  href="/wishes"
                  className="r4w-topnav-wishes r4w-topnav-wishes-link"
                >
                  Wishes:&nbsp;<span>{wishes}</span>
                </Link>
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
                className="r4w-menu-item r4w-menu-item-1"
                onClick={() => handleNavigate("/panel")}
              >
                <span className="r4w-menu-icon">📊</span>
                <span className="r4w-menu-text">Mi panel</span>
                <span className="r4w-menu-arrow">→</span>
              </button>

              <button
                type="button"
                className="r4w-menu-item r4w-menu-item-2"
                onClick={() => handleNavigate("/carreras")}
              >
                <span className="r4w-menu-icon">🏁</span>
                <span className="r4w-menu-text">Carreras</span>
                <span className="r4w-menu-arrow">→</span>
              </button>

              <button
                type="button"
                className="r4w-menu-item r4w-menu-item-3"
                onClick={() => handleNavigate("/wishes")}
              >
                <span className="r4w-menu-icon">✨</span>
                <span className="r4w-menu-text">Tienda de wishes</span>
                <span className="r4w-menu-arrow">→</span>
              </button>

              <button
                type="button"
                className="r4w-menu-item r4w-menu-item-4"
                onClick={() => handleNavigate("/perfil")}
              >
                <span className="r4w-menu-icon">👤</span>
                <span className="r4w-menu-text">Mi Perfil</span>
                <span className="r4w-menu-arrow">→</span>
              </button>

              <hr className="r4w-menu-divider" />

              <button
                type="button"
                className="r4w-menu-item r4w-menu-item-5 r4w-menu-logout"
                onClick={async () => {
                  setMenuOpen(false);
                  if (logout) {
                    await logout();
                  }
                  router.push("/login");
                }}
              >
                <span className="r4w-menu-icon">🚪</span>
                <span className="r4w-menu-text">Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}