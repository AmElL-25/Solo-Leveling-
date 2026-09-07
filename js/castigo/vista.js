/* ==========================================================================
   Feature: castigo — pintado de la banda de penalización y de la misión de
   castigo: aceptarla primero, cumplirla después.
   ========================================================================== */

import { MOTIVOS } from './catalogo.js';
import { castigoCumplido } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const numero = (valor) => (Number.isInteger(valor) ? String(valor) : String(Math.round(valor * 100) / 100));

export const elCastigo = {
  banda: $('#banda-castigo'),
  bandaTexto: $('#castigo-texto'),
  contenedor: $('#castigo'),
  seccion: $('#seccion-castigo'),
};

export function renderCastigo(castigo) {
  const activo = castigo.activo;

  elCastigo.banda.hidden = !activo;
  elCastigo.seccion.hidden = !activo;
  document.body.classList.toggle('en-castigo', activo);

  if (!activo) {
    elCastigo.contenedor.innerHTML = '';
    return;
  }

  elCastigo.bandaTexto.textContent = castigo.aceptado
    ? 'Cumple la misión de castigo. Hasta entonces ganas la mitad de experiencia y no empieza una semana nueva.'
    : 'Acepta el castigo para poder cumplirlo. Hasta entonces la semana no vuelve a empezar.';

  const mision = castigo.mision;
  const unidad = mision.unidad ? ` ${escapar(mision.unidad)}` : '';
  const listo = castigoCumplido(castigo);

  const controles = !castigo.aceptado
    ? `<button class="boton boton--peligro" data-accion="aceptar-castigo" type="button"
               style="width:100%">ACEPTO EL CASTIGO</button>`
    : listo
      ? `<button class="boton boton--primario" data-accion="cumplir-castigo" type="button"
                 style="width:100%">SALDAR LA DEUDA</button>`
      : `<button class="boton" data-accion="castigo-menos" type="button" aria-label="Restar">−</button>
         <input class="paso" data-accion="castigo-fijar" type="number" inputmode="decimal" min="0"
                max="${mision.objetivo}" step="${mision.paso}" value="${numero(mision.progreso)}"
                aria-label="Progreso del castigo">
         <button class="boton" data-accion="castigo-mas" type="button" aria-label="Sumar">+${numero(mision.paso)}</button>`;

  elCastigo.contenedor.innerHTML = `
    <div class="castigo-mision">
      <div class="puerta__cabecera">
        <h3>${escapar(mision.nombre)}</h3>
        <span class="puerta__sello puerta__sello--castigo">!</span>
      </div>
      <p class="tenue">${escapar(MOTIVOS[castigo.origen] ?? MOTIVOS.dia)}
        ${castigo.aceptado ? '' : ' El Sistema espera tu respuesta.'}</p>
      ${castigo.aceptado ? `
      <div class="barra barra--castigo" style="margin:8px 0">
        <div class="barra__relleno" style="width:${Math.min(100, (mision.progreso / mision.objetivo) * 100)}%"></div>
        <span class="barra__texto">${numero(mision.progreso)} / ${numero(mision.objetivo)}${unidad}</span>
      </div>` : ''}
      <div class="mision__controles">${controles}</div>
    </div>`;
}
