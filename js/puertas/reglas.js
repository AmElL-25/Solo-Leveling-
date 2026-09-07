/* ==========================================================================
   Feature: puertas — reglas. Aparición, progreso y cierre con recompensa.
   ========================================================================== */

import { idNuevo } from '../nucleo/fecha.js';
import { STATS, otorgarXp, sumarFatiga } from '../jugador/reglas.js';
import { multiplicadorXp } from '../recompensas/reglas.js';
import { revisarTitulos } from '../titulos/reglas.js';
import { RANGOS_PUERTA, DESAFIOS_PUERTA, PROBABILIDAD_PUERTA } from './catalogo.js';

export const FATIGA_PUERTA = 20;

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

const dec = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo) * 100) / 100;
const entero = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo));

export function normalizarPuerta(puerta) {
  if (!puerta || typeof puerta !== 'object' || !puerta.nombre) return null;
  const objetivo = Math.max(0.5, dec(puerta.objetivo, 1, 0.5));
  return {
    id: String(puerta.id || idNuevo()),
    rango: String(puerta.rango ?? 'E').slice(0, 1),
    nombre: String(puerta.nombre).slice(0, 40),
    objetivo,
    unidad: String(puerta.unidad ?? '').slice(0, 10),
    paso: Math.max(0.5, dec(puerta.paso, 1, 0.5)),
    progreso: Math.min(objetivo, dec(puerta.progreso, 0, 0)),
    xp: entero(puerta.xp, 60, 1),
    oro: entero(puerta.oro, 40, 0),
    stat: STATS.some((s) => s.id === puerta.stat) ? puerta.stat : 'fuerza',
    cerrada: Boolean(puerta.cerrada),
    fecha: String(puerta.fecha ?? '').slice(0, 10),
  };
}

/** Elige un rango acorde al nivel, con opción a que salga uno por debajo. */
function rangoParaNivel(nivel, aleatorio) {
  const posibles = RANGOS_PUERTA.filter((r) => nivel >= r.nivelMin);
  const candidatos = posibles.slice(-2);
  return candidatos[Math.floor(aleatorio() * candidatos.length)] ?? RANGOS_PUERTA[0];
}

export function generarPuerta(nivel, fecha, aleatorio = Math.random) {
  const info = rangoParaNivel(nivel, aleatorio);
  const desafio = DESAFIOS_PUERTA[Math.floor(aleatorio() * DESAFIOS_PUERTA.length)];
  return {
    id: idNuevo(),
    rango: info.rango,
    nombre: desafio.nombre,
    objetivo: desafio.objetivo,
    unidad: desafio.unidad,
    paso: desafio.paso,
    progreso: 0,
    xp: info.xp,
    oro: info.oro,
    stat: desafio.stat,
    cerrada: false,
    fecha,
  };
}

/** ¿Se abre una puerta hoy? */
export const hayPuertaHoy = (aleatorio = Math.random) => aleatorio() < PROBABILIDAD_PUERTA;

export const puertaCompleta = (puerta) => Boolean(puerta) && puerta.progreso >= puerta.objetivo;

export function fijarProgresoPuerta(puerta, valor) {
  if (!puerta || puerta.cerrada) return false;
  const limitado = Math.min(puerta.objetivo, Math.max(0, Math.round(valor * 100) / 100));
  if (limitado === puerta.progreso) return false;
  puerta.progreso = limitado;
  return true;
}

export function ajustarProgresoPuerta(puerta, delta) {
  if (!puerta) return false;
  return fijarProgresoPuerta(puerta, puerta.progreso + delta);
}

/* ------------------------------- recompensa ------------------------------- */

/** Reclama la recompensa de la puerta. Devuelve null si no está superada. */
export function cerrarPuerta(estado) {
  const puerta = estado.puerta;
  if (!puerta || puerta.cerrada || !puertaCompleta(puerta)) return null;

  const xp = Math.round(puerta.xp * multiplicadorXp(estado, puerta.stat));
  const nivelPrevio = estado.jugador.nivel;
  const niveles = otorgarXp(estado.jugador, xp);

  estado.jugador.oro += puerta.oro;
  estado.jugador.puertasCerradas += 1;
  sumarFatiga(estado.jugador, FATIGA_PUERTA);
  puerta.cerrada = true;

  return {
    rango: puerta.rango,
    xp,
    oro: puerta.oro,
    niveles,
    nivelPrevio,
    nivel: estado.jugador.nivel,
    titulosNuevos: revisarTitulos(estado),
  };
}
