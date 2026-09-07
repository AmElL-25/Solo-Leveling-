/* ==========================================================================
   Feature: ajustes. Preferencias del jugador: sonido del Sistema y efecto
   de máquina de escribir en las notificaciones.
   ========================================================================== */

export function estadoInicialAjustes() {
  return { sonido: true, animaciones: true };
}

export function normalizarAjustes(ajustes) {
  return {
    sonido: ajustes?.sonido !== false,
    animaciones: ajustes?.animaciones !== false,
  };
}
