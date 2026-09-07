/* ==========================================================================
   Concepto compartido: cómo se convierte el esfuerzo en experiencia y oro.
   El multiplicador junta lo que aportan el título equipado, la clase, la
   zona de penalización y los objetos en uso. Lo consultan el ciclo diario
   y las puertas, así que vive aparte de ambas.
   ========================================================================== */

import { bonoTitulo } from '../titulos/reglas.js';
import { buscarClase, BONO_CLASE } from '../clases/catalogo.js';

export const MERMA_CASTIGO = 0.5; // dentro de la zona de penalización se gana la mitad
export const ORO_POR_XP = 1 / 3;

/**
 * Multiplicador de experiencia. `stat` es la estadística de la misión que se
 * está cobrando: solo entonces cuenta la especialidad de la clase.
 */
export function multiplicadorXp(estado, stat = null) {
  let multiplicador = 1 + bonoTitulo(estado.jugador) / 100;

  const clase = buscarClase(estado.jugador.clase);
  if (clase && stat === clase.stat) multiplicador += BONO_CLASE / 100;

  if (estado.castigo.activo) multiplicador *= MERMA_CASTIGO;
  if (estado.efectos.dobleXp) multiplicador *= 2;

  return multiplicador;
}

export const oroPorXp = (xp) => Math.round(xp * ORO_POR_XP);
