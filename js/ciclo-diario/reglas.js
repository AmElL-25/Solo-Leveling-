/* ==========================================================================
   Feature: ciclo diario. Recompensa por cumplir la misión, racha, cambio de
   día y penalización por no completarla a tiempo. Orquesta al jugador, las
   misiones y el historial para resolver el día: es el caso de uso que une
   a las demás features, no una capa técnica.
   ========================================================================== */

import { fechaHoy, diasEntre } from '../nucleo/fecha.js';
import { otorgarXp, xpNecesaria } from '../jugador/reglas.js';
import { diaCompleto, porcentajeDia } from '../misiones/reglas.js';
import { registrarDia } from '../historial/reglas.js';

export const BONO_DIA = 0.5;         // +50 % de experiencia por completar la misión entera
export const PENALIZACION_XP = 0.10; // se pierde el 10 % de la experiencia del nivel actual

export function estadoInicialDia() {
  return { fecha: fechaHoy(), completado: false, xpGanada: 0, avisado: false };
}

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

export function normalizarDia(dia) {
  const base = estadoInicialDia();
  const datos = dia ?? {};
  return {
    fecha: String(datos.fecha ?? base.fecha).slice(0, 10),
    completado: Boolean(datos.completado),
    xpGanada: entero(datos.xpGanada, 0, 0),
    avisado: Boolean(datos.avisado),
  };
}

export function recompensaDia(misiones) {
  const base = misiones.reduce((total, m) => total + m.xp, 0);
  const bono = Math.round(base * BONO_DIA);
  return { base, bono, total: base + bono };
}

/**
 * Cierra la misión diaria: entrega experiencia, bono, punto extra y racha.
 * Devuelve null si el día no está completo o ya se reclamó.
 */
export function completarDia(estado) {
  if (estado.dia.completado || !diaCompleto(estado.misiones)) return null;

  const jugador = estado.jugador;
  const recompensa = recompensaDia(estado.misiones);
  const nivelPrevio = jugador.nivel;
  const niveles = otorgarXp(jugador, recompensa.total);

  jugador.puntosLibres += 1; // punto extra por cumplir la misión entera
  jugador.racha += 1;
  jugador.mejorRacha = Math.max(jugador.mejorRacha, jugador.racha);
  jugador.diasCompletados += 1;

  estado.dia.completado = true;
  estado.dia.xpGanada = recompensa.total;

  return { ...recompensa, niveles, nivelPrevio, nivel: jugador.nivel, racha: jugador.racha };
}

/**
 * Archiva el día guardado si ya cambió la fecha, reinicia los progresos y aplica
 * la penalización cuando la misión quedó sin completar.
 * Devuelve el resumen de lo ocurrido, o null si seguimos en el mismo día.
 */
export function sincronizarDia(estado, hoy = fechaHoy()) {
  const anterior = estado.dia;
  if (anterior.fecha === hoy) return null;

  const porcentaje = Math.round(porcentajeDia(estado.misiones) * 100);
  const resumen = {
    fecha: anterior.fecha,
    completado: anterior.completado,
    porcentaje,
    dias: diasEntre(anterior.fecha, hoy),
    perdida: 0,
    rachaPerdida: 0,
  };

  registrarDia(estado.historial, {
    fecha: anterior.fecha,
    porcentaje,
    completado: anterior.completado,
    xpGanada: anterior.xpGanada,
  });

  if (!anterior.completado) {
    const jugador = estado.jugador;
    // Penalización suave: nunca deja la experiencia en negativo ni baja de nivel.
    const perdida = Math.min(jugador.xp, Math.floor(xpNecesaria(jugador.nivel) * PENALIZACION_XP));
    jugador.xp -= perdida;
    resumen.perdida = perdida;
    resumen.rachaPerdida = jugador.racha;
    jugador.racha = 0;
  }

  for (const mision of estado.misiones) mision.progreso = 0;
  estado.dia = { fecha: hoy, completado: false, xpGanada: 0, avisado: false };

  return resumen;
}
