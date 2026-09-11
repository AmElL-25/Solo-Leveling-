/* ==========================================================================
   Feature: misiones diarias — pintado de la lista de misiones y del
   diálogo de alta y edición. No decide si el día está completo ni reparte
   recompensas: eso es cosa del ciclo diario.
   ========================================================================== */

import { t } from '../modo/vista.js';

import { STATS } from '../jugador/reglas.js';
import { INDICADORES, buscarIndicador } from '../negocio/catalogo.js';
import {
  misionCompleta, progresoMision, porcentajeDia,
  delArea, diarias, semanales, obligatorias, AREAS,
} from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elMisiones = {
  lista: $('#lista-misiones'),
  semanales: $('#lista-semanales'),
  seccionSemanales: $('#seccion-semanales'),
  cuposSemana: $('#semana-cupos'),
  otroCarril: $('#otro-carril'),
  diaPorcentaje: $('#dia-porcentaje'),
  btnNueva: $('#btn-nueva'),
  formMision: $('#form-mision'),
  btnCancelar: $('#btn-cancelar-mision'),
};

const NOMBRE_CARRIL = { personal: 'EL SISTEMA', profesional: 'SALES' };

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/** Muestra 10 en vez de 10.00, pero conserva 2.5. */
const numero = (valor) => (Number.isInteger(valor) ? String(valor) : String(Math.round(valor * 100) / 100));

const nombreStat = (id) => STATS.find((s) => s.id === id)?.nombre ?? id;

/**
 * Pinta solo el carril que se está mirando. El otro queda resumido en una
 * línea con un toque para cambiar: el agua y los pasos se hacen en horario de
 * oficina y hay que poder apuntarlos sin pelearse con el modo.
 */
export function renderMisiones(misiones, area = 'personal') {
  const delDia = diarias(delArea(misiones, area));
  const cupos = semanales(delArea(misiones, area));

  elMisiones.diaPorcentaje.textContent = `${Math.round(porcentajeDia(misiones, area) * 100)}%`;
  elMisiones.lista.innerHTML = delDia.length
    ? delDia.map(tarjetaMision).join('')
    : '<p class="vacio">Sin objetivos diarios en este carril. Créalos desde el engranaje.</p>';

  elMisiones.seccionSemanales.hidden = cupos.length === 0;
  // Vaciar de verdad: si se queda el marcado de la plantilla anterior, sigue
  // ahí aunque no se vea.
  if (!cupos.length) elMisiones.semanales.innerHTML = '';
  if (cupos.length) {
    const hechos = obligatorias(cupos).filter(misionCompleta).length;
    elMisiones.cuposSemana.textContent = `${hechos} / ${obligatorias(cupos).length}`;
    elMisiones.semanales.innerHTML = cupos.map(tarjetaMision).join('');
  }

  renderOtroCarril(misiones, area);
}

function renderOtroCarril(misiones, area) {
  const otra = AREAS.find((a) => a !== area);
  const suyas = diarias(obligatorias(delArea(misiones, otra)));
  elMisiones.otroCarril.hidden = suyas.length === 0;
  if (!suyas.length) return;

  const hechas = suyas.filter(misionCompleta).length;
  elMisiones.otroCarril.innerHTML = `
    <span class="otro-carril__nombre">${NOMBRE_CARRIL[otra]}</span>
    <span class="otro-carril__dato">${hechas} de ${suyas.length} hoy</span>
    <span class="otro-carril__ir" aria-hidden="true">→</span>`;
  elMisiones.otroCarril.setAttribute('aria-label', `Cambiar a ${NOMBRE_CARRIL[otra]}`);
}

function tarjetaMision(mision) {
  const completa = misionCompleta(mision);
  const indicador = buscarIndicador(mision.indicador);
  const ancho = progresoMision(mision) * 100;
  const unidad = mision.unidad ? ` ${escapar(mision.unidad)}` : '';

  const controles = mision.tipo === 'checkbox'
    ? `<button class="boton ${completa ? 'boton--hecho' : ''}" data-accion="alternar" type="button">
         ${completa ? '✔ HECHO' : 'MARCAR COMO HECHO'}
       </button>`
    : `<button class="boton" data-accion="menos" type="button" aria-label="Restar">−</button>
       <input class="paso" data-accion="fijar" type="number" inputmode="decimal" min="0"
              ${mision.opcional ? '' : `max="${mision.objetivo}"`} step="${mision.paso}"
              value="${numero(mision.progreso)}"
              aria-label="Progreso de ${escapar(mision.nombre)}">
       <button class="boton" data-accion="mas" type="button" aria-label="Sumar">+${numero(mision.paso)}</button>`;

  return `
    <article class="mision ${completa ? 'mision--completa' : ''} ${mision.opcional ? 'mision--opcional' : ''}" data-id="${escapar(mision.id)}">
      <div class="mision__cabecera">
        <h3>${escapar(mision.nombre)}</h3>
      </div>
      <div class="barra barra--mision">
        <div class="barra__relleno" style="width:${ancho}%"></div>
        <span class="barra__texto">${numero(mision.progreso)} / ${numero(mision.objetivo)}${unidad}</span>
      </div>
      <div class="mision__controles">${controles}</div>
      <div class="mision__pie">
        <span class="xp">+${mision.xp} XP</span>
        <span>
          ${mision.opcional ? '<span class="etiqueta-mision">OPCIONAL</span>' : ''}
          ${indicador ? `<span class="etiqueta-mision etiqueta-mision--negocio">${escapar(indicador.nombre)}</span>` : ''}
          ${escapar(nombreStat(mision.stat))}
        </span>
      </div>
    </article>`;
}

/** Lista editable del apartado de configuración: aquí sí hay editar y borrar. */
export function renderListaObjetivos(misiones) {
  const lista = $('#lista-objetivos');
  if (!lista) return;
  if (!misiones.length) {
    lista.innerHTML = '<p class="vacio">Todavía no hay objetivos. Crea el primero.</p>';
    return;
  }
  // Agrupados por carril, que es como se piensan y como se editan.
  lista.innerHTML = AREAS.map((area) => {
    const suyas = delArea(misiones, area);
    if (!suyas.length) return '';
    return `<p class="objetivos-grupo">${NOMBRE_CARRIL[area]}</p>${filasObjetivo(suyas)}`;
  }).join('');
}

function filasObjetivo(misiones) {
  return misiones.map((mision) => {
      const indicador = buscarIndicador(mision.indicador);
      const meta = mision.tipo === 'checkbox'
        ? 'hecho / no hecho'
        : `${numero(mision.objetivo)} ${escapar(mision.unidad)}`;
      return `
        <div class="objetivo-fila" data-id="${escapar(mision.id)}">
          <div class="objetivo-fila__texto">
            <strong>${escapar(mision.nombre)}</strong>
            <small>
              ${mision.periodo === 'semana' ? 'cupo semanal · ' : ''}${meta}
              · +${mision.xp} XP · ${escapar(nombreStat(mision.stat))}
              ${indicador ? ` · ${escapar(indicador.nombre)}` : ''}
              ${mision.opcional ? ' · opcional' : ''}
            </small>
          </div>
          <div class="objetivo-fila__acciones">
            <button class="icono" data-accion="editar" type="button" title="Editar" aria-label="Editar ${escapar(mision.nombre)}">&#9998;</button>
            <button class="icono" data-accion="borrar" type="button" title="Borrar" aria-label="Borrar ${escapar(mision.nombre)}">&#10005;</button>
          </div>
        </div>`;
  }).join('');
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
  area: $('#campo-area'),
  periodo: $('#campo-periodo'),
  indicador: $('#campo-indicador'),
  opcional: $('#campo-opcional'),
};

campos.stat.innerHTML = STATS.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join('');
campos.indicador.innerHTML = ['<option value="">Ninguno (solo juego)</option>']
  .concat(INDICADORES.map((i) => `<option value="${i.id}">${i.nombre}</option>`))
  .join('');

function alternarCamposContador() {
  $('#campos-contador').hidden = campos.tipo.value === 'checkbox';
}
campos.tipo.addEventListener('change', alternarCamposContador);

export function abrirDialogoMision(mision = null) {
  $('#dlg-titulo').textContent = mision ? t('dlgEditar') : t('dlgNueva');
  campos.id.value = mision?.id ?? '';
  campos.nombre.value = mision?.nombre ?? '';
  campos.tipo.value = mision?.tipo ?? 'contador';
  campos.objetivo.value = mision?.objetivo ?? 100;
  campos.unidad.value = mision?.unidad ?? 'reps';
  campos.paso.value = mision?.paso ?? 10;
  campos.xp.value = mision?.xp ?? 40;
  campos.stat.value = mision?.stat ?? 'fuerza';
  campos.area.value = mision?.area ?? 'personal';
  campos.periodo.value = mision?.periodo ?? 'dia';
  campos.indicador.value = mision?.indicador ?? '';
  campos.opcional.checked = Boolean(mision?.opcional);
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
    indicador: campos.indicador.value || null,
    opcional: campos.opcional.checked,
    area: campos.area.value === 'profesional' ? 'profesional' : 'personal',
    periodo: campos.periodo.value === 'semana' ? 'semana' : 'dia',
  };
}
