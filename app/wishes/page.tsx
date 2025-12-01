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
    <main className="r4w-wishes-page">
      <section className="r4w-wishes-layout">
        <header className="r4w-wishes-header">
          <div>
            <h1 className="r4w-wishes-title-main">Tienda de wishes ✨</h1>
            <p className="r4w-wishes-subtitle">Recarga tus wishes y sigue compitiendo</p>
          </div>

          <div className="r4w-wishes-chip">
            <span className="r4w-wishes-chip-icon">🔮</span>
            <span>Wishes: <strong>{wishes}</strong></span>
          </div>
        </header>

        <div className="r4w-wishes-grid">
          {/* Pack demo gratis (solo MVP) */}
          <div className="r4w-wishes-card r4w-wishes-card-active">
            <div className="r4w-wishes-card-glow"></div>
            <div className="r4w-wishes-label">MVP · demo</div>
            <div className="r4w-wishes-icon">✨</div>
            <h2 className="r4w-wishes-card-title">+5 wishes</h2>
            <button
              type="button"
              className="r4w-primary-btn r4w-wishes-btn"
              onClick={() => handleAdd(5)}
              disabled={loading}
            >
              Añadir ⚡
            </button>
          </div>

          {/* Pack 10 */}
          <div className="r4w-wishes-card r4w-wishes-card-disabled">
            <div className="r4w-wishes-label">Próximamente</div>
            <div className="r4w-wishes-icon">🔒</div>
            <h2 className="r4w-wishes-card-title">+10 wishes</h2>
            <button type="button" className="r4w-secondary-btn r4w-wishes-btn" disabled>
              Próximamente
            </button>
          </div>

          {/* Pack 20 */}
          <div className="r4w-wishes-card r4w-wishes-card-disabled">
            <div className="r4w-wishes-label">Próximamente</div>
            <div className="r4w-wishes-icon">🔒</div>
            <h2 className="r4w-wishes-card-title">+20 wishes</h2>
            <button type="button" className="r4w-secondary-btn r4w-wishes-btn" disabled>
              Próximamente
            </button>
          </div>
        </div>

        <div className="r4w-wishes-nav">
          <Link href="/carreras" className="r4w-wishes-nav-btn">
            <span className="r4w-wishes-nav-icon">🏁</span>
            <span>Carreras</span>
          </Link>
          <Link href="/ranking" className="r4w-wishes-nav-btn">
            <span className="r4w-wishes-nav-icon">📈</span>
            <span>Estadística</span>
          </Link>
          <Link href="/panel" className="r4w-wishes-nav-btn">
            <span className="r4w-wishes-nav-icon">📊</span>
            <span>Mi panel</span>
          </Link>
        </div>
      </section>
    </main>
  );
}