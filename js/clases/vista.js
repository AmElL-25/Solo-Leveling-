/* ==========================================================================
   Feature: clases — pintado del bloque de clase y del diálogo de elección.
   ========================================================================== */

import { CLASES, NIVEL_CAMBIO_CLASE, buscarClase } from './catalogo.js';
import { puedeCambiarClase } from './reglas.js';
import { STATS } from '../jugador/reglas.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const nombreStat = (id) => STATS.find((s) => s.id === id)?.nombre ?? id;

const dlg = $('#dlg-clase');

export const elClases = {
  bloque: $('#bloque-clase'),
  lista: $('#lista-clases'),
  etiqueta: $('#clase'),
  btnCancelar: $('#btn-cancelar-clase'),
};

export function renderClase(jugador) {
  const clase = buscarClase(jugador.clase);
  elClases.etiqueta.textContent = clase ? clase.nombre : 'Sin clase';

  if (clase) {
    elClases.bloque.innerHTML = `
      <div class="stat">
        <span class="stat__nombre">${escapar(clase.nombre)}<small>${escapar(clase.descripcion)}</small></span>
        <span class="stat__valor">${escapar(nombreStat(clase.stat)).slice(0, 3).toUpperCase()}</span>
      </div>`;
    return;
  }

  elClases.bloque.innerHTML = puedeCambiarClase(jugador)
    ? `<p class="alerta">Has alcanzado el nivel ${NIVEL_CAMBIO_CLASE}. El Sistema te ofrece una clase.</p>
       <button class="boton boton--primario" id="btn-clase" type="button" style="width:100%">ELEGIR CLASE</button>`
    : `<p class="vacio">El cambio de clase se desbloquea al llegar al nivel ${NIVEL_CAMBIO_CLASE}.</p>`;
}

export function renderDialogoClases() {
  elClases.lista.innerHTML = CLASES.map((clase) => `
    <button class="clase-item" type="button" data-clase="${clase.id}">
      <span>
        <strong>${escapar(clase.nombre)}</strong>
        <small>${escapar(clase.descripcion)}</small>
      </span>
      <span class="titulo-item__bono">${escapar(nombreStat(clase.stat))}</span>
    </button>`).join('');
}

export const abrirDialogoClase = () => dlg.showModal();
export const cerrarDialogoClase = () => dlg.close();
