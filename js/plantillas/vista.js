/* ==========================================================================
   Feature: plantillas — lista de sets de misiones para elegir.
   ========================================================================== */

import { PLANTILLAS } from './catalogo.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const elPlantillas = { lista: $('#lista-plantillas') };

export function renderPlantillas() {
  elPlantillas.lista.innerHTML = PLANTILLAS.map((plantilla) => `
    <button class="titulo-item" type="button" data-plantilla="${plantilla.id}">
      <span>
        <strong>${escapar(plantilla.nombre)}</strong>
        <small>${escapar(plantilla.descripcion)}</small>
      </span>
      <span class="titulo-item__bono">${plantilla.misiones.length} misiones</span>
    </button>`).join('');
}
