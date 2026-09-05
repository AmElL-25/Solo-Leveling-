/* ==========================================================================
   Feature: historial de días — pintado del mapa de calor de los últimos
   30 días.
   ========================================================================== */

import { porcentajeDia } from '../misiones/reglas.js';

const $ = (selector) => document.querySelector(selector);
const elHistorial = { lista: $('#historial') };

export function renderHistorial(estado) {
  const registro = new Map(estado.historial.map((d) => [d.fecha, d]));
  const hoy = new Date();
  const celdas = [];

  // Últimos 30 días, del más antiguo al de hoy.
  for (let i = 29; i >= 0; i -= 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    const dia = registro.get(clave);
    const esHoy = i === 0;
    const porcentaje = esHoy ? Math.round(porcentajeDia(estado.misiones) * 100) : dia?.porcentaje ?? null;
    const completado = esHoy ? estado.dia.completado : Boolean(dia?.completado);

    let clase = 'dia';
    if (completado) clase += ' dia--ok';
    else if (porcentaje) clase += ' dia--parcial';
    if (esHoy) clase += ' dia--hoy';

    const detalle = porcentaje === null ? 'sin registro' : `${porcentaje}%`;
    celdas.push(`<div class="${clase}" title="${clave} · ${detalle}"></div>`);
  }

  elHistorial.lista.innerHTML = celdas.join('');
}
