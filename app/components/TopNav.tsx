// app/components/TopNav.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../hooks/useUser";

const MENU_ITEMS = [
  { id: "panel", label: "Mi panel", href: "/panel" },
  { id: "carreras", label: "Carreras", href: "/carreras" },
  { id: "pregunta", label: "Pregunta del día", href: "/pregunta" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
  { id: "wishes", label: "Tienda de wishes", href: "/wishes" },
];

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady, wishes, logout } = useUser() as any;
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName =
    user?.username_game ?? user?.username ?? user?.email ?? "Runner";

  const handleNav = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    if (logout) logout();
  };

  return (
    <>
      {/* TOPBAR */}
      <header className="r4w-topbar">
        <div className="r4w-topbar-inner">
          {/* Botón logo + menú */}
          <button
            type="button"
            className="r4w-logo-btn"
            onClick={() => setMenuOpen(true)}
          >
            <Image
              src="/r4w-icon.png"
              alt="Run4Wish"
              width={32}
              height={32}
              className="r4w-logo-img r4w-logo-pulse"
            />
            <span className="r4w-logo-chevron">▾</span>
          </button>

          {/* Título RUN4WISH con el 4 en naranja */}
          <div className="r4w-topbar-title">
            RUN<span className="r4w-topbar-title-4">4</span>WISH
          </div>

          {/* Bloque usuario a la derecha */}
          <div className="r4w-topbar-user">
            {isReady && user ? (
              <>
                <div className="r4w-topbar-user-name">Hola, {displayName}</div>
                <div className="r4w-topbar-user-meta">
                  <span>Wishes: {wishes ?? 0}</span>
                  <button
                    type="button"
                    className="r4w-topbar-user-logout"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="r4w-topbar-user-login"
                onClick={() => router.push("/registro")}
              >
                Accede / Regístrate
              </button>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY DE MENÚ */}
      {menuOpen && (
        <div className="r4w-nav-overlay">
          <div className="r4w-nav-card">
            <div className="r4w-nav-header">
              <span className="r4w-nav-title">Menú Run4Wish</span>
              <button
                type="button"
                className="r4w-nav-close"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="r4w-nav-list">
              {MENU_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`r4w-nav-button ${active ? "active" : ""}`}
                    onClick={() => handleNav(item.href)}
                  >
                    {item.label}
                  </button>
                );
              })}

              {user && (
                <button
                  type="button"
                  className="r4w-nav-button r4w-nav-logout"
                  onClick={handleLogout}
                >
                  Cerrar sesión 🔒
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}