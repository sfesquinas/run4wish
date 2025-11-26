// app/components/R4WTopbar.tsx
"use client";

import Link from "next/link";
import { useWishes } from "../hooks/useWishes";
import { useUser } from "../hooks/useUser";

export function R4WTopbar() {
  const { wishes } = useWishes();
  const { user } = useUser();

  const shortEmail =
    user?.email && user.email.length > 18
      ? user.email.slice(0, 18) + "…"
      : user?.email;

  return (
    <div className="r4w-topbar-inner">
      <div className="r4w-topbar-left">
        <div className="r4w-topbar-logo">R4W · Run4Wish</div>
        <div className="r4w-topbar-pill">MVP</div>
      </div>

      <nav className="r4w-topbar-nav">
        <Link href="/" className="r4w-topbar-link">
          Home
        </Link>
        <Link href="/carreras" className="r4w-topbar-link">
          Carreras
        </Link>
        <Link href="/panel" className="r4w-topbar-link">
          Panel
        </Link>
        <Link href="/ranking" className="r4w-topbar-link">
          Ranking
        </Link>
        <Link href="/perfil" className="r4w-topbar-link">
          Perfil
        </Link>
        <Link href="/wishes" className="r4w-topbar-link">
          Wishes
        </Link>

        <div className="r4w-topbar-wishes-pill">
          Wishes: <span>{wishes}</span>
        </div>

        {user ? (
          <span
            style={{
              fontSize: 11,
              marginLeft: 6,
              opacity: 0.8,
            }}
          >
            {shortEmail}
          </span>
        ) : (
          <Link href="/registro" className="r4w-topbar-link">
            Registrarme
          </Link>
        )}
      </nav>
    </div>
  );
}