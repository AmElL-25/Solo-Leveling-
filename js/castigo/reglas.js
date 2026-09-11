/* ==========================================================================
   Feature: castigo — reglas. Asignación, aceptación, progreso y cumplimiento.
   Mientras haya un castigo sin cumplir se gana la mitad de experiencia y no
   empieza una semana nueva: no hay jefe hasta saldar la deuda.
   ========================================================================== */

import { fechaHoy } from '../nucleo/fecha.js';
import { misionCompleta, obligatorias, delArea, diarias } from '../misiones/reglas.js';
import { RESERVAS, FACTOR_PENITENCIA, MOTIVOS } from './catalogo.js';

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

const dec = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo) * 100) / 100;
const entero = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo));

export function estadoInicialCastigo() {
  return {
    activo: false, aceptado: false, origen: null, area: null,
    desde: null, rachaPerdida: 0, mision: null,
  };
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
    area: datos.area === 'profesional' ? 'profesional' : (datos.activo ? 'personal' : base.area),
    desde: datos.desde ? String(datos.desde).slice(0, 10) : null,
    rachaPerdida: entero(datos.rachaPerdida, 0, 0),
    mision,
  };
}

/**
 * La penitencia es lo que dejaste sin hacer, a 1,5×. Tiene más sentido que un
 * castigo al azar: si ayer no caminaste, hoy caminas más; no te caen cien
 * flexiones que además te pueden lesionar.
 *
 * Solo sirven las misiones de contador: de una de sí/no («dormir 7 h») no se
 * puede sacar una penitencia con la que medir el progreso.
 */
export function penitenciaDe(misiones, area) {
  const candidatas = diarias(obligatorias(delArea(misiones, area)))
    .filter((m) => m.tipo === 'contador' && !misionCompleta(m));
  if (!candidatas.length) return null;

  // La que más experiencia valía: es la que más pesaba en el día.
  const peor = candidatas.reduce((a, b) => (b.xp > a.xp ? b : a));
  const objetivo = Math.max(0.5, Math.round(peor.objetivo * FACTOR_PENITENCIA * 100) / 100);
  return {
    nombre: `Penitencia: ${peor.nombre}`.slice(0, 40),
    tipo: 'contador',
    objetivo,
    unidad: peor.unidad,
    paso: peor.paso,
    progreso: 0,
  };
}

/**
 * Asigna un castigo si no había otro pendiente. Un castigo a la vez: quien ya
 * debe una penitencia no acumula otra, la paga y sigue. El castigo siempre es
 * del carril que se falló: lo del cuerpo se paga con cuerpo y lo del oficio
 * con oficio, nunca cruzado.
 */
export function asignarCastigo(estado, origen, area = 'personal', hoy = fechaHoy(), aleatorio = Math.random) {
  if (estado.castigo.activo) return null;

  const reserva = RESERVAS[area] ?? RESERVAS.personal;
  const mision = (origen === 'dia' ? penitenciaDe(estado.misiones, area) : null)
    ?? { ...reserva[Math.floor(aleatorio() * reserva.length)], progreso: 0 };

  estado.castigo = {
    activo: true,
    aceptado: false,
    origen,
    area,
    desde: hoy,
    rachaPerdida: origen === 'dia'
      ? (estado.jugador.rachas[area] ?? 0)
      : estado.castigo.rachaPerdida,
    mision,
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

  const resumen = { origen: castigo.origen, area: castigo.area, nombre: castigo.mision.nombre };
  estado.castigo = estadoInicialCastigo();
  estado.jugador.castigosSuperados += 1;
  return resumen;
}

export { MOTIVOS };
