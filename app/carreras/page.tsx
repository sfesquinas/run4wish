// app/carreras/page.tsx

const upcomingRaces = [
    {
      id: "24h",
      name: "Sprint 24h",
      duration: "24 horas",
      type: "Carrera 1 día",
      reward: "Insignias exclusivas + Wishes",
      tag: "Muy pronto",
    },
    {
      id: "7d",
      name: "Reto 7 días",
      duration: "7 días",
      type: "Constancia diaria",
      reward: "Experiencia sensorial",
      tag: "Muy pronto",
    },
    {
      id: "30d",
      name: "Desafío 30 días",
      duration: "30 días",
      type: "Racha larga",
      reward: "Smartphone última generación",
      tag: "Muy pronto",
    },
  ];
  
  export default function CarrerasPage() {
    return (
      <main className="r4w-races-page">
        <div className="r4w-races-layout">
          {/* COLUMNA IZQUIERDA: CARRERA ACTIVA */}
          <section className="r4w-races-column">
            <header className="r4w-races-header">
              <div>
                <h1 className="r4w-section-title">Tu carrera activa</h1>
                <p className="r4w-section-subtitle">
                  Empezamos con el MVP: una carrera de 7 días para probar la
                  mecánica.
                </p>
              </div>
              <div className="r4w-pill">Activa</div>
            </header>
  
            <article className="r4w-race-card">
              <div>
                <div className="r4w-race-name">
                  R4W · Carrera 7 días (versión prueba)
                </div>
                <div className="r4w-race-meta">
                  <span>
                    <span className="r4w-dot" />
                    1 pregunta al día
                  </span>
                  <span>Duración: 7 días</span>
                  <span>Modo: constancia &amp; velocidad</span>
                </div>
              </div>
  
              <div className="r4w-race-reward">
                🎁 Premio: se definirá para la primera carrera oficial.
              </div>
  
              <div className="r4w-race-footer">
                <span>
                  Responde cada día entre las 9:00 y las 00:00.  
                  La constancia es la meta.
                </span>
                <button className="r4w-secondary-btn">
                  Entrar en la carrera
                  <span>➜</span>
                </button>
              </div>
            </article>
          </section>
  
          {/* COLUMNA DERECHA: PRÓXIMAS CARRERAS */}
          <section className="r4w-races-column">
            <header className="r4w-races-header">
              <div>
                <h2 className="r4w-section-title">Próximas carreras</h2>
                <p className="r4w-section-subtitle">
                  Aquí listamos las próximas versiones: 24h, 7 días y 30 días.
                </p>
              </div>
            </header>
  
            <div className="r4w-upcoming-list">
              {upcomingRaces.map((race) => (
                <article key={race.id} className="r4w-race-card">
                  <div className="r4w-race-meta">
                    <span className="r4w-upcoming-pill">{race.tag}</span>
                  </div>
                  <div className="r4w-race-name">{race.name}</div>
                  <div className="r4w-race-meta">
                    <span>
                      <span className="r4w-dot" />
                      {race.type}
                    </span>
                    <span>Duración: {race.duration}</span>
                  </div>
                  <div className="r4w-race-reward">🎁 {race.reward}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }