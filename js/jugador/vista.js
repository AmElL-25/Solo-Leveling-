/* ==========================================================================
   Feature: progresión del jugador — pintado de la ventana de estado
   (nombre, rango, nivel, experiencia, vida, maná, fatiga, poder de combate)
   y del reparto de estadísticas.
   ========================================================================== */

import {
  STATS, xpNecesaria, rango, vidaMaxima, manaMaximo, vidaActual, manaActual, poderCombate,
} from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elJugador = {
  nombre: $('#nombre-jugador'),
  btnNombre: $('#btn-nombre'),
  rango: $('#rango'),
  nivel: $('#nivel'),
  clase: $('#clase'),
  xpBarra: $('#xp-barra'),
  xpTexto: $('#xp-texto'),
  hpTexto: $('#hp-texto'),
  mpTexto: $('#mp-texto'),
  fatigaTexto: $('#fatiga-texto'),
  poder: $('#poder'),
  racha: $('#racha'),
  dias: $('#dias'),
  oro: $('#oro'),
  puntosFicha: $('#puntos-ficha'),
  fichaStats: $('#ficha-stats'),
  stats: $('#lista-stats'),
  insigniaPuntos: $('#insignia-puntos'),
  avisoPuntos: $('#aviso-puntos'),
};

export function renderVentanaEstado(jugador, area = 'personal') {
  const necesaria = xpNecesaria(jugador.nivel);

  elJugador.nombre.textContent = jugador.nombre;
  elJugador.rango.textContent = rango(jugador.nivel);
  elJugador.nivel.textContent = jugador.nivel;
  elJugador.xpBarra.style.width = `${Math.min(100, (jugador.xp / necesaria) * 100)}%`;
  elJugador.xpTexto.textContent = `${jugador.xp} / ${necesaria}`;

  elJugador.hpTexto.textContent = `${vidaActual(jugador)}/${vidaMaxima(jugador)}`;
  elJugador.mpTexto.textContent = `${manaActual(jugador)}/${manaMaximo(jugador)}`;
  elJugador.fatigaTexto.textContent = `${jugador.fatiga}`;

  elJugador.poder.textContent = poderCombate(jugador);
  // La racha que se enseña es la del carril que estás mirando.
  elJugador.racha.textContent = jugador.rachas[area] ?? 0;
  elJugador.dias.textContent = jugador.diasCompletados;
  elJugador.oro.textContent = jugador.oro;
  elJugador.puntosFicha.textContent = jugador.puntosLibres;

  // Las estadísticas de la ficha son de lectura: se reparten en la pestaña ESTADO.
  elJugador.fichaStats.innerHTML = STATS.map((s) => `
    <p class="ficha__dato"><span>${s.nombre.toUpperCase()}:</span><strong>${jugador.stats[s.id]}</strong></p>
  `).join('');
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
