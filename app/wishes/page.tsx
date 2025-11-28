"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useUser } from "../hooks/useUser";
import { useWishes } from "../hooks/useWishes";

export default function WishesPage() {
  const router = useRouter();
  const { user, isReady } = useUser() as any;
  const { wishes, addWishes, loading } = useWishes(user?.id ?? null);

  // 🔐 Si no hay usuario, no dejamos entrar
  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <main className="r4w-panel-page">
        <section className="r4w-panel-layout">
          <div className="r4w-panel-main">
            <div className="r4w-panel-hello">Cargando tus wishes…</div>
          </div>
        </section>
      </main>
    );
  }

  const handleAdd = async (amount: number) => {
    try {
      await addWishes(amount);
    } catch (e) {
      console.error(e);
      alert("No se han podido recargar tus wishes. Inténtalo de nuevo.");
    }
  };

  return (
    <main className="r4w-panel-page">
      <section className="r4w-panel-layout">
        <div className="r4w-panel-main">
          <header className="r4w-panel-header">
            <div>
              <h1 className="r4w-panel-title">Tienda de wishes ✨</h1>
              <p className="r4w-panel-tagline">
                Tus wishes son la energía con la que sigues corriendo por tus
                deseos. Cada respuesta consume 1 wish.
              </p>
            </div>

            <div className="r4w-panel-chip r4w-panel-chip-center">
              Wishes actuales: <strong>{wishes}</strong>
            </div>
          </header>

          <div className="r4w-wishes-grid">
            {/* Pack demo gratis (solo MVP) */}
            <div className="r4w-wishes-card">
              <div className="r4w-wishes-label">MVP · demo</div>
              <h2 className="r4w-wishes-title">Recarga rápida · +5 wishes</h2>
              <p className="r4w-wishes-text">
                Úsalo para hacer pruebas mientras construimos la pasarela de
                pago real.
              </p>
              <button
                type="button"
                className="r4w-primary-btn"
                onClick={() => handleAdd(5)}
                disabled={loading}
              >
                Añadir +5 wishes ⚡
              </button>
            </div>

            {/* Pack 10 */}
            <div className="r4w-wishes-card">
              <div className="r4w-wishes-label">Próximamente</div>
              <h2 className="r4w-wishes-title">
                Pack constancia · +10 wishes
              </h2>
              <p className="r4w-wishes-text">
                Ideal para una carrera corta o para recuperar días perdidos.
              </p>
              <button type="button" className="r4w-secondary-btn" disabled>
                Disponible en la siguiente versión
              </button>
            </div>

            {/* Pack 20 */}
            <div className="r4w-wishes-card">
              <div className="r4w-wishes-label">Próximamente</div>
              <h2 className="r4w-wishes-title">Pack maratón · +20 wishes</h2>
              <p className="r4w-wishes-text">
                Para quienes quieren estar en varias carreras a la vez.
              </p>
              <button type="button" className="r4w-secondary-btn" disabled>
                Disponible en la siguiente versión
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 12,
              color: "var(--r4w-text-muted)",
            }}
          >
            🎂 Anotación: en la versión siguiente, si tu cumpleaños coincide con
            una carrera activa, te regalaremos un bonus de wishes extra.
          </div>

          <div style={{ marginTop: 16 }}>
            <Link href="/panel" className="r4w-secondary-btn">
              Volver a mi panel <span>📊</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}