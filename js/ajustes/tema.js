/* ==========================================================================
   Feature: ajustes — aspecto. El modo sobrio deja la misma app con ropa de
   oficina: paleta apagada, sin resplandores y con otro nombre en la cabecera.
   Los datos y las reglas no cambian.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

const TEXTOS = {
  sistema: {
    titulo: 'EL SISTEMA',
    lema: 'Solo el que cumple, asciende.',
    subtitulo: 'Preparación para convertirse en un guerrero',
  },
  sobrio: {
    titulo: 'PANEL',
    lema: 'Actividad diaria y resultados.',
    subtitulo: 'Objetivos del día',
  },
};

export function aplicarTema(ajustes) {
  const tema = ajustes.tema === 'sobrio' ? 'sobrio' : 'sistema';
  document.body.dataset.tema = tema;
  $('#titulo-app').textContent = TEXTOS[tema].titulo;
  $('#lema-app').textContent = TEXTOS[tema].lema;
  $('#subtitulo-mision').textContent = TEXTOS[tema].subtitulo;
}
