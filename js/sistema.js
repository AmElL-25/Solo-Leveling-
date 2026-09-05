/* ==========================================================================
   Reglas del juego: experiencia, niveles, rangos, racha y penalización.
   Funciones puras sobre el objeto de estado; no tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { STATS, fechaHoy, MAX_HISTORIAL } from './estado.js';

export const PUNTOS_POR_NIVEL = 3;   // puntos de estadística que da cada nivel
export const BONO_DIA = 0.5;         // +50 % de experiencia por completar la misión entera
export const PENALIZACION_XP = 0.10; // se pierde el 10 % de la experiencia del nivel actual

const RANGOS = [
  { min: 60, letra: 'S' },
  { min: 45, letra: 'A' },
  { min: 30, letra: 'B' },
  { min: 20, letra: 'C' },
  { min: 10, letra: 'D' },
  { min: 1,  letra: 'E' },
];

/** Curva de progresión: suave al principio, exigente en niveles altos. */
export function xpNecesaria(nivel) {
  return Math.floor(100 * Math.pow(nivel, 1.4));
}

export function rango(nivel) {
  return (RANGOS.find((r) => nivel >= r.min) ?? RANGOS[RANGOS.length - 1]).letra;
}

/* -------------------------------- misiones -------------------------------- */

export function misionCompleta(mision) {
  return mision.progreso >= mision.objetivo;
}

export function progresoMision(mision) {
  if (mision.objetivo <= 0) return 1;
  return Math.min(1, mision.progreso / mision.objetivo);
}

/** Progreso medio del día, de 0 a 1. */
export function porcentajeDia(estado) {
  if (!estado.misiones.length) return 0;
  const suma = estado.misiones.reduce((total, m) => total + progresoMision(m), 0);
  return suma / estado.misiones.length;
}

export function diaCompleto(estado) {
  return estado.misiones.length > 0 && estado.misiones.every(misionCompleta);
}

export function ajustarProgreso(estado, id, delta) {
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return false;
  return fijarProgreso(estado, id, mision.progreso + delta);
}

export function fijarProgreso(estado, id, valor) {
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return false;
  const limitado = Math.min(mision.objetivo, Math.max(0, Math.round(valor * 100) / 100));
  if (limitado === mision.progreso) return false;
  mision.progreso = limitado;
  return true;
}

/* ------------------------------ recompensas ------------------------------ */

export function recompensaDia(estado) {
  const base = estado.misiones.reduce((total, m) => total + m.xp, 0);
  const bono = Math.round(base * BONO_DIA);
  return { base, bono, total: base + bono };
}

/** Suma experiencia y sube tantos niveles como corresponda. Devuelve los niveles ganados. */
export function otorgarXp(estado, cantidad) {
  const jugador = estado.jugador;
  jugador.xp += cantidad;
  let niveles = 0;
  while (jugador.xp >= xpNecesaria(jugador.nivel)) {
    jugador.xp -= xpNecesaria(jugador.nivel);
    jugador.nivel += 1;
    jugador.puntosLibres += PUNTOS_POR_NIVEL;
    niveles += 1;
  }
  return niveles;
}

/**
 * Cierra la misión diaria: entrega experiencia, bono, punto extra y racha.
 * Devuelve null si el día no está completo o ya se reclamó.
 */
export function completarDia(estado) {
  if (estado.dia.completado || !diaCompleto(estado)) return null;

  const jugador = estado.jugador;
  const recompensa = recompensaDia(estado);
  const nivelPrevio = jugador.nivel;
  const niveles = otorgarXp(estado, recompensa.total);

  jugador.puntosLibres += 1; // punto extra por cumplir la misión entera
  jugador.racha += 1;
  jugador.mejorRacha = Math.max(jugador.mejorRacha, jugador.racha);
  jugador.diasCompletados += 1;

  estado.dia.completado = true;
  estado.dia.xpGanada = recompensa.total;

  return { ...recompensa, niveles, nivelPrevio, nivel: jugador.nivel, racha: jugador.racha };
}

/* ------------------------------- cambio de día ------------------------------- */

function diasEntre(desde, hasta) {
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  return Math.max(1, Math.round((b - a) / 86400000));
}

/**
 * Archiva el día guardado si ya cambió la fecha, reinicia los progresos y aplica
 * la penalización cuando la misión quedó sin completar.
 * Devuelve el resumen de lo ocurrido, o null si seguimos en el mismo día.
 */
export function sincronizarDia(estado, hoy = fechaHoy()) {
  const anterior = estado.dia;
  if (anterior.fecha === hoy) return null;

  const porcentaje = Math.round(porcentajeDia(estado) * 100);
  const resumen = {
    fecha: anterior.fecha,
    completado: anterior.completado,
    porcentaje,
    dias: diasEntre(anterior.fecha, hoy),
    perdida: 0,
    rachaPerdida: 0,
  };

  estado.historial.unshift({
    fecha: anterior.fecha,
    porcentaje,
    completado: anterior.completado,
    xpGanada: anterior.xpGanada,
  });
  estado.historial = estado.historial.slice(0, MAX_HISTORIAL);

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

/* ------------------------------ estadísticas ------------------------------ */

export function asignarPunto(estado, statId) {
  if (estado.jugador.puntosLibres <= 0) return false;
  if (!STATS.some((s) => s.id === statId)) return false;
  estado.jugador.stats[statId] += 1;
  estado.jugador.puntosLibres -= 1;
  return true;
}

/** Milisegundos que faltan para la medianoche local. */
export function msHastaMedianoche(ahora = new Date()) {
  const medianoche = new Date(ahora);
  medianoche.setHours(24, 0, 0, 0);
  return medianoche - ahora;
}
