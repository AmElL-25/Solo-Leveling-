/* ==========================================================================
   Feature: ajustes — referencias del DOM para preferencias y copias de
   seguridad. Qué hacer con cada acción (exportar, restaurar, reiniciar) lo
   decide app.js, la raíz de composición: aquí solo vive el pintado.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

export const elAjustes = {
  sonido: $('#ajuste-sonido'),
  animaciones: $('#ajuste-animaciones'),
  btnExportar: $('#btn-exportar'),
  btnImportar: $('#btn-importar'),
  archivoImportar: $('#archivo-importar'),
  btnReiniciar: $('#btn-reiniciar'),
};

export function renderAjustes(ajustes) {
  elAjustes.sonido.checked = ajustes.sonido;
  elAjustes.animaciones.checked = ajustes.animaciones;
}
