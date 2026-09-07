/* ==========================================================================
   Feature: clases — reglas. La misión de cambio de clase aparece al llegar
   al nivel indicado y solo se resuelve una vez.
   ========================================================================== */

import { CLASES, NIVEL_CAMBIO_CLASE, PUNTOS_CLASE, buscarClase } from './catalogo.js';

export const puedeCambiarClase = (jugador) =>
  jugador.clase === null && jugador.nivel >= NIVEL_CAMBIO_CLASE;

/** Fija la clase y suma los puntos de especialidad. Devuelve la clase o null. */
export function elegirClase(jugador, id) {
  if (!puedeCambiarClase(jugador)) return null;
  const clase = CLASES.find((c) => c.id === id);
  if (!clase) return null;
  jugador.clase = clase.id;
  jugador.stats[clase.stat] += PUNTOS_CLASE;
  return clase;
}

export { CLASES, NIVEL_CAMBIO_CLASE, PUNTOS_CLASE, buscarClase };
