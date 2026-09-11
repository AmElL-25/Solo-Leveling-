/* ==========================================================================
   Feature: la incursión. El jefe de la semana mide el cuerpo; esto mide el
   oficio, y tiene algo que ningún jefe tiene: una fecha real. El ascenso no
   lo decide el Sistema, así que cuando llega el día no hay castigo — hay un
   informe de lo que hiciste en esos dos meses.

   Funciones puras: no tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { fechaHoy } from '../nucleo/fecha.js';
import { obligatorias, delArea, diarias } from '../misiones/reglas.js';

export const NOMBRE_INCURSION = 'EL ASCENSO';

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}
const entero = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo));

/** Días entre dos fechas, con signo: negativo si la segunda ya pasó. */
export function diasHasta(fecha, desde = fechaHoy()) {
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b - a) / 86400000);
}

/** La fecha por defecto: dos meses vista, que es lo que él dijo. */
export function fechaPorDefecto(desde = fechaHoy()) {
  const d = new Date(`${desde}T00:00:00`);
  d.setMonth(d.getMonth() + 2);
  return fechaHoy(d);
}

/** Lo que vale un día entero del carril profesional, sin bonificaciones. */
export const xpDiariaProfesional = (misiones) =>
  diarias(obligatorias(delArea(misiones, 'profesional'))).reduce((t, m) => t + m.xp, 0);

/**
 * La vida es lo que cuesta la temporada entera: cumplir cada día de aquí a la
 * fecha la deja justo en cero. Los cupos de la semana pegan de más, así que
 * trabajar la semana te permite llegar antes.
 */
export function vidaDeLaIncursion(misiones, dias) {
  return Math.max(1, xpDiariaProfesional(misiones) * Math.max(1, dias));
}

export function crearIncursion(estado, fecha = fechaPorDefecto(), hoy = fechaHoy()) {
  const dias = Math.max(1, diasHasta(fecha, hoy));
  const vidaMaxima = vidaDeLaIncursion(estado.misiones, dias);
  return {
    nombre: NOMBRE_INCURSION,
    fecha,
    desde: hoy,
    vidaMaxima,
    vida: vidaMaxima,
    derrotada: false,
    cerrada: false,
  };
}

export function normalizarIncursion(incursion) {
  if (!incursion || typeof incursion !== 'object' || !incursion.fecha) return null;
  const vidaMaxima = Math.max(1, entero(incursion.vidaMaxima, 1, 1));
  return {
    nombre: String(incursion.nombre ?? NOMBRE_INCURSION).slice(0, 40),
    fecha: String(incursion.fecha).slice(0, 10),
    desde: String(incursion.desde ?? fechaHoy()).slice(0, 10),
    vidaMaxima,
    vida: Math.min(vidaMaxima, entero(incursion.vida, vidaMaxima, 0)),
    derrotada: Boolean(incursion.derrotada),
    cerrada: Boolean(incursion.cerrada),
  };
}

export const incursionViva = (incursion) =>
  Boolean(incursion) && !incursion.derrotada && !incursion.cerrada && incursion.vida > 0;

/** Le hace daño. Devuelve el parte si cae, o null. */
export function golpearIncursion(estado, dano) {
  const incursion = estado.incursion;
  if (!incursionViva(incursion) || dano <= 0) return null;

  incursion.vida = Math.max(0, incursion.vida - Math.round(dano));
  if (incursion.vida > 0) return null;

  incursion.derrotada = true;
  return {
    nombre: incursion.nombre,
    fecha: incursion.fecha,
    dias: diasHasta(incursion.fecha),
  };
}

/**
 * Al llegar la fecha con la incursión viva no hay castigo: se cierra y se
 * entrega el balance. La fecha es real y el Sistema no manda sobre ella.
 */
export function revisarIncursion(estado, hoy = fechaHoy()) {
  const incursion = estado.incursion;
  if (!incursion || incursion.cerrada || incursion.derrotada) return null;
  if (diasHasta(incursion.fecha, hoy) > 0) return null;

  incursion.cerrada = true;
  const hecho = incursion.vidaMaxima - incursion.vida;
  return {
    nombre: incursion.nombre,
    fecha: incursion.fecha,
    porcentaje: Math.round((hecho / incursion.vidaMaxima) * 100),
  };
}

/** Cambia la fecha del ascenso y recalcula lo que queda, conservando lo hecho. */
export function fijarFecha(estado, fecha, hoy = fechaHoy()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) return false;
  if (!estado.incursion) {
    estado.incursion = crearIncursion(estado, fecha, hoy);
    return true;
  }
  const incursion = estado.incursion;
  const hecho = incursion.vidaMaxima - incursion.vida;
  const dias = Math.max(1, diasHasta(fecha, hoy));
  incursion.fecha = fecha;
  incursion.vidaMaxima = vidaDeLaIncursion(estado.misiones, dias) + hecho;
  incursion.vida = Math.max(0, incursion.vidaMaxima - hecho);
  incursion.cerrada = false;
  incursion.derrotada = incursion.vida === 0;
  return true;
}
