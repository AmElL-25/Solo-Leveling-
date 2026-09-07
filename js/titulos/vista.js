/* ==========================================================================
   Feature: títulos — pintado de la lista y del título equipado.
   ========================================================================== */

import { TITULOS, buscarTitulo } from './catalogo.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const elTitulos = {
  lista: $('#lista-titulos'),
  equipado: $('#titulo-equipado'),
};

export function renderTitulos(jugador) {
  elTitulos.equipado.textContent = buscarTitulo(jugador.titulo).nombre;

  elTitulos.lista.innerHTML = TITULOS.map((titulo) => {
    const tiene = jugador.titulos.includes(titulo.id);
    const activo = jugador.titulo === titulo.id;
    return `
      <button class="titulo-item ${activo ? 'titulo-item--activo' : ''}" type="button"
              data-titulo="${titulo.id}" ${tiene ? '' : 'disabled'}>
        <span>
          <strong>${tiene ? escapar(titulo.nombre) : '???'}</strong>
          <small>${escapar(titulo.descripcion)}</small>
        </span>
        <span class="titulo-item__bono">${titulo.bono > 0 ? `+${titulo.bono}% XP` : '—'}</span>
      </button>`;
  }).join('');
}
