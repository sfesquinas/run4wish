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
  const { user, isReady } = useUser();

  const handleNav = (href: string) => {
    setOpen(false);

    // 🔒 Si no está logueado → a registro
    if (!isReady || !user) {
      router.push("/registro");
      return;
    }

    router.push(href);
  };

  return (
    <header className="r4w-topbar">
      {/* Logo / botón menú */}
      <button
        type="button"
        className="r4w-logo-btn"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="r4w-logo-mark">R4W</span>
      </button>

      <div className="r4w-topbar-title">Run4Wish</div>

      {/* Espaciador a la derecha */}
      <div style={{ width: 32 }} />

      {/* Dropdown */}
      {open && (
        <div className="r4w-nav-dropdown">
          {MENU_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <button
                key={item.id}
                type="button"
                className={[
                  "r4w-nav-item",
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