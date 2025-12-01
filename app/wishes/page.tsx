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

  // 🔐 Si no hay usuario, no dejamos entrar.
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
            </div>

            <div className="r4w-panel-chip r4w-panel-chip-center">
              Wishes: <strong>{wishes}</strong>
            </div>
          </header>

          <div className="r4w-wishes-grid">
            {/* Pack demo gratis (solo MVP) */}
            <div className="r4w-wishes-card">
              <div className="r4w-wishes-label">MVP · demo</div>
              <h2 className="r4w-wishes-title">+5 wishes</h2>
              <button
                type="button"
                className="r4w-primary-btn"
                onClick={() => handleAdd(5)}
                disabled={loading}
              >
                Añadir ⚡
              </button>
            </div>

            {/* Pack 10 */}
            <div className="r4w-wishes-card">
              <div className="r4w-wishes-label">Próximamente</div>
              <h2 className="r4w-wishes-title">+10 wishes</h2>
              <button type="button" className="r4w-secondary-btn" disabled>
                Próximamente
              </button>
            </div>

            {/* Pack 20 */}
            <div className="r4w-wishes-card">
              <div className="r4w-wishes-label">Próximamente</div>
              <h2 className="r4w-wishes-title">+20 wishes</h2>
              <button type="button" className="r4w-secondary-btn" disabled>
                Próximamente
              </button>
            </div>
          </div>

          <div className="r4w-wishes-nav" style={{ display: "flex", gap: 8, width: "100%" }}>
            <Link href="/carreras" className="r4w-secondary-btn" style={{ flex: 1 }}>
              Carreras
              <span>🏁</span>
            </Link>
            <Link href="/ranking" className="r4w-secondary-btn" style={{ flex: 1 }}>
              Estadística
              <span>📈</span>
            </Link>
            <Link href="/panel" className="r4w-secondary-btn" style={{ flex: 1 }}>
              Mi panel
              <span>📊</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}