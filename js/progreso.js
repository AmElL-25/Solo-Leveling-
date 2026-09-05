/* ==========================================================================
   Progreso guardado: agrega el estado de todas las features en un único
   objeto, lo normaliza y lo persiste en localStorage. Es la partida
   guardada del jugador, no una capa técnica: por eso vive en la raíz de
   js/ junto a app.js y no dentro de nucleo/.
   ========================================================================== */

import { leer, escribir, eliminar } from './nucleo/almacenamiento.js';
import { estadoInicialJugador, normalizarJugador } from './jugador/reglas.js';
import { misionesIniciales, normalizarMision } from './misiones/reglas.js';
import { estadoInicialDia, normalizarDia } from './ciclo-diario/reglas.js';
import { normalizarHistorial } from './historial/reglas.js';
import { estadoInicialAjustes, normalizarAjustes } from './ajustes/reglas.js';

export const CLAVE = 'sistema:v1';
export const VERSION = 1;

export function estadoInicial() {
  return {
    version: VERSION,
    jugador: estadoInicialJugador(),
    misiones: misionesIniciales(),
    dia: estadoInicialDia(),
    historial: [],
    ajustes: estadoInicialAjustes(),
  };
}

/** Devuelve siempre un estado válido, rellenando lo que falte con los valores por defecto. */
export function normalizar(datos) {
  if (!datos || typeof datos !== 'object') return estadoInicial();

  const misiones = Array.isArray(datos.misiones)
    ? datos.misiones.map(normalizarMision).filter(Boolean)
    : misionesIniciales();

  return {
    version: VERSION,
    jugador: normalizarJugador(datos.jugador),
    misiones,
    dia: normalizarDia(datos.dia),
    historial: normalizarHistorial(datos.historial),
    ajustes: normalizarAjustes(datos.ajustes),
  };
}

/* ------------------------------ persistencia ------------------------------ */

export function cargar() {
  const bruto = leer(CLAVE);
  if (!bruto) return estadoInicial();
  try {
    return normalizar(JSON.parse(bruto));
  } catch {
    return estadoInicial();
  }
}

export function guardar(estado) {
  return escribir(CLAVE, JSON.stringify(estado));
}

export function borrar() {
  eliminar(CLAVE);
}

export function exportar(estado) {
  return JSON.stringify(estado, null, 2);
}

export function importar(texto) {
  return normalizar(JSON.parse(texto));
}
