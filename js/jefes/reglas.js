/* ==========================================================================
   Feature: jefes semanales — reglas. Un jefe por semana natural (lunes a
   domingo) al que se le hace daño cumpliendo la misión diaria y cerrando
   puertas. No hay combate: el daño sale de lo que el jugador hace de verdad.
   ========================================================================== */

import { fechaHoy, idNuevo, lunesDeLaSemana } from '../nucleo/fecha.js';
import { poderCombate, otorgarXp } from '../jugador/reglas.js';
import { revisarTitulos } from '../titulos/reglas.js';
import {
  NOMBRES_JEFE, RANGOS_JEFE, VIDA_POR_XP_DIARIA, GOLPE_PUERTA,
  RECOMPENSA_XP, RECOMPENSA_ORO,
} from './catalogo.js';

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

const entero = (valor, porDefecto, minimo = 0) => Math.round(num(valor, porDefecto, minimo));

export function normalizarJefe(jefe) {
  if (!jefe || typeof jefe !== 'object' || !jefe.nombre) return null;
  const vidaMaxima = Math.max(1, entero(jefe.vidaMaxima, 1, 1));
  return {
    id: String(jefe.id || idNuevo()),
    nombre: String(jefe.nombre).slice(0, 40),
    rango: String(jefe.rango ?? 'E').slice(0, 1),
    vidaMaxima,
    vida: Math.min(vidaMaxima, entero(jefe.vida, vidaMaxima, 0)),
    semana: String(jefe.semana ?? lunesDeLaSemana()).slice(0, 10),
    derrotado: Boolean(jefe.derrotado),
  };
}

function rangoParaNivel(nivel) {
  const posibles = RANGOS_JEFE.filter((r) => nivel >= r.nivelMin);
  return (posibles[posibles.length - 1] ?? RANGOS_JEFE[0]).rango;
}

/**
 * La vida sale de la propia misión diaria del jugador: quien tenga objetivos
 * más ambiciosos se enfrenta a un jefe más duro, y el reto sigue siendo el
 * mismo para todos: unos seis días de constancia.
 */
export function vidaDelJefe(misiones) {
  const xpDiaria = misiones.reduce((total, m) => total + m.xp, 0);
  return Math.max(100, Math.round(xpDiaria * VIDA_POR_XP_DIARIA));
}

export function generarJefe(estado, semana = lunesDeLaSemana(fechaHoy()), aleatorio = Math.random) {
  const vidaMaxima = vidaDelJefe(estado.misiones);
  return {
    id: idNuevo(),
    nombre: NOMBRES_JEFE[Math.floor(aleatorio() * NOMBRES_JEFE.length)],
    rango: rangoParaNivel(estado.jugador.nivel),
    vidaMaxima,
    vida: vidaMaxima,
    semana,
    derrotado: false,
  };
}

export const jefeVivo = (jefe) => Boolean(jefe) && !jefe.derrotado && jefe.vida > 0;

/**
 * Pone al día el jefe de la semana: si el guardado es de una semana anterior,
 * el que siga vivo escapa y aparece uno nuevo. Devuelve null si el de esta
 * semana ya estaba, así que se puede llamar tantas veces como haga falta.
 */
export function revisarSemana(estado, hoy = fechaHoy(), aleatorio = Math.random) {
  const semana = lunesDeLaSemana(hoy);
  const anterior = estado.jefe;
  if (anterior && anterior.semana === semana) return null;

  const huido = jefeVivo(anterior) ? { nombre: anterior.nombre, rango: anterior.rango } : null;
  estado.jefe = generarJefe(estado, semana, aleatorio);
  return { huido, nuevo: estado.jefe };
}

/** Golpe por cumplir un objetivo: la experiencia de la misión, escalada por el poder. */
export function danoPorMision(jugador, mision) {
  return Math.max(1, Math.round(mision.xp * (1 + poderCombate(jugador) / 1500)));
}

/**
 * Aplica daño (o lo devuelve, si es negativo, al deshacer un objetivo).
 * Cuando el golpe lo mata reparte la recompensa y devuelve el resumen;
 * en cualquier otro caso devuelve null.
 */
export function golpear(estado, dano) {
  const jefe = estado.jefe;
  if (!jefe || jefe.derrotado) return null;

  jefe.vida = Math.min(jefe.vidaMaxima, Math.max(0, jefe.vida - dano));
  if (jefe.vida > 0) return null;

  jefe.derrotado = true;
  const jugador = estado.jugador;
  jugador.jefesDerrotados += 1;

  const xp = Math.round(jefe.vidaMaxima * RECOMPENSA_XP);
  const oro = Math.round(xp * RECOMPENSA_ORO);
  const nivelPrevio = jugador.nivel;
  const niveles = otorgarXp(jugador, xp);
  jugador.oro += oro;

  return {
    nombre: jefe.nombre,
    rango: jefe.rango,
    xp,
    oro,
    niveles,
    nivelPrevio,
    nivel: jugador.nivel,
    titulosNuevos: revisarTitulos(estado),
  };
}

export { GOLPE_PUERTA };
