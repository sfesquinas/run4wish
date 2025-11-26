// app/wishes/page.tsx
"use client";

import Link from "next/link";
import { useWishes } from "../hooks/useWishes";

const PACKS = [
  { id: "p1", amount: 1, label: "+1 wish", note: "Un intento extra" },
  { id: "p3", amount: 3, label: "+3 wishes", note: "Para días intensos" },
  { id: "p5", amount: 5, label: "+5 wishes", note: "Modo constancia total" },
];

export default function WishesPage() {
  const { wishes, setWishes, resetWishes } = useWishes();

  const handleAdd = (amount: number) => {
    setWishes((prev) => prev + amount);
    alert(
      `Demo: has añadido ${amount} wish(es). En la versión real aquí iría el pago.`
    );
  };

  return (
    <main className="r4w-wishes-page">
      <section className="r4w-wishes-layout">
        <header className="r4w-wishes-header">
          <div>
            <div className="r4w-question-label">tienda demo de wishes</div>
            <h1 className="r4w-wishes-title">Recarga tus wishes</h1>
            <p className="r4w-wishes-subtitle">
              En la versión completa podrás comprar wishes con dinero real o
              conseguirlos gracias a tus acciones en la app. Aquí solo estamos
              simulando el comportamiento.
            </p>
          </div>

          <div className="r4w-panel-chip">Wishes actuales: {wishes}</div>
        </header>

        <div className="r4w-wishes-grid">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              className="r4w-wish-pack"
              onClick={() => handleAdd(pack.amount)}
            >
              <div className="r4w-wish-pack-main">{pack.label}</div>
              <div className="r4w-wish-pack-note">{pack.note}</div>
            </button>
          ))}
        </div>

        <div className="r4w-wishes-footer">
          <button
            type="button"
            className="r4w-secondary-btn"
            onClick={resetWishes}
          >
            Reset demo a valor inicial
            <span>🔄</span>
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/pregunta" className="r4w-secondary-btn">
              Volver a la pregunta
              <span>❓</span>
            </Link>
            <Link href="/panel" className="r4w-secondary-btn">
              Ir a mi panel
              <span>📊</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}