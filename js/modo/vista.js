/* ==========================================================================
   Feature: modo — pintado. Aplica la cara elegida: marca el body, traduce
   todos los rótulos fijos del HTML (los que llevan data-t) y actualiza el
   interruptor de la cabecera.
   ========================================================================== */

import { termino } from './catalogo.js';

const $ = (selector) => document.querySelector(selector);

let modoActual = 'sistema';

/** La palabra de esta clave en el modo que está puesto. */
export const t = (clave) => termino(clave, modoActual);

export const modoPuesto = () => modoActual;

export const elModo = { boton: $('#btn-modo') };

export function aplicarModo(modo) {
  modoActual = modo === 'sales' ? 'sales' : 'sistema';
  document.body.dataset.modo = modoActual;

  // Todos los rótulos fijos del HTML se traducen de una pasada.
  for (const nodo of document.querySelectorAll('[data-t]')) {
    nodo.textContent = t(nodo.dataset.t);
  }

  elModo.boton.textContent = t('cambiarModo');
  elModo.boton.setAttribute('aria-label', `Cambiar a ${modoActual === 'sales' ? 'modo Sistema' : 'modo Sales'}`);
}
