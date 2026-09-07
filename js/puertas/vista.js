/* ==========================================================================
   Feature: puertas — pintado del desafío del día y sus controles.
   ========================================================================== */

import { STATS } from '../jugador/reglas.js';
import { puertaCompleta } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const numero = (valor) => (Number.isInteger(valor) ? String(valor) : String(Math.round(valor * 100) / 100));
const nombreStat = (id) => STATS.find((s) => s.id === id)?.nombre ?? id;

export const elPuertas = {
  contenedor: $('#puerta'),
  rango: $('#puerta-rango'),
};

export function renderPuerta(puerta) {
  elPuertas.rango.hidden = !puerta;

  if (!puerta) {
    elPuertas.contenedor.innerHTML =
      '<p class="vacio">Hoy no se ha abierto ninguna puerta. Mañana será otro día.</p>';
    return;
  }

  elPuertas.rango.textContent = `RANGO ${puerta.rango}`;
  const unidad = puerta.unidad ? ` ${escapar(puerta.unidad)}` : '';

  const controles = puerta.cerrada
    ? '<button class="boton boton--hecho" type="button" disabled>PUERTA CERRADA</button>'
    : puertaCompleta(puerta)
      ? '<button class="boton boton--primario" data-accion="cerrar-puerta" type="button">CERRAR LA PUERTA</button>'
      : `<button class="boton" data-accion="puerta-menos" type="button" aria-label="Restar">−</button>
         <input class="paso" data-accion="puerta-fijar" type="number" inputmode="decimal" min="0"
                max="${puerta.objetivo}" step="${puerta.paso}" value="${numero(puerta.progreso)}"
                aria-label="Progreso de ${escapar(puerta.nombre)}">
         <button class="boton" data-accion="puerta-mas" type="button" aria-label="Sumar">+${numero(puerta.paso)}</button>`;

  elPuertas.contenedor.innerHTML = `
    <div class="puerta ${puerta.cerrada ? 'puerta--cerrada' : ''}">
      <div class="puerta__cabecera">
        <h3>${escapar(puerta.nombre)}</h3>
        <span class="puerta__sello">${escapar(puerta.rango)}</span>
      </div>
      <p class="tenue">${puerta.cerrada
        ? 'Has despejado esta puerta.'
        : 'Desafío opcional: no penaliza si lo dejas pasar, pero la recompensa se pierde a medianoche.'}</p>
      <div class="barra barra--mision" style="margin:8px 0">
        <div class="barra__relleno" style="width:${Math.min(100, (puerta.progreso / puerta.objetivo) * 100)}%"></div>
        <span class="barra__texto">${numero(puerta.progreso)} / ${numero(puerta.objetivo)}${unidad}</span>
      </div>
      <div class="mision__controles">${controles}</div>
      <div class="puerta__recompensa">
        <span class="xp">+${puerta.xp} XP</span>
        <span class="oro">+${puerta.oro} oro</span>
        <span>${escapar(nombreStat(puerta.stat))}</span>
      </div>
    </div>`;
}
