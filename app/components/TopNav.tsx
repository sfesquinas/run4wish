// app/components/TopNav.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../hooks/useUser";

const MENU_ITEMS = [
  { id: "panel", label: "Mi panel", href: "/panel" },
  { id: "carreras", label: "Carreras", href: "/carreras" },
  { id: "pregunta", label: "Pregunta del día", href: "/pregunta" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
  { id: "wishes", label: "Wishes", href: "/wishes" }, // 🔥 vuelve wishes
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
    // cerramos overlay
    setOpen(false);

    // si ya sabemos que NO hay usuario → a registro
    if (isReady && !user) {
      router.push("/registro");
      return;
    }

    router.push(href);
  };

  return (
    <header className="r4w-topbar">
      {/* Botón logo que abre el overlay */}
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
        <span className="r4w-logo-chevron">▾</span>
      </button>

      <div className="r4w-topbar-title">
        RUN<span style={{ color: "#FF7A1A" }}>4</span>WISH
      </div>

      <div style={{ fontSize: 11 }}>
        {user ? `Hola, ${displayName}` : "Invitado"}
      </div>

      {/* OVERLAY MENÚ */}
      {open && (
        <div className="r4w-nav-overlay">
          <div className="r4w-nav-card">
            <div className="r4w-nav-card-title">Menú Run4Wish</div>
            <div className="r4w-nav-card-user">
              {user ? `Hola, ${displayName}` : "Estás navegando como invitado"}
            </div>

            <div className="r4w-nav-card-buttons">
              {MENU_ITEMS.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={[
                      "r4w-nav-btn",
                      active ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleNav(item.href)}
                  >
                    {item.label}
                  </button>
                );
              })}

              <button
                type="button"
                className="r4w-nav-btn r4w-nav-btn-secondary"
                onClick={() => {
                  setOpen(false);
                  router.push("/registro");
                }}
              >
                Registro / acceso
              </button>
            </div>

            <button
              type="button"
              className="r4w-nav-close-btn"
              onClick={() => setOpen(false)}
            >
              Seguir en la carrera ✨
            </button>
          </div>
        </div>
      )}
    </header>
  );
}