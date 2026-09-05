/* ==========================================================================
   Feature: ajustes. Preferencias del jugador, como el sonido del Sistema.
   ========================================================================== */

export function estadoInicialAjustes() {
  return { sonido: true };
}

export function normalizarAjustes(ajustes) {
  return { sonido: ajustes?.sonido !== false };
}
