"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../hooks/useUser";

const MENU_ITEMS = [
  { id: "panel", label: "Mi panel", href: "/panel" },
  { id: "carreras", label: "Carreras", href: "/carreras" },
  { id: "pregunta", label: "Pregunta del día", href: "/pregunta" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
  { id: "wishes", label: "Comprar wishes", href: "/wishes" },
  { id: "perfil", label: "Perfil", href: "/perfil" },
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useUser() as any;

  const displayName =
    user?.username_game ?? user?.username ?? user?.email ?? "Runner";

  const handleNav = (href: string) => {
    setOpen(false);

    // si no está logueado → registro
    if (!isReady || !user) {
      router.push("/registro");
      return;
    }

    router.push(href);
  };

  return (
    <header className="r4w-topbar">
      {/* LOGO + DESPLEGABLE */}
      <button
        type="button"
        className="r4w-logo-btn"
        onClick={() => setOpen((v) => !v)}
      >
        <img
          src="/r4w-icon.png"
          alt="Run4Wish"
          className="r4w-logo-img"
        />
        <span className="r4w-logo-chevron">▾</span>
      </button>

      {/* TÍTULO + HOLA */}
      <div>
        <div className="r4w-topbar-title">
          RUN<span style={{ color: "var(--r4w-orange)" }}>4</span>WISH
        </div>
        {isReady && user && (
          <div className="r4w-topbar-subtitle">Hola, {displayName}</div>
        )}
      </div>

      {/* espaciador derecha */}
      <div style={{ width: 32 }} />

      {/* MENÚ DESPLEGABLE */}
      {open && (
        <div className="r4w-nav-dropdown">
          {MENU_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <button
                key={item.id}
                type="button"
                className={
                  "r4w-nav-item" + (active ? " active" : "")
                }
                onClick={() => handleNav(item.href)}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            className="r4w-nav-item"
            onClick={() => {
              setOpen(false);
              router.push("/registro");
            }}
          >
            Registro / acceso
          </button>
        </div>
      )}
    </header>
  );
}