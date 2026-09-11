/* ==========================================================================
   Feature: misiones diarias. Alta, edición, borrado, progreso y el estado
   del día (completo o no). Funciones puras sobre la lista de misiones; no
   tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { idNuevo } from '../nucleo/fecha.js';
import { STATS } from '../jugador/reglas.js';
import { buscarPlantilla, PLANTILLA_INICIAL } from '../plantillas/catalogo.js';
import { esIndicador } from '../negocio/catalogo.js';

/* Dos carriles que avanzan en paralelo: el cuerpo y la cabeza por un lado, el
   oficio por otro. Fallar el gimnasio y fallar una llamada no son el mismo
   fallo, así que cada carril lleva su porcentaje, su racha y su castigo. */
export const AREAS = ['personal', 'profesional'];
export const AREA_INICIAL = 'personal';
export const esArea = (valor) => AREAS.includes(valor);

/* Hay objetivos que no son de todos los días: entrenar tres veces por semana
   se reparte como uno pueda. Las semanales llevan un cupo y se reinician el
   lunes, no cada medianoche. */
export const PERIODOS = ['dia', 'semana'];

/* El día no exige perfección: se aprueba con la mayoría hecha, y solo se
   castiga el día en que no se hizo casi nada. */
export const UMBRAL_CUMPLIDO = 0.8;
export const UMBRAL_CASTIGO = 0.5;

/** Convierte una plantilla del catálogo en misiones listas para jugar. */
export function misionesDePlantilla(id) {
  return buscarPlantilla(id).misiones.map((m) => ({
    id: idNuevo(),
    tipo: m.tipo ?? 'contador',
    objetivo: m.tipo === 'checkbox' ? 1 : m.objetivo,
    unidad: m.tipo === 'checkbox' ? '' : m.unidad,
    paso: m.tipo === 'checkbox' ? 1 : m.paso,
    progreso: 0,
    nombre: m.nombre,
    xp: m.xp,
    stat: m.stat,
    indicador: m.indicador ?? null,
    opcional: Boolean(m.opcional),
    area: esArea(m.area) ? m.area : AREA_INICIAL,
    periodo: m.periodo === 'semana' ? 'semana' : 'dia',
  }));
}

/** La misión diaria de partida. */
export function misionesIniciales() {
  return misionesDePlantilla(PLANTILLA_INICIAL);
}

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

/** Redondea a 2 decimales: los contadores admiten medios kilómetros. */
function dec(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo) * 100) / 100;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

export function normalizarMision(mision) {
  if (!mision || typeof mision !== 'object') return null;
  const nombre = String(mision.nombre ?? '').trim().slice(0, 40);
  if (!nombre) return null;

  const tipo = mision.tipo === 'checkbox' ? 'checkbox' : 'contador';
  const objetivo = tipo === 'checkbox' ? 1 : Math.max(0.5, dec(mision.objetivo, 1, 0.5));

  return {
    id: String(mision.id || idNuevo()),
    nombre,
    tipo,
    objetivo,
    unidad: tipo === 'checkbox' ? '' : String(mision.unidad ?? '').trim().slice(0, 10),
    paso: tipo === 'checkbox' ? 1 : Math.max(0.5, dec(mision.paso, 1, 0.5)),
    progreso: mision.opcional
      ? dec(mision.progreso, 0, 0)
      : Math.min(objetivo, dec(mision.progreso, 0, 0)),
    xp: Math.min(999, Math.max(1, entero(mision.xp, 20, 1))),
    stat: STATS.some((s) => s.id === mision.stat) ? mision.stat : 'fuerza',
    indicador: esIndicador(mision.indicador) ? mision.indicador : null,
    opcional: Boolean(mision.opcional),
    // Los guardados anteriores no tenían carril ni periodo: eran todas
    // personales y diarias, que es justo lo que dicen estos valores.
    area: esArea(mision.area) ? mision.area : AREA_INICIAL,
    periodo: mision.periodo === 'semana' ? 'semana' : 'dia',
  };
}

export function misionCompleta(mision) {
  return mision.progreso >= mision.objetivo;
}

export function progresoMision(mision) {
  if (mision.objetivo <= 0) return 1;
  return Math.min(1, mision.progreso / mision.objetivo);
}

/**
 * Las misiones opcionales —cerrar una venta, facturar— no dependen solo de ti:
 * cuentan para la experiencia y para los indicadores, pero no deciden si el día
 * está cumplido.
 */
export const obligatorias = (misiones) => misiones.filter((m) => !m.opcional);

/** Filtra por carril. Sin carril devuelve todas: sirve para lo que no distingue. */
export const delArea = (misiones, area) =>
  (esArea(area) ? misiones.filter((m) => m.area === area) : misiones);

export const diarias = (misiones) => misiones.filter((m) => m.periodo !== 'semana');
export const semanales = (misiones) => misiones.filter((m) => m.periodo === 'semana');

const medio = (misiones) => {
  if (!misiones.length) return 0;
  return misiones.reduce((total, m) => total + progresoMision(m), 0) / misiones.length;
};

/** Progreso medio de hoy en un carril, de 0 a 1. Solo las diarias obligatorias. */
export function porcentajeDia(misiones, area) {
  return medio(diarias(obligatorias(delArea(misiones, area))));
}

/** Lo mismo con los cupos de la semana, que se juzgan aparte. */
export function porcentajeSemana(misiones, area) {
  return medio(semanales(obligatorias(delArea(misiones, area))));
}

/**
 * El día está cumplido cuando se llega al umbral, no cuando se hace todo.
 * Fallar una cosa de siete cuesta algo, pero no debería hundir el día entero.
 */
export function diaCompleto(misiones, area, umbral = UMBRAL_CUMPLIDO) {
  const cuentan = diarias(obligatorias(delArea(misiones, area)));
  return cuentan.length > 0 && porcentajeDia(misiones, area) >= umbral;
}

/** Carriles que hoy tienen algo que hacer; los vacíos no se juzgan. */
export function carrilesActivos(misiones) {
  return AREAS.filter((area) => diarias(obligatorias(delArea(misiones, area))).length > 0);
}

export function ajustarProgreso(misiones, id, delta) {
  const mision = misiones.find((m) => m.id === id);
  if (!mision) return false;
  return fijarProgreso(misiones, id, mision.progreso + delta);
}

export function fijarProgreso(misiones, id, valor) {
  const mision = misiones.find((m) => m.id === id);
  if (!mision) return false;
  // Las opcionales son registro, no objetivo: si facturas de más, se anota de más.
  const tope = mision.opcional ? Infinity : mision.objetivo;
  const limitado = Math.min(tope, Math.max(0, Math.round(valor * 100) / 100));
  if (limitado === mision.progreso) return false;
  mision.progreso = limitado;
  return true;
}

/** Crea o actualiza una misión a partir de los datos del formulario de alta/edición. */
export function guardarMision(misiones, datos) {
  const { id, ...campos } = datos;
  const existente = misiones.find((m) => m.id === id);
  if (existente) {
    Object.assign(existente, campos);
    existente.progreso = Math.min(existente.progreso, existente.objetivo);
    return existente;
  }
  const nueva = { id: idNuevo(), progreso: 0, ...campos };
  misiones.push(nueva);
  return nueva;
}

export function eliminarMision(misiones, id) {
  const indice = misiones.findIndex((m) => m.id === id);
  if (indice === -1) return false;
  misiones.splice(indice, 1);
  return true;
}
