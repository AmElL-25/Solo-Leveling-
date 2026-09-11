/* ==========================================================================
   Feature: medidas — pintado. La regla de la casa: el kilo no sale en
   pantalla salvo que se pida expresamente en la configuración. Lo que se ve
   es hacia dónde va.
   ========================================================================== */

import { tendenciaPeso, ultimoPeso, recorridoPeso } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elMedidas = { peso: $('#peso-tendencia') };

const FLECHAS = { baja: '▼', sube: '▲', igual: '=' };
const CLASES = { baja: 'peso--baja', sube: 'peso--sube', igual: '' };

/**
 * Pinta la tendencia. `verNumero` viene de la configuración y por defecto es
 * false: el peso se maneja por dentro.
 */
export function renderPeso(estado, verNumero = false) {
  if (!elMedidas.peso) return;

  const tendencia = tendenciaPeso(estado.medidas);
  const ultimo = ultimoPeso(estado.medidas);

  elMedidas.peso.className = 'ficha__dato ficha__dato--ancho';
  if (!ultimo) {
    elMedidas.peso.innerHTML = '<span>PESO:</span><strong>sin pesar</strong>';
    return;
  }
  if (verNumero) {
    const recorrido = recorridoPeso(estado.medidas);
    const viaje = recorrido === null ? '' : ` (${recorrido > 0 ? '+' : ''}${recorrido} kg)`;
    elMedidas.peso.innerHTML = `<span>PESO:</span><strong>${ultimo.kg} kg${viaje}</strong>`;
    return;
  }
  if (!tendencia) {
    elMedidas.peso.innerHTML = '<span>PESO:</span><strong>registrado</strong>';
    return;
  }

  const texto = { baja: 'bajando', sube: 'subiendo', igual: 'estable' }[tendencia.sentido];
  elMedidas.peso.classList.add(CLASES[tendencia.sentido]);
  elMedidas.peso.innerHTML =
    `<span>PESO:</span><strong>${FLECHAS[tendencia.sentido]} ${texto}</strong>`;
}
