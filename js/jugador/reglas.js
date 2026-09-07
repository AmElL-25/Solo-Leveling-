/* ==========================================================================
   Feature: progresión del jugador. Nivel, experiencia, rango, estadísticas
   y los puntos que se reparten entre ellas. Funciones puras sobre el
   objeto "jugador"; no tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { TITULOS } from '../titulos/catalogo.js';
import { CLASES, buscarClase } from '../clases/catalogo.js';
import { buscarTitulo } from '../titulos/catalogo.js';

export const STATS = [
  { id: 'fuerza',       nombre: 'Fuerza',       abrev: 'FUE' },
  { id: 'agilidad',     nombre: 'Agilidad',     abrev: 'AGI' },
  { id: 'vitalidad',    nombre: 'Vitalidad',    abrev: 'VIT' },
  { id: 'inteligencia', nombre: 'Inteligencia', abrev: 'INT' },
  { id: 'percepcion',   nombre: 'Percepción',   abrev: 'PER' },
];

export const PUNTOS_POR_NIVEL = 3; // puntos de estadística que da cada nivel
export const FATIGA_MISION = 12;   // fatiga que deja completar un objetivo

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

export function estadoInicialJugador() {
  const stats = {};
  for (const s of STATS) stats[s.id] = 10;
  return {
    nombre: 'Jugador',
    nivel: 1,
    xp: 0,
    puntosLibres: 0,
    racha: 0,
    mejorRacha: 0,
    diasCompletados: 0,
    stats,
    clase: null,
    titulo: 'ninguno',
    titulos: ['ninguno'],
    oro: 0,
    fatiga: 0,
    hp: null,   // null = al máximo; la vida sale de Vitalidad
    mp: null,
    castigosSuperados: 0,
    puertasCerradas: 0,
    jefesDerrotados: 0,
  };
}

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

/** Devuelve siempre un jugador válido, rellenando lo que falte con valores por defecto. */
export function normalizarJugador(jugador) {
  const base = estadoInicialJugador();
  const datos = jugador ?? {};
  const stats = {};
  for (const s of STATS) stats[s.id] = entero(datos.stats?.[s.id], 10, 0);

  const titulos = Array.isArray(datos.titulos)
    ? datos.titulos.filter((id) => TITULOS.some((t) => t.id === id))
    : ['ninguno'];
  if (!titulos.includes('ninguno')) titulos.unshift('ninguno');

  return {
    nombre: String(datos.nombre ?? base.nombre).trim().slice(0, 24) || base.nombre,
    nivel: Math.max(1, entero(datos.nivel, 1, 1)),
    xp: entero(datos.xp, 0, 0),
    puntosLibres: entero(datos.puntosLibres, 0, 0),
    racha: entero(datos.racha, 0, 0),
    mejorRacha: entero(datos.mejorRacha, 0, 0),
    diasCompletados: entero(datos.diasCompletados, 0, 0),
    stats,
    clase: CLASES.some((c) => c.id === datos.clase) ? datos.clase : null,
    titulo: titulos.includes(datos.titulo) ? datos.titulo : 'ninguno',
    titulos,
    oro: entero(datos.oro, 0, 0),
    fatiga: Math.min(100, entero(datos.fatiga, 0, 0)),
    hp: datos.hp === null || datos.hp === undefined ? null : entero(datos.hp, 0, 0),
    mp: datos.mp === null || datos.mp === undefined ? null : entero(datos.mp, 0, 0),
    castigosSuperados: entero(datos.castigosSuperados, 0, 0),
    puertasCerradas: entero(datos.puertasCerradas, 0, 0),
    jefesDerrotados: entero(datos.jefesDerrotados, 0, 0),
  };
}

/* --------------------------- vida, maná y poder --------------------------- */

export const vidaMaxima = (jugador) => 100 + jugador.stats.vitalidad * 12;
export const manaMaximo = (jugador) => 50 + jugador.stats.inteligencia * 10;

export const vidaActual = (jugador) => Math.min(
  vidaMaxima(jugador),
  jugador.hp === null ? vidaMaxima(jugador) : jugador.hp,
);
export const manaActual = (jugador) => Math.min(
  manaMaximo(jugador),
  jugador.mp === null ? manaMaximo(jugador) : jugador.mp,
);

/** El número con el que el Sistema resume lo fuerte que eres. */
export function poderCombate(jugador) {
  const suma = STATS.reduce((total, s) => total + jugador.stats[s.id], 0);
  const bonoClase = buscarClase(jugador.clase) ? 150 : 0;
  return suma * 12 + jugador.nivel * 25 + bonoClase + buscarTitulo(jugador.titulo).bono * 10;
}

/** La fatiga sube al cumplir objetivos y se va al dormir. */
export function sumarFatiga(jugador, cantidad) {
  jugador.fatiga = Math.min(100, Math.max(0, jugador.fatiga + cantidad));
}

/** Suma experiencia y sube tantos niveles como corresponda. Devuelve los niveles ganados. */
export function otorgarXp(jugador, cantidad) {
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

/** Gasta un punto libre en la estadística indicada. Devuelve si se pudo aplicar. */
export function asignarPunto(jugador, statId) {
  if (jugador.puntosLibres <= 0) return false;
  if (!STATS.some((s) => s.id === statId)) return false;
  jugador.stats[statId] += 1;
  jugador.puntosLibres -= 1;
  return true;
}
