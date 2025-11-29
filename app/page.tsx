"use client";

import Link from "next/link";
import { useUser } from "./hooks/useUser";

export default function HomePage() {
  const { user, isReady } = useUser();

if (!isReady) {
  return (
    <main className="r4w-home-page">
      <section className="r4w-home-hero">
        <p className="r4w-home-subtitle">Cargando Run4Wish…</p>
      </section>
    </main>
  );
}
  // Si no hay usuario, solo mostrar opciones de login/registro
  if (!user) {
    return (
      <main className="r4w-home">
        <section className="r4w-home-card">
          <div className="r4w-home-left">
            <div className="r4w-home-ctas">
              <Link href="/login" className="r4w-primary-btn">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="r4w-secondary-btn">
                Crear mi acceso
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Si hay usuario, mostrar contenido completo
  return (
    <main className="r4w-home">
      <section className="r4w-home-card">
        <div className="r4w-home-left">
          <div className="r4w-home-badge">MVP · demo</div>
          <h1 className="r4w-home-title">Corre por tus deseos</h1>

          <p className="r4w-home-subtitle">
            Run4Wish es una carrera digital donde la constancia pesa más que la
            suerte. Responde una pregunta al día y sube posiciones para acercarte
            al premio.
          </p>

          <div className="r4w-home-ctas">
            <Link href="/panel" className="r4w-primary-btn">
              Ir a mi panel
            </Link>
          </div>

          <div className="r4w-home-actions">
            <Link href="/carreras" className="r4w-primary-btn">
              Ver carreras activas
              <span>🏁</span>
            </Link>

            <Link href="/panel" className="r4w-secondary-btn">
              Ir a mi panel
              <span>📊</span>
            </Link>
          </div>

          <p className="r4w-home-note">
            Esta es una versión de prueba. Más adelante podrás elegir entre
            diferentes carreras, premios y modos de juego.
          </p>
        </div>

        <aside className="r4w-home-right">
          <div className="r4w-home-mini-card">
            <div className="r4w-home-mini-label">Carrera demo</div>
            <div className="r4w-home-mini-title">Carrera 7 días · MVP</div>
            <div className="r4w-home-mini-row">
              <span>1 pregunta al día</span>
              <span>100 participantes</span>
            </div>
            <div className="r4w-home-mini-row">
              <span>Ventana</span>
              <span>09:00 · 00:00</span>
            </div>

            <Link href="/carrera/r7" className="r4w-primary-btn" style={{ marginTop: 12 }}>
              Entrar en la carrera demo
              <span>➜</span>
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}