/* ==========================================================================
   Feature: castigo — reglas. Asignación, aceptación, progreso y cumplimiento.
   Mientras haya un castigo sin cumplir se gana la mitad de experiencia y no
   empieza una semana nueva: no hay jefe hasta saldar la deuda.
   ========================================================================== */

import { fechaHoy } from '../nucleo/fecha.js';
import { CASTIGOS_DIA, CASTIGOS_JEFE, MOTIVOS } from './catalogo.js';

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

const dec = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo) * 100) / 100;
const entero = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo));

export function estadoInicialCastigo() {
  return { activo: false, aceptado: false, origen: null, desde: null, rachaPerdida: 0, mision: null };
}

function normalizarMisionCastigo(mision) {
  if (!mision || typeof mision !== 'object' || !mision.nombre) return null;
  const objetivo = Math.max(0.5, dec(mision.objetivo, 1, 0.5));
  return {
    nombre: String(mision.nombre).slice(0, 40),
    tipo: 'contador',
    objetivo,
    unidad: String(mision.unidad ?? '').slice(0, 12),
    paso: Math.max(0.5, dec(mision.paso, 1, 0.5)),
    progreso: Math.min(objetivo, dec(mision.progreso, 0, 0)),
  };
}

export function normalizarCastigo(castigo) {
  const base = estadoInicialCastigo();
  const datos = castigo ?? {};
  const mision = normalizarMisionCastigo(datos.mision);
  return {
    activo: Boolean(datos.activo),
    aceptado: Boolean(datos.aceptado),
    origen: datos.origen === 'jefe' || datos.origen === 'dia' ? datos.origen : base.origen,
    desde: datos.desde ? String(datos.desde).slice(0, 10) : null,
    rachaPerdida: entero(datos.rachaPerdida, 0, 0),
    mision,
  };
}

/**
 * Asigna un castigo si no había otro pendiente. Un castigo a la vez: quien ya
 * debe una penitencia no acumula otra, la paga y sigue.
 */
export function asignarCastigo(estado, origen, hoy = fechaHoy(), aleatorio = Math.random) {
  if (estado.castigo.activo) return null;

  const lista = origen === 'jefe' ? CASTIGOS_JEFE : CASTIGOS_DIA;
  const plantilla = lista[Math.floor(aleatorio() * lista.length)];

  estado.castigo = {
    activo: true,
    aceptado: false,
    origen,
    desde: hoy,
    rachaPerdida: origen === 'dia' ? estado.jugador.racha : estado.castigo.rachaPerdida,
    mision: { ...plantilla, progreso: 0 },
  };
  return estado.castigo;
}

export function aceptarCastigo(estado) {
  if (!estado.castigo.activo || estado.castigo.aceptado) return false;
  estado.castigo.aceptado = true;
  return true;
}

export const castigoPendiente = (estado) => estado.castigo.activo;
export const castigoCumplido = (castigo) =>
  Boolean(castigo.mision) && castigo.mision.progreso >= castigo.mision.objetivo;

export function fijarProgresoCastigo(estado, valor) {
  const mision = estado.castigo.mision;
  if (!mision || !estado.castigo.aceptado) return false;
  const limitado = Math.min(mision.objetivo, Math.max(0, Math.round(valor * 100) / 100));
  if (limitado === mision.progreso) return false;
  mision.progreso = limitado;
  return true;
}

export function ajustarProgresoCastigo(estado, delta) {
  const mision = estado.castigo.mision;
  if (!mision) return false;
  return fijarProgresoCastigo(estado, mision.progreso + delta);
}

/** Salda la deuda: levanta el castigo y desbloquea la semana. */
export function cumplirCastigo(estado) {
  const castigo = estado.castigo;
  if (!castigo.activo || !castigo.aceptado || !castigoCumplido(castigo)) return null;

  const resumen = { origen: castigo.origen, nombre: castigo.mision.nombre };
  estado.castigo = estadoInicialCastigo();
  estado.jugador.castigosSuperados += 1;
  return resumen;
}

export { MOTIVOS };
