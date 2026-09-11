/* ==========================================================================
   Feature: la incursión — pintado. Solo DOM: qué se ve y con qué palabras.
   ========================================================================== */

import { t } from '../modo/vista.js';
import { diasHasta, incursionViva } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elIncursion = {
  seccion: $('#seccion-incursion'),
  contenedor: $('#incursion'),
  plazo: $('#incursion-plazo'),
};

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export function renderIncursion(incursion) {
  if (!incursion) {
    elIncursion.plazo.hidden = true;
    elIncursion.contenedor.innerHTML = `<p class="vacio">${t('incursionSinFecha')}</p>`;
    return;
  }

  const dias = diasHasta(incursion.fecha);
  const viva = incursionViva(incursion);
  // La barra se llena según lo preparado, no según lo que queda: aquí no se
  // mata a nadie, se llega listo.
  const preparado = Math.min(100, Math.max(0,
    ((incursion.vidaMaxima - incursion.vida) / incursion.vidaMaxima) * 100));

  elIncursion.plazo.hidden = false;
  elIncursion.plazo.textContent = dias > 0
    ? plural(dias, 'día', 'días')
    : (incursion.derrotada ? 'superada' : 'hoy es el día');

  const estado = incursion.derrotada
    ? t('incursionGanada')
    : (incursion.cerrada ? t('incursionCerrada') : t('incursionViva'));

  elIncursion.contenedor.innerHTML = `
    <div class="incursion ${viva ? '' : 'incursion--cerrada'}">
      <div class="puerta__cabecera">
        <h3>${dias > 0 ? `Faltan ${plural(dias, 'día', 'días')}` : escapar(incursion.nombre)}</h3>
        <span class="puerta__sello puerta__sello--incursion">↑</span>
      </div>
      <p class="tenue">${estado}</p>
      <div class="barra barra--incursion" style="margin:8px 0">
        <div class="barra__relleno" style="width:${preparado}%"></div>
        <span class="barra__texto">${Math.round(preparado)} % de preparación</span>
      </div>
      <div class="puerta__recompensa">
        <span>${escapar(incursion.fecha)}</span>
        <span>${dias > 0 ? `${plural(dias, 'día', 'días')} de plazo` : 'plazo cumplido'}</span>
      </div>
    </div>`;
}
