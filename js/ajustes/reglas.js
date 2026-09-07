/* ==========================================================================
   Feature: ajustes. Preferencias del jugador: sonido, efecto de máquina de
   escribir y aspecto de la app.
   ========================================================================== */

export const TEMAS = ['sistema', 'sobrio'];

export function estadoInicialAjustes() {
  return { sonido: true, animaciones: true, tema: 'sistema' };
}

export function normalizarAjustes(ajustes) {
  return {
    sonido: ajustes?.sonido !== false,
    animaciones: ajustes?.animaciones !== false,
    tema: TEMAS.includes(ajustes?.tema) ? ajustes.tema : 'sistema',
  };
}

/** En modo sobrio la app no suena ni escribe letra a letra, sin perder tus ajustes. */
export const sonidoActivo = (ajustes) => ajustes.sonido && ajustes.tema !== 'sobrio';
export const textoAnimado = (ajustes) => ajustes.animaciones && ajustes.tema !== 'sobrio';
