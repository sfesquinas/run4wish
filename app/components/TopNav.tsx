// app/components/TopNav.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";

export default function TopNav() {
  const { user, logout } = useUser() as any;
  const { wishes } = useWishes() as any;
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName =
    user?.username_game ?? user?.email ?? "Runner";

  return (
    <>
      {/* TOPBAR FIJA */}
      <div className="r4w-topnav">
        <div className="r4w-topnav-inner">
          {/* Logo + marca (abre el menú) */}
          <button
            type="button"
            className="r4w-topnav-brand"
            onClick={() => setMenuOpen(true)}
          >
            <div className="r4w-topnav-logo">
              <Image
                src="/r4w-icon.png"
                alt="Run4Wish"
                width={32}
                height={32}
              />
            </div>
            <div className="r4w-topnav-text">
              RUN<span className="r4w-topnav-4">4</span>WISH
            </div>
            <span className="r4w-topnav-caret">▾</span>
          </button>

         

        {/* Parte derecha: usuario + wishes (SIEMPRE del mismo contexto) */}
        <div className="r4w-topnav-right">
          <div className="r4w-topnav-user">
            Hola,&nbsp;
            <span className="r4w-topnav-user-name">{displayName}</span>
          </div>
          <div className="r4w-topnav-wishes">
            Wishes:&nbsp;<span>{wishes ?? 0}</span>
          </div>
        </div>
      </div>
    </div >

      {/* OVERLAY MENÚ PRINCIPAL */ }
  {
    menuOpen && (
      <div className="r4w-menu-overlay">
        <div className="r4w-menu-card">
          <div className="r4w-menu-header">
            <span>Menú Run4Wish</span>
            <button
              type="button"
              className="r4w-menu-close"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="r4w-menu-list">
            <Link
              href="/panel"
              className="r4w-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              Mi panel
            </Link>

            <Link
              href="/carreras"
              className="r4w-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              Carreras
            </Link>

            <Link
              href="/pregunta"
              className="r4w-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              Pregunta del día
            </Link>

            <Link
              href="/ranking"
              className="r4w-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              Ranking
            </Link>

            <Link
              href="/wishes"
              className="r4w-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              Tienda de wishes
            </Link>

            <button
              type="button"
              className="r4w-menu-item r4w-menu-item-logout"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              Cerrar sesión <span>🔒</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
    </>
  );
}