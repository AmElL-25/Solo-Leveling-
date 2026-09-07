/* ==========================================================================
   Feature: títulos — reglas. Desbloqueo por logros y título equipado.
   ========================================================================== */

import { TITULOS, buscarTitulo } from './catalogo.js';

/** Desbloquea los títulos cuyas condiciones ya se cumplen. Devuelve los nuevos. */
export function revisarTitulos(estado) {
  const nuevos = [];
  for (const titulo of TITULOS) {
    if (estado.jugador.titulos.includes(titulo.id)) continue;
    if (titulo.condicion(estado)) {
      estado.jugador.titulos.push(titulo.id);
      nuevos.push(titulo);
    }
  }
  return nuevos;
}

export function equiparTitulo(jugador, id) {
  if (!jugador.titulos.includes(id)) return false;
  jugador.titulo = id;
  return true;
}

/** Porcentaje extra de experiencia que aporta el título equipado. */
export const bonoTitulo = (jugador) => buscarTitulo(jugador.titulo).bono;

export { TITULOS, buscarTitulo };
