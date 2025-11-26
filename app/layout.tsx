// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Run4Wish",
  description: "Corre por tus sueños, la constancia es la meta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* TOPBAR GLOBAL */}
        <header className="r4w-topbar">
          <div className="r4w-topbar-inner">
            <div className="r4w-topbar-left">
              <div className="r4w-topbar-logo">R4W · Run4Wish</div>
              <div className="r4w-topbar-pill">MVP</div>
            </div>

            <nav className="r4w-topbar-nav">
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
            </nav>
          </div>
        </header>

        {/* CONTENIDO CENTRADO */}
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "var(--r4w-bg)",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
