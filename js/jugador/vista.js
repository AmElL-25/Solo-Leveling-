/* ==========================================================================
   Feature: progresión del jugador — pintado de la ventana de estado
   (nombre, rango, nivel, experiencia, vida, maná, fatiga, poder de combate)
   y del reparto de estadísticas.
   ========================================================================== */

import {
  STATS, xpNecesaria, rango, vidaMaxima, manaMaximo, vidaActual, manaActual, poderCombate,
} from './reglas.js';

const $ = (selector) => document.querySelector(selector);

const porcentaje = (actual, maximo) => (maximo > 0 ? Math.min(100, (actual / maximo) * 100) : 0);

export const elJugador = {
  nombre: $('#nombre-jugador'),
  btnNombre: $('#btn-nombre'),
  rango: $('#rango'),
  nivel: $('#nivel'),
  xpBarra: $('#xp-barra'),
  xpTexto: $('#xp-texto'),
  hpBarra: $('#hp-barra'),
  hpTexto: $('#hp-texto'),
  mpBarra: $('#mp-barra'),
  mpTexto: $('#mp-texto'),
  fatigaBarra: $('#fatiga-barra'),
  fatigaTexto: $('#fatiga-texto'),
  poder: $('#poder'),
  racha: $('#racha'),
  dias: $('#dias'),
  oro: $('#oro'),
  stats: $('#lista-stats'),
  insigniaPuntos: $('#insignia-puntos'),
  avisoPuntos: $('#aviso-puntos'),
};

export function renderVentanaEstado(jugador) {
  const necesaria = xpNecesaria(jugador.nivel);

  elJugador.nombre.textContent = jugador.nombre;
  elJugador.rango.innerHTML = `<small>RANGO</small>${rango(jugador.nivel)}`;
  elJugador.nivel.textContent = jugador.nivel;
  elJugador.xpBarra.style.width = `${Math.min(100, (jugador.xp / necesaria) * 100)}%`;
  elJugador.xpTexto.textContent = `${jugador.xp} / ${necesaria} XP`;

  const hp = vidaActual(jugador);
  const hpMax = vidaMaxima(jugador);
  elJugador.hpBarra.style.width = `${porcentaje(hp, hpMax)}%`;
  elJugador.hpTexto.textContent = `${hp}/${hpMax}`;

  const mp = manaActual(jugador);
  const mpMax = manaMaximo(jugador);
  elJugador.mpBarra.style.width = `${porcentaje(mp, mpMax)}%`;
  elJugador.mpTexto.textContent = `${mp}/${mpMax}`;

  elJugador.fatigaBarra.style.width = `${jugador.fatiga}%`;
  elJugador.fatigaTexto.textContent = `${jugador.fatiga}`;

  elJugador.poder.textContent = poderCombate(jugador);
  elJugador.racha.textContent = jugador.racha;
  elJugador.dias.textContent = jugador.diasCompletados;
  elJugador.oro.textContent = jugador.oro;
}

export function renderStats(jugador) {
  const { puntosLibres, stats } = jugador;

  elJugador.insigniaPuntos.textContent = `${puntosLibres} ${puntosLibres === 1 ? 'punto' : 'puntos'}`;
  elJugador.avisoPuntos.textContent = puntosLibres > 0
    ? 'Tienes puntos sin repartir. Elige dónde crecer.'
    : 'Sube de nivel o completa la misión diaria para conseguir puntos.';

  elJugador.stats.innerHTML = STATS.map((s) => `
    <div class="stat">
      <span class="stat__nombre">${s.nombre}<small>${s.abrev}</small></span>
      <span class="stat__valor">${stats[s.id]}</span>
      <button class="icono" data-stat="${s.id}" type="button" ${puntosLibres > 0 ? '' : 'disabled'}
              title="Subir ${s.nombre}" aria-label="Subir ${s.nombre}">＋</button>
    </div>`).join('');
}
