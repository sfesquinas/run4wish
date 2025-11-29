// app/components/TopNav.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";

export default function TopNav() {
  const router = useRouter();
  const { user, isReady, logout } = useUser() as any;
  const { wishes } = useWishes(user?.id ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName =
    user?.username_game || user?.username || user?.email || "Runner";
  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };
  const baseName =
    (user as any)?.username_game ??
    (user as any)?.username ??
    (user as any)?.displayName ??
    (user as any)?.email ??
    "Runner";

  const headerName = `${baseName} ✨`;

  return (
    <header className="r4w-topbar">
      <div className="r4w-topnav">
        <div className="r4w-topnav-inner">
          {/* Logo / brand: siempre lleva a la home */}
          <button
            type="button"
            className="r4w-topnav-brand"
            onClick={() => router.push("/")}
          >
            <div className="r4w-topnav-logo">
              {/* Usa la misma ruta de icono que ya tenías */}
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

          {/* Zona derecha: usuario o login/registro */}
          <div className="r4w-topnav-right">
            {user ? (
              <>
                <div className="r4w-topnav-user">
                  Hola,&nbsp;
                  <span className="r4w-topnav-user-name">{displayName}</span>
                </div>
                <div className="r4w-topnav-wishes">
                  Wishes:&nbsp;<span>{wishes}</span>
                </div>

                {/* Botón que abre el menú */}
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="r4w-menu-trigger"
                >
                  ▾
                </button>
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