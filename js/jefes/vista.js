/* ==========================================================================
   Feature: jefes semanales — pintado de la tarjeta del jefe: nombre, rango,
   barra de vida y días que quedan de semana.
   ========================================================================== */

import { fechaHoy, lunesDeLaSemana } from '../nucleo/fecha.js';
import { jefeVivo } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const elJefes = {
  contenedor: $('#jefe'),
  rango: $('#jefe-rango'),
};

/** Días que quedan hasta el domingo, contando hoy: lunes 7, domingo 1. */
function diasRestantes(semana, hoy = fechaHoy()) {
  if (lunesDeLaSemana(hoy) !== semana) return 0;
  const dia = new Date(`${hoy}T00:00:00`);
  if (Number.isNaN(dia.getTime())) return 0;
  return 7 - ((dia.getDay() + 6) % 7);
}

export function renderJefe(jefe) {
  elJefes.rango.hidden = !jefe;

  if (!jefe) {
    elJefes.contenedor.innerHTML =
      '<p class="vacio">Ningún jefe a la vista. El próximo lunes aparecerá uno.</p>';
    return;
  }

  elJefes.rango.textContent = `RANGO ${jefe.rango}`;
  const vivo = jefeVivo(jefe);
  const restantes = diasRestantes(jefe.semana);
  const porcentaje = Math.max(0, (jefe.vida / jefe.vidaMaxima) * 100);

  elJefes.contenedor.innerHTML = `
    <div class="jefe ${vivo ? '' : 'jefe--derrotado'}">
      <div class="puerta__cabecera">
        <h3>${escapar(jefe.nombre)}</h3>
        <span class="puerta__sello puerta__sello--jefe">${escapar(jefe.rango)}</span>
      </div>
      <p class="tenue">${vivo
        ? 'Cada objetivo que completas le hace daño. Cierra puertas para pegar más fuerte.'
        : 'Derrotado. El lunes aparecerá otro.'}</p>
      <div class="barra barra--jefe" style="margin:8px 0">
        <div class="barra__relleno" style="width:${porcentaje}%"></div>
        <span class="barra__texto">${jefe.vida} / ${jefe.vidaMaxima} HP</span>
      </div>
      <div class="puerta__recompensa">
        <span class="xp">Recompensa: ${Math.round(jefe.vidaMaxima * 0.25)} XP</span>
        <span class="oro">${Math.round(jefe.vidaMaxima * 0.125)} oro</span>
        <span>${vivo
          ? `${restantes} ${restantes === 1 ? 'día' : 'días'} de plazo`
          : 'semana superada'}</span>
      </div>
    </div>`;
}
