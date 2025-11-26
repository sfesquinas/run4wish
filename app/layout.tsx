// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "./components/TopNav";

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
          <TopNav />
        </header>

        {/* CONTENIDO */}
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