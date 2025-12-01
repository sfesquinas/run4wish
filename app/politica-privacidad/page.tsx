// app/politica-privacidad/page.tsx
"use client";

import Link from "next/link";

export default function PoliticaPrivacidadPage() {
  return (
    <main className="r4w-legal-page">
      <div className="r4w-legal-container">
        <div className="r4w-legal-header">
          <Link href="/" className="r4w-legal-back">
            ← Volver
          </Link>
          <h1 className="r4w-legal-title">Política de Privacidad</h1>
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
            <h2 className="r4w-legal-section-title">1. Responsable del tratamiento</h2>
            <p className="r4w-legal-text">
              El responsable del tratamiento de tus datos personales es:
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
            <h2 className="r4w-legal-section-title">2. Datos que recopilamos</h2>
            <p className="r4w-legal-text">
              En Run4Wish recopilamos los siguientes datos personales:
            </p>
            <ul className="r4w-legal-list">
              <li><strong>Datos de registro:</strong> nombre de usuario, email, fecha de nacimiento</li>
              <li><strong>Datos de perfil:</strong> país, preferencias de sonido y vibración, avatar seleccionado</li>
              <li><strong>Datos de uso:</strong> respuestas a preguntas, progreso en carreras, wishes utilizados</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador utilizado</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">3. Finalidad del tratamiento</h2>
            <p className="r4w-legal-text">
              Utilizamos tus datos personales para:
            </p>
            <ul className="r4w-legal-list">
              <li>Gestionar tu cuenta y permitirte participar en las carreras</li>
              <li>Procesar tus respuestas y calcular tu posición en el ranking</li>
              <li>Enviarte notificaciones relacionadas con el juego (si las activas)</li>
              <li>Mejorar nuestros servicios y la experiencia de usuario</li>
              <li>Cumplir con obligaciones legales aplicables</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">4. Base legal</h2>
            <p className="r4w-legal-text">
              El tratamiento de tus datos se basa en:
            </p>
            <ul className="r4w-legal-list">
              <li><strong>Consentimiento:</strong> cuando te registras y aceptas esta política</li>
              <li><strong>Ejecución contractual:</strong> para proporcionarte el servicio de Run4Wish</li>
              <li><strong>Interés legítimo:</strong> para mejorar nuestros servicios y prevenir fraudes</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">5. Conservación de datos</h2>
            <p className="r4w-legal-text">
              Conservaremos tus datos personales mientras mantengas tu cuenta activa en Run4Wish. 
              Si eliminas tu cuenta, procederemos a eliminar tus datos personales en un plazo máximo 
              de 30 días, salvo que exista una obligación legal que requiera su conservación.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">6. Compartir datos con terceros</h2>
            <p className="r4w-legal-text">
              No compartimos tus datos personales con terceros, excepto en los siguientes casos:
            </p>
            <ul className="r4w-legal-list">
              <li>Proveedores de servicios técnicos (hosting, bases de datos) que actúan como encargados del tratamiento</li>
              <li>Cuando sea requerido por ley o por orden judicial</li>
              <li>En caso de transferencia de negocio, previa notificación a los usuarios</li>
            </ul>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">7. Tus derechos</h2>
            <p className="r4w-legal-text">
              Tienes derecho a:
            </p>
            <ul className="r4w-legal-list">
              <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
              <li><strong>Limitación:</strong> solicitar la limitación del tratamiento</li>
            </ul>
            <p className="r4w-legal-text" style={{ marginTop: 12 }}>
              Para ejercer estos derechos, puedes contactarnos en: <strong>xxxxx</strong>
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">8. Seguridad</h2>
            <p className="r4w-legal-text">
              Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos 
              personales contra el acceso no autorizado, la pérdida, destrucción o alteración. 
              Sin embargo, ningún sistema es 100% seguro, por lo que no podemos garantizar 
              una seguridad absoluta.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">9. Cookies y tecnologías similares</h2>
            <p className="r4w-legal-text">
              Run4Wish utiliza cookies y tecnologías similares para mejorar tu experiencia. 
              Puedes gestionar tus preferencias de cookies desde la configuración de tu navegador.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">10. Menores de edad</h2>
            <p className="r4w-legal-text">
              Run4Wish está dirigido a usuarios mayores de 18 años. No recopilamos intencionalmente 
              datos de menores de edad. Si descubrimos que hemos recopilado datos de un menor, 
              procederemos a eliminarlos inmediatamente.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">11. Cambios en esta política</h2>
            <p className="r4w-legal-text">
              Nos reservamos el derecho de modificar esta política de privacidad. Te notificaremos 
              cualquier cambio significativo mediante un aviso en la aplicación o por email. 
              La fecha de la última actualización se indica al inicio de este documento.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">12. Autoridad de control</h2>
            <p className="r4w-legal-text">
              Si consideras que el tratamiento de tus datos personales no se ajusta a la normativa 
              vigente, tienes derecho a presentar una reclamación ante la Agencia Española de 
              Protección de Datos (AEPD) en <strong>www.aepd.es</strong>.
            </p>
          </section>

          <section className="r4w-legal-section">
            <h2 className="r4w-legal-section-title">13. Contacto</h2>
            <p className="r4w-legal-text">
              Para cualquier consulta relacionada con esta política de privacidad o el tratamiento 
              de tus datos personales, puedes contactarnos en:
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


