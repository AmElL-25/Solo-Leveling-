/* ==========================================================================
   Feature: misiones diarias. Alta, edición, borrado, progreso y el estado
   del día (completo o no). Funciones puras sobre la lista de misiones; no
   tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { idNuevo } from '../nucleo/fecha.js';
import { STATS } from '../jugador/reglas.js';
import { buscarPlantilla, PLANTILLA_INICIAL } from '../plantillas/catalogo.js';

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
    progreso: Math.min(objetivo, dec(mision.progreso, 0, 0)),
    xp: Math.min(999, Math.max(1, entero(mision.xp, 20, 1))),
    stat: STATS.some((s) => s.id === mision.stat) ? mision.stat : 'fuerza',
  };
}

export function misionCompleta(mision) {
  return mision.progreso >= mision.objetivo;
}

export function progresoMision(mision) {
  if (mision.objetivo <= 0) return 1;
  return Math.min(1, mision.progreso / mision.objetivo);
}

/** Progreso medio del día, de 0 a 1. */
export function porcentajeDia(misiones) {
  if (!misiones.length) return 0;
  const suma = misiones.reduce((total, m) => total + progresoMision(m), 0);
  return suma / misiones.length;
}

export function diaCompleto(misiones) {
  return misiones.length > 0 && misiones.every(misionCompleta);
}

export function ajustarProgreso(misiones, id, delta) {
  const mision = misiones.find((m) => m.id === id);
  if (!mision) return false;
  return fijarProgreso(misiones, id, mision.progreso + delta);
}

export function fijarProgreso(misiones, id, valor) {
  const mision = misiones.find((m) => m.id === id);
  if (!mision) return false;
  const limitado = Math.min(mision.objetivo, Math.max(0, Math.round(valor * 100) / 100));
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
