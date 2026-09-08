/* ==========================================================================
   Feature: configuración — el apartado que se abre con el engranaje. Todo lo
   que no se usa a diario vive aquí: crear y editar objetivos, plantillas,
   cuota, modo, sonido y copias de seguridad. La pantalla del día solo sirve
   para marcar progreso.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

export const elConfiguracion = {
  panel: $('#configuracion'),
  abrir: $('#btn-configuracion'),
  cerrar: $('#btn-cerrar-config'),
  lista: $('#lista-objetivos'),
};

export function abrirConfiguracion() {
  elConfiguracion.panel.hidden = false;
  document.body.classList.add('sin-scroll');
  elConfiguracion.panel.querySelector('.configuracion__cuerpo').scrollTop = 0;
  elConfiguracion.cerrar.focus();
}

export function cerrarConfiguracion() {
  elConfiguracion.panel.hidden = true;
  document.body.classList.remove('sin-scroll');
  elConfiguracion.abrir.focus();
}

export const configuracionAbierta = () => !elConfiguracion.panel.hidden;
