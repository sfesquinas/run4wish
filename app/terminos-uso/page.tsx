// app/terminos-uso/page.tsx
"use client";

import Link from "next/link";

export default function TerminosUsoPage() {
  return (
    <main className="r4w-legal-page">
      <div className="r4w-legal-container">
        <div className="r4w-legal-header">
          <Link href="/" className="r4w-legal-back">
            ← Volver
          </Link>
          <h1 className="r4w-legal-title">Términos de Uso</h1>
          <p className="r4w-legal-subtitle">
            Última actualización: {new Date().toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="r4w-legal-content">
          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">1. Aceptación de los términos</h2>
            <p className="r4w-legal-text">
              Al acceder y utilizar Run4Wish, aceptas estos términos de uso. Si no estás de acuerdo 
              con alguna parte de estos términos, no debes utilizar nuestro servicio.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">2. Información de la empresa</h2>
            <p className="r4w-legal-text">
              Run4Wish es operado por:
            </p>
            <ul className="r4w-legal-list">
              <li><strong>Denominación social:</strong> xxxxx</li>
              <li><strong>CIF/NIF:</strong> xxxxx</li>
              <li><strong>Domicilio social:</strong> xxxxx</li>
              <li><strong>Email de contacto:</strong> xxxxx</li>
              <li><strong>Teléfono:</strong> xxxxx</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">3. Descripción del servicio</h2>
            <p className="r4w-legal-text">
              Run4Wish es una plataforma de carreras digitales donde los usuarios participan 
              respondiendo preguntas diarias para avanzar en rankings y competir por premios. 
              El servicio incluye:
            </p>
            <ul className="r4w-legal-list">
              <li>Participación en carreras de diferentes duraciones</li>
              <li>Sistema de wishes (moneda virtual) para participar</li>
              <li>Rankings y clasificaciones</li>
              <li>Premios y recompensas según el tipo de carrera</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">4. Requisitos de edad</h2>
            <p className="r4w-legal-text">
              Run4Wish está dirigido exclusivamente a usuarios mayores de 18 años. Al registrarte, 
              declaras que eres mayor de edad y que tienes capacidad legal para aceptar estos términos.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">5. Registro y cuenta de usuario</h2>
            <p className="r4w-legal-text">
              Para utilizar Run4Wish, debes crear una cuenta proporcionando información veraz y 
              actualizada. Eres responsable de:
            </p>
            <ul className="r4w-legal-list">
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>Notificarnos inmediatamente cualquier uso no autorizado de tu cuenta</li>
              <li>Ser el único responsable de todas las actividades que ocurran bajo tu cuenta</li>
              <li>No compartir tu cuenta con terceros</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">6. Uso aceptable</h2>
            <p className="r4w-legal-text">
              Te comprometes a utilizar Run4Wish de manera legal y ética. Está prohibido:
            </p>
            <ul className="r4w-legal-list">
              <li>Utilizar bots, scripts o cualquier método automatizado para participar</li>
              <li>Intentar manipular el sistema de ranking o resultados</li>
              <li>Compartir respuestas o hacer trampas de cualquier tipo</li>
              <li>Crear múltiples cuentas para obtener ventajas</li>
              <li>Utilizar el servicio para actividades ilegales</li>
              <li>Interferir con el funcionamiento del servicio</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">7. Wishes y moneda virtual</h2>
            <p className="r4w-legal-text">
              Los wishes son una moneda virtual utilizada en Run4Wish para participar en carreras. 
              Importante:
            </p>
            <ul className="r4w-legal-list">
              <li>Los wishes no tienen valor monetario real y no son canjeables por dinero</li>
              <li>No se pueden transferir entre usuarios</li>
              <li>Nos reservamos el derecho de modificar el sistema de wishes en cualquier momento</li>
              <li>En caso de cierre de cuenta, los wishes no utilizados se perderán</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">8. Premios y recompensas</h2>
            <p className="r4w-legal-text">
              Los premios ofrecidos en las carreras están sujetos a disponibilidad y pueden variar. 
              Nos reservamos el derecho de:
            </p>
            <ul className="r4w-legal-list">
              <li>Modificar o cancelar premios sin previo aviso</li>
              <li>Verificar la elegibilidad de los ganadores</li>
              <li>Descalificar a usuarios que no cumplan con estos términos</li>
              <li>Establecer condiciones adicionales para la entrega de premios</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">9. Propiedad intelectual</h2>
            <p className="r4w-legal-text">
              Todo el contenido de Run4Wish, incluyendo diseño, textos, gráficos, logos y software, 
              es propiedad de xxxxx o de sus licenciantes y está protegido por leyes de propiedad 
              intelectual. No puedes copiar, modificar, distribuir o crear obras derivadas sin 
              nuestro consentimiento expreso.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">10. Limitación de responsabilidad</h2>
            <p className="r4w-legal-text">
              Run4Wish se proporciona "tal cual" sin garantías de ningún tipo. No nos hacemos 
              responsables de:
            </p>
            <ul className="r4w-legal-list">
              <li>Interrupciones o fallos en el servicio</li>
              <li>Pérdida de datos o información</li>
              <li>Daños derivados del uso o imposibilidad de uso del servicio</li>
              <li>Decisiones tomadas basándose en la información proporcionada por Run4Wish</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">11. Modificaciones del servicio</h2>
            <p className="r4w-legal-text">
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto 
              de Run4Wish en cualquier momento, con o sin previo aviso. No seremos responsables 
              ante ti ni ante terceros por cualquier modificación, suspensión o discontinuación 
              del servicio.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">12. Terminación</h2>
            <p className="r4w-legal-text">
              Podemos terminar o suspender tu acceso a Run4Wish inmediatamente, sin previo aviso, 
              si violas estos términos de uso. También puedes cerrar tu cuenta en cualquier momento 
              desde la configuración de tu perfil.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">13. Ley aplicable y jurisdicción</h2>
            <p className="r4w-legal-text">
              Estos términos se rigen por la legislación española. Para cualquier controversia 
              derivada de estos términos, las partes se someten a los juzgados y tribunales de 
              xxxxx, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">14. Modificaciones de los términos</h2>
            <p className="r4w-legal-text">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Las modificaciones entrarán en vigor desde su publicación en la aplicación. 
              Te recomendamos revisar periódicamente estos términos. El uso continuado del 
              servicio tras las modificaciones constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">15. Contacto</h2>
            <p className="r4w-legal-text">
              Para cualquier consulta sobre estos términos de uso, puedes contactarnos en:
            </p>
            <ul className="r4w-legal-list">
              <li><strong>Email:</strong> xxxxx</li>
              <li><strong>Dirección postal:</strong> xxxxx</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

