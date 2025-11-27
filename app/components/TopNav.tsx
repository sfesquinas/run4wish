// app/components/TopNav.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../hooks/useUser";

const MENU_ITEMS = [
  { id: "carreras", label: "Carreras", href: "/carreras" },
  { id: "panel", label: "Mi panel", href: "/panel" },
  { id: "pregunta", label: "Pregunta del día", href: "/pregunta" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
  { id: "perfil", label: "Perfil", href: "/perfil" },
];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useUser() as any;

  const handleNav = (href: string) => {
    setOpen(false);

    // 🧠 Solo forzamos /registro cuando YA sabemos que no hay usuario
    if (isReady && !user) {
      router.push("/registro");
      return;
    }

    // Si aún está cargando o ya hay usuario, navegamos normal
    router.push(href);
  };

  const displayName =
    user?.username_game ?? user?.username ?? user?.email ?? "Runner";

  return (
    <header className="r4w-topbar">
      {/* Botón/logo + desplegable */}
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

      <div className="r4w-topbar-title">
        RUN<span style={{ color: "#FF7A1A" }}>4</span>WISH
      </div>

      <div style={{ fontSize: 11 }}>
        {user ? `Hola, ${displayName}` : "Invitado"}
      </div>

      {open && (
        <div className="r4w-nav-dropdown">
          {MENU_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <button
                key={item.id}
                type="button"
                className={["r4w-nav-item", active ? "active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleNav(item.href)}
              >
                {item.label}
              </button>
            );
          })}

          {/* Opción específica para registro/acceso */}
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