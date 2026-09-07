/* ==========================================================================
   Feature: negocio — el cuadro de mando: lo que un gerente mira el viernes.
   Totales de la semana por indicador, media diaria, variación frente a la
   semana anterior, tasa de conversión y avance de la cuota del mes.
   ========================================================================== */

import { INDICADORES, buscarIndicador } from './catalogo.js';
import { resumenSemana, resumenMes, progresoCuota, objetivosDelDia } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export const elNegocio = {
  semana: $('#cuadro-semana'),
  resumen: $('#cuadro-resumen'),
  cuota: $('#cuadro-cuota'),
  mes: $('#cuadro-mes'),
};

const numero = (valor) => {
  if (!Number.isFinite(valor)) return '0';
  return Number.isInteger(valor) ? valor.toLocaleString('es') : (Math.round(valor * 10) / 10).toLocaleString('es');
};

const importe = (valor, moneda) => `${moneda} ${numero(valor)}`;

/** Flecha con el porcentaje de variación frente a la semana pasada. */
function variacion(porcentaje) {
  if (porcentaje === null) return '<span class="kpi__var kpi__var--nueva">— sin comparar</span>';
  if (porcentaje === 0) return '<span class="kpi__var">= igual</span>';
  const sube = porcentaje > 0;
  return `<span class="kpi__var ${sube ? 'kpi__var--sube' : 'kpi__var--baja'}">
    ${sube ? '▲' : '▼'} ${Math.abs(porcentaje)} %</span>`;
}

export function renderCuadro(estado) {
  const semana = resumenSemana(estado);
  const mes = resumenMes(estado);
  const cuota = progresoCuota(estado);
  const objetivosDia = objetivosDelDia(estado.misiones);
  const moneda = estado.cuota.moneda;

  elNegocio.semana.textContent = `Semana del ${semana.desde} · ${semana.dias} ${semana.dias === 1 ? 'día' : 'días'}`;

  // Solo se enseñan los indicadores que el jugador usa en alguna misión.
  const enUso = INDICADORES.filter((i) => objetivosDia[i.id] > 0 || semana.totales[i.id] > 0);

  elNegocio.resumen.innerHTML = enUso.length
    ? enUso.map((indicador) => {
      const total = semana.totales[indicador.id];
      const objetivo = objetivosDia[indicador.id] * 6; // seis días de trabajo
      const valor = indicador.dinero ? importe(total, moneda) : numero(total);
      return `
        <div class="kpi">
          <p class="kpi__nombre">${escapar(indicador.nombre)}</p>
          <p class="kpi__valor">${valor}</p>
          <p class="kpi__pie">
            ${objetivo > 0 ? `objetivo ${numero(objetivo)} · ` : ''}media ${numero(semana.media[indicador.id])}/día
          </p>
          ${variacion(semana.variacion[indicador.id])}
        </div>`;
    }).join('')
    : `<p class="vacio">Ninguna misión tiene indicador de negocio todavía.
       Edita una misión y elige a qué aporta.</p>`;

  const conv = semana.conversion;
  const convPrevia = semana.conversionPrevia;
  elNegocio.mes.innerHTML = `
    <p class="ficha__dato ficha__dato--ancho">
      <span>CONVERSIÓN (SEMANA):</span>
      <strong>${conv === null ? 'sin propuestas' : `${conv} %`}</strong>
    </p>
    <p class="ficha__dato ficha__dato--ancho">
      <span>SEMANA ANTERIOR:</span>
      <strong>${convPrevia === null ? '—' : `${convPrevia} %`}</strong>
    </p>
    <p class="ficha__dato ficha__dato--ancho">
      <span>MES (${escapar(mes.desde.slice(0, 7))}):</span>
      <strong>${numero(mes.totales.cierres)} ventas · ${importe(mes.totales.ingresos, moneda)}</strong>
    </p>`;

  elNegocio.cuota.innerHTML = cuota.objetivo > 0
    ? `<div class="barra barra--cuota">
         <div class="barra__relleno" style="width:${cuota.porcentaje}%"></div>
         <span class="barra__texto">${importe(cuota.conseguido, moneda)} / ${importe(cuota.objetivo, moneda)}</span>
       </div>
       <p class="tenue" style="margin-top:8px">
         ${cuota.porcentaje} % de la cuota · faltan ${importe(cuota.falta, moneda)}
       </p>`
    : `<p class="vacio">Sin cuota fijada. Ponla en AJUSTES para ver cuánto te falta cada mes.</p>`;
}

export { buscarIndicador };
