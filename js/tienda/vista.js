/* ==========================================================================
   Feature: tienda — pintado del catálogo y del inventario.
   ========================================================================== */

import { OBJETOS } from './catalogo.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const elTienda = {
  catalogo: $('#lista-tienda'),
  inventario: $('#lista-inventario'),
  oro: $('#oro-tienda'),
};

export function renderTienda(estado) {
  elTienda.oro.textContent = `${estado.jugador.oro} oro`;

  elTienda.catalogo.innerHTML = OBJETOS.map((objeto) => `
    <div class="objeto">
      <span class="objeto__icono">${objeto.icono}</span>
      <span>
        <span class="objeto__nombre">${escapar(objeto.nombre)}</span>
        <span class="objeto__desc">${escapar(objeto.descripcion)}</span>
      </span>
      <button class="boton" data-comprar="${objeto.id}" type="button"
              ${estado.jugador.oro >= objeto.precio ? '' : 'disabled'}>
        <span class="objeto__precio">${objeto.precio}</span>
      </button>
    </div>`).join('');

  const enPosesion = OBJETOS.filter((o) => estado.inventario[o.id] > 0);
  elTienda.inventario.innerHTML = enPosesion.length
    ? enPosesion.map((objeto) => `
      <div class="objeto">
        <span class="objeto__icono">${objeto.icono}</span>
        <span>
          <span class="objeto__nombre">${escapar(objeto.nombre)}</span>
          <span class="objeto__desc">${escapar(objeto.descripcion)}</span>
        </span>
        <span style="display:flex;gap:6px;align-items:center">
          <span class="objeto__cantidad">×${estado.inventario[objeto.id]}</span>
          <button class="boton" data-usar="${objeto.id}" type="button">USAR</button>
        </span>
      </div>`).join('')
    : '<p class="vacio">Inventario vacío.</p>';
}
