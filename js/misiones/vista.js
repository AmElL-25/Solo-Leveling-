/* ==========================================================================
   Feature: misiones diarias — pintado de la lista de misiones y del
   diálogo de alta y edición. No decide si el día está completo ni reparte
   recompensas: eso es cosa del ciclo diario.
   ========================================================================== */

import { STATS } from '../jugador/reglas.js';
import { misionCompleta, progresoMision, porcentajeDia } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elMisiones = {
  lista: $('#lista-misiones'),
  diaPorcentaje: $('#dia-porcentaje'),
  btnNueva: $('#btn-nueva'),
  formMision: $('#form-mision'),
  btnCancelar: $('#btn-cancelar-mision'),
};

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/** Muestra 10 en vez de 10.00, pero conserva 2.5. */
const numero = (valor) => (Number.isInteger(valor) ? String(valor) : String(Math.round(valor * 100) / 100));

const nombreStat = (id) => STATS.find((s) => s.id === id)?.nombre ?? id;

export function renderMisiones(misiones) {
  elMisiones.diaPorcentaje.textContent = `${Math.round(porcentajeDia(misiones) * 100)}%`;

  elMisiones.lista.innerHTML = misiones.length
    ? misiones.map(tarjetaMision).join('')
    : '<p class="vacio">Sin misiones. Crea la primera para empezar a subir de nivel.</p>';
}

function tarjetaMision(mision) {
  const completa = misionCompleta(mision);
  const ancho = progresoMision(mision) * 100;
  const unidad = mision.unidad ? ` ${escapar(mision.unidad)}` : '';

  const controles = mision.tipo === 'checkbox'
    ? `<button class="boton ${completa ? 'boton--hecho' : ''}" data-accion="alternar" type="button">
         ${completa ? '✔ HECHO' : 'MARCAR COMO HECHO'}
       </button>`
    : `<button class="boton" data-accion="menos" type="button" aria-label="Restar">−</button>
       <input class="paso" data-accion="fijar" type="number" inputmode="decimal" min="0"
              max="${mision.objetivo}" step="${mision.paso}" value="${numero(mision.progreso)}"
              aria-label="Progreso de ${escapar(mision.nombre)}">
       <button class="boton" data-accion="mas" type="button" aria-label="Sumar">+${numero(mision.paso)}</button>`;

  return `
    <article class="mision ${completa ? 'mision--completa' : ''}" data-id="${escapar(mision.id)}">
      <div class="mision__cabecera">
        <h3>${escapar(mision.nombre)}</h3>
        <div class="mision__acciones">
          <button class="icono" data-accion="editar" type="button" title="Editar" aria-label="Editar misión">&#9998;</button>
          <button class="icono" data-accion="borrar" type="button" title="Borrar" aria-label="Borrar misión">&#10005;</button>
        </div>
      </div>
      <div class="barra barra--mision">
        <div class="barra__relleno" style="width:${ancho}%"></div>
        <span class="barra__texto">${numero(mision.progreso)} / ${numero(mision.objetivo)}${unidad}</span>
      </div>
      <div class="mision__controles">${controles}</div>
      <div class="mision__pie">
        <span class="xp">+${mision.xp} XP</span>
        <span>${escapar(nombreStat(mision.stat))}</span>
      </div>
    </article>`;
}

/* --------------------------- diálogo de alta y edición --------------------------- */

const dlg = $('#dlg-mision');
const campos = {
  id: $('#campo-id'),
  nombre: $('#campo-nombre'),
  tipo: $('#campo-tipo'),
  objetivo: $('#campo-objetivo'),
  unidad: $('#campo-unidad'),
  paso: $('#campo-paso'),
  xp: $('#campo-xp'),
  stat: $('#campo-stat'),
};

campos.stat.innerHTML = STATS.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join('');

function alternarCamposContador() {
  $('#campos-contador').hidden = campos.tipo.value === 'checkbox';
}
campos.tipo.addEventListener('change', alternarCamposContador);

export function abrirDialogoMision(mision = null) {
  $('#dlg-titulo').textContent = mision ? 'EDITAR MISIÓN' : 'NUEVA MISIÓN';
  campos.id.value = mision?.id ?? '';
  campos.nombre.value = mision?.nombre ?? '';
  campos.tipo.value = mision?.tipo ?? 'contador';
  campos.objetivo.value = mision?.objetivo ?? 100;
  campos.unidad.value = mision?.unidad ?? 'reps';
  campos.paso.value = mision?.paso ?? 10;
  campos.xp.value = mision?.xp ?? 40;
  campos.stat.value = mision?.stat ?? 'fuerza';
  alternarCamposContador();
  dlg.showModal();
}

export function cerrarDialogoMision() {
  dlg.close();
}

/** Lee el formulario y devuelve los datos listos para reglas.guardarMision(). */
export function leerFormularioMision() {
  const esContador = campos.tipo.value === 'contador';
  return {
    id: campos.id.value,
    nombre: campos.nombre.value.trim(),
    tipo: esContador ? 'contador' : 'checkbox',
    objetivo: esContador ? Math.max(0.5, Number(campos.objetivo.value) || 1) : 1,
    unidad: esContador ? campos.unidad.value.trim() : '',
    paso: esContador ? Math.max(0.5, Number(campos.paso.value) || 1) : 1,
    xp: Math.min(999, Math.max(1, Math.round(Number(campos.xp.value) || 20))),
    stat: campos.stat.value,
  };
}
