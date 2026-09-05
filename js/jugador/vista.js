/* ==========================================================================
   Feature: progresión del jugador — pintado de la ventana de estado
   (nombre, rango, nivel, barra de XP, racha) y del reparto de estadísticas.
   ========================================================================== */

import { STATS, xpNecesaria, rango } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elJugador = {
  nombre: $('#nombre-jugador'),
  btnNombre: $('#btn-nombre'),
  rango: $('#rango'),
  nivel: $('#nivel'),
  xpBarra: $('#xp-barra'),
  xpTexto: $('#xp-texto'),
  racha: $('#racha'),
  mejorRacha: $('#mejor-racha'),
  dias: $('#dias'),
  puntos: $('#puntos'),
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
  elJugador.racha.textContent = jugador.racha;
  elJugador.mejorRacha.textContent = jugador.mejorRacha;
  elJugador.dias.textContent = jugador.diasCompletados;
  elJugador.puntos.textContent = jugador.puntosLibres;
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
