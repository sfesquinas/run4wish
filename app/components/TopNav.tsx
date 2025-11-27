// app/components/TopNav.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../hooks/useUser";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "panel", label: "Mi panel", href: "/panel", icon: "📊" },
  { id: "carreras", label: "Carreras", href: "/carreras", icon: "🏁" },
  { id: "pregunta", label: "Pregunta del día", href: "/pregunta", icon: "❓" },
  { id: "ranking", label: "Ranking", href: "/ranking", icon: "📈" },
  { id: "wishes", label: "Wishes", href: "/wishes", icon: "💫" },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: "👤" },
  { id: "registro", label: "Registro / acceso", href: "/registro", icon: "🔐" },
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 👇 Cast a any para que no se queje por username_game / username
  const { user, isReady } = useUser() as any;

  const displayName =
    user?.username_game ?? user?.username ?? user?.email ?? "Runner";

  const handleNav = (href: string) => {
    setOpen(false);

    // Solo redirigimos a registro si ya sabemos que NO hay usuario
    if (isReady && !user && href !== "/registro") {
      router.push("/registro");
      return;
    }

    router.push(href);
  };

  return (
    <>
      {/* TOPBAR FIJA */}
      <header className="r4w-topbar">
        <div className="r4w-topbar-inner">
          {/* Botón logo → overlay */}
          <button
            type="button"
            className="r4w-logo-btn"
            onClick={() => setOpen(true)}
          >
            <img
              src="/r4w-icon.png"
              alt="Run4Wish"
              className="r4w-logo-img"
            />
          </button>

          {/* RUN4WISH con 4 naranja */}
          <div className="r4w-topbar-title">
            <span className="r4w-topbar-run">RUN</span>
            <span className="r4w-topbar-four">4</span>
            <span className="r4w-topbar-wish">WISH</span>
          </div>

          {/* saludo derecha */}
          <div className="r4w-topbar-right">
            {user && (
              <span className="r4w-topbar-hello">Hola, {displayName}</span>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY DE NAVEGACIÓN */}
      {open && (
        <div
          className="r4w-nav-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            className="r4w-nav-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="r4w-nav-sheet-header">
              <div className="r4w-nav-sheet-title">Elige dónde ir</div>
              {user ? (
                <div className="r4w-nav-sheet-sub">
                  Estás conectado como <strong>{displayName}</strong>
                </div>
              ) : (
                <div className="r4w-nav-sheet-sub">
                  Crea tu acceso para guardar tu posición en las carreras.
                </div>
              )}
            </div>

            <div className="r4w-nav-sheet-buttons">
              {NAV_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      "r4w-nav-sheet-btn" + (active ? " active" : "")
                    }
                    onClick={() => handleNav(item.href)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="r4w-nav-sheet-close"
              onClick={() => setOpen(false)}
            >
              Cerrar menú ✨
            </button>
          </div>
        </div>
      )}
    </>
  );
}