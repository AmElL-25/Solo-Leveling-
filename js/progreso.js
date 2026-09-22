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
import { estadoInicialCastigo, normalizarCastigo } from './castigo/reglas.js';
import { normalizarPuerta } from './puertas/reglas.js';
import { normalizarJefe } from './jefes/reglas.js';
import { normalizarIncursion } from './incursion/reglas.js';
import { estadoInicialMedidas, normalizarMedidas } from './medidas/reglas.js';
import {
  inventarioInicial, normalizarInventario, estadoInicialEfectos, normalizarEfectos,
} from './tienda/reglas.js';
import { normalizarHistorial } from './historial/reglas.js';
import { estadoInicialCuota, normalizarCuota } from './negocio/reglas.js';
import { estadoInicialAjustes, normalizarAjustes } from './ajustes/reglas.js';

export const CLAVE = 'sistema:v1';   // el hueco de almacenamiento no cambia de nombre
export const VERSION = 2;            // ...pero el contenido sí evoluciona

export function estadoInicial() {
  return {
    version: VERSION,
    actualizado: 0, // epoch ms; decide qué copia manda al sincronizar entre dispositivos
    jugador: estadoInicialJugador(),
    misiones: misionesIniciales(),
    puerta: null,
    jefe: null,
    incursion: null,
    medidas: estadoInicialMedidas(),
    dia: estadoInicialDia(),
    castigo: estadoInicialCastigo(),
    inventario: inventarioInicial(),
    efectos: estadoInicialEfectos(),
    cuota: estadoInicialCuota(),
    historial: [],
    ajustes: estadoInicialAjustes(),
  };
}

/**
 * Devuelve siempre un estado válido, rellenando lo que falte con los valores
 * por defecto. Así una partida guardada por una versión anterior se completa
 * sola con las features nuevas.
 */
export function normalizar(datos) {
  if (!datos || typeof datos !== 'object') return estadoInicial();

  const misiones = Array.isArray(datos.misiones)
    ? datos.misiones.map(normalizarMision).filter(Boolean)
    : misionesIniciales();

  return {
    version: VERSION,
    actualizado: Number(datos.actualizado) || 0,
    jugador: normalizarJugador(datos.jugador),
    misiones,
    puerta: normalizarPuerta(datos.puerta),
    jefe: normalizarJefe(datos.jefe),
    incursion: normalizarIncursion(datos.incursion),
    medidas: normalizarMedidas(datos.medidas),
    dia: normalizarDia(datos.dia),
    castigo: normalizarCastigo(datos.castigo),
    inventario: normalizarInventario(datos.inventario),
    efectos: normalizarEfectos(datos.efectos),
    cuota: normalizarCuota(datos.cuota),
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
    // Antes de empezar de cero se aparta lo ilegible: el siguiente guardado
    // pisaría la única copia, y a mano todavía se puede rescatar.
    escribir(`${CLAVE}:corrupto`, bruto);
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

/** Lee una copia de seguridad. Lanza si el archivo no es una partida del Sistema. */
export function importar(texto) {
  const datos = JSON.parse(texto);
  // normalizar() convierte cualquier cosa en una partida nueva: sin esta
  // comprobación, restaurar un JSON cualquiera borraría el progreso.
  if (!esPartida(datos)) throw new Error('no es una copia del Sistema');
  return normalizar(datos);
}

export function esPartida(datos) {
  return Boolean(datos) && typeof datos === 'object' && !Array.isArray(datos)
    && Boolean(datos.jugador) && typeof datos.jugador === 'object'
    && Array.isArray(datos.misiones);
}
