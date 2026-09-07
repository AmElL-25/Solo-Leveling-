/* ==========================================================================
   Feature: ajustes — referencias del DOM para preferencias y copias de
   seguridad. Qué hacer con cada acción (exportar, restaurar, reiniciar) lo
   decide app.js, la raíz de composición: aquí solo vive el pintado.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

export const elAjustes = {
  sonido: $('#ajuste-sonido'),
  animaciones: $('#ajuste-animaciones'),
  sobrio: $('#ajuste-sobrio'),
  cuotaObjetivo: $('#ajuste-cuota'),
  cuotaMoneda: $('#ajuste-moneda'),
  btnExportar: $('#btn-exportar'),
  btnImportar: $('#btn-importar'),
  archivoImportar: $('#archivo-importar'),
  btnReiniciar: $('#btn-reiniciar'),
};

export function renderAjustes(estado) {
  elAjustes.sonido.checked = estado.ajustes.sonido;
  elAjustes.animaciones.checked = estado.ajustes.animaciones;
  elAjustes.sobrio.checked = estado.ajustes.tema === 'sobrio';
  // Solo se reescriben si el jugador no los está editando en ese momento.
  if (document.activeElement !== elAjustes.cuotaObjetivo) {
    elAjustes.cuotaObjetivo.value = estado.cuota.objetivo || '';
  }
  if (document.activeElement !== elAjustes.cuotaMoneda) {
    elAjustes.cuotaMoneda.value = estado.cuota.moneda;
  }
}
