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
    medida: m.medida === 'peso' ? 'peso' : null,
    objetivoBase: m.tipo === 'checkbox' ? 1 : m.objetivo,
    cumplidos: 0,
    buenas: 0,
    malas: 0,
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
    // Algunas misiones piden un dato además de marcarse: el pesaje, el peso.
    medida: mision.medida === 'peso' ? 'peso' : null,
    // Memoria para que el objetivo siga al que lo cumple (ver revisarObjetivos).
    objetivoBase: Math.max(0.5, dec(mision.objetivoBase ?? objetivo, objetivo, 0.5)),
    cumplidos: entero(mision.cumplidos, 0, 0),
    buenas: entero(mision.buenas, 0, 0),
    malas: entero(mision.malas, 0, 0),
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

/* -------------------- el objetivo sigue al que lo cumple -------------------- */

/* Días de la semana que hay que cumplir una diaria para considerarla holgada,
   y por debajo de cuántos se considera que aprieta demasiado. */
const DIAS_HOLGADA = 6;
const DIAS_FLOJA = 3;
/* Dos semanas seguidas antes de mover nada: una buena racha puede ser suerte. */
const SEMANAS_SEGUIDAS = 2;
/* Nunca más del triple de lo que se puso al principio, ni menos de un paso. */
const TECHO = 3;

/** Al cerrar el día, anota qué objetivos se cumplieron. */
export function anotarCumplimiento(misiones) {
  for (const mision of diarias(misiones)) {
    if (misionCompleta(mision)) mision.cumplidos += 1;
  }
}

const mueve = (mision, sentido) => {
  if (mision.tipo === 'checkbox') return null;   // un sí/no no tiene escalones
  const techo = mision.objetivoBase * TECHO;
  const suelo = Math.max(mision.paso, mision.objetivoBase / 2);
  const nuevo = Math.round((mision.objetivo + mision.paso * sentido) * 100) / 100;
  const limitado = Math.min(techo, Math.max(suelo, nuevo));
  if (limitado === mision.objetivo) return null;

  const antes = mision.objetivo;
  mision.objetivo = limitado;
  if (mision.progreso > limitado && !mision.opcional) mision.progreso = limitado;
  return { nombre: mision.nombre, antes, ahora: limitado, unidad: mision.unidad };
};

/**
 * Revisión de los lunes. Si un objetivo se cumple con holgura dos semanas
 * seguidas, sube un escalón; si aprieta dos seguidas, baja. Así los 8.000
 * pasos de hoy son otros en dos meses sin que nadie los toque a mano.
 * Devuelve la lista de cambios para poder avisar.
 */
export function revisarObjetivos(misiones) {
  const cambios = [];

  for (const mision of misiones) {
    if (mision.opcional) continue;

    const bien = mision.periodo === 'semana'
      ? misionCompleta(mision)
      : mision.cumplidos >= DIAS_HOLGADA;
    const mal = mision.periodo === 'semana'
      ? mision.progreso < mision.objetivo / 2
      : mision.cumplidos <= DIAS_FLOJA;

    if (bien) { mision.buenas += 1; mision.malas = 0; }
    else if (mal) { mision.malas += 1; mision.buenas = 0; }
    else { mision.buenas = 0; mision.malas = 0; }

    if (mision.buenas >= SEMANAS_SEGUIDAS) {
      mision.buenas = 0;
      const cambio = mueve(mision, 1);
      if (cambio) cambios.push({ ...cambio, sentido: 'sube' });
    } else if (mision.malas >= SEMANAS_SEGUIDAS) {
      mision.malas = 0;
      const cambio = mueve(mision, -1);
      if (cambio) cambios.push({ ...cambio, sentido: 'baja' });
    }

    mision.cumplidos = 0;
  }

  return cambios;
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
