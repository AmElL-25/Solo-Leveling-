/* ==========================================================================
   Feature: medidas. El peso es el número que de verdad manda en el objetivo
   físico, y también el que más daño hace verlo cada día. Aquí se guarda y se
   usa por dentro; la pantalla solo enseña hacia dónde va.

   Funciones puras: no tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { fechaHoy } from '../nucleo/fecha.js';

/** Cuántos pesajes se conservan. Suficiente para un año de pesajes semanales. */
const MAX_PESAJES = 60;

/** Por debajo de esto, la báscula es ruido y no una tendencia. */
export const RUIDO_KG = 0.4;

export function estadoInicialMedidas() {
  return { pesajes: [] };
}

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

function normalizarPesaje(pesaje) {
  if (!pesaje || typeof pesaje !== 'object' || !pesaje.fecha) return null;
  const kg = Math.round(num(pesaje.kg, 0, 20) * 10) / 10;
  if (kg < 20 || kg > 400) return null;   // fuera de rango humano: es un dedazo
  return { fecha: String(pesaje.fecha).slice(0, 10), kg };
}

export function normalizarMedidas(medidas) {
  const pesajes = Array.isArray(medidas?.pesajes)
    ? medidas.pesajes.map(normalizarPesaje).filter(Boolean).slice(-MAX_PESAJES)
    : [];
  return { pesajes };
}

/** Guarda un pesaje. Dos el mismo día se pisan: vale el último. */
export function registrarPeso(estado, kg, hoy = fechaHoy()) {
  const pesaje = normalizarPesaje({ fecha: hoy, kg });
  if (!pesaje) return null;

  const pesajes = estado.medidas.pesajes.filter((p) => p.fecha !== pesaje.fecha);
  pesajes.push(pesaje);
  pesajes.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  estado.medidas.pesajes = pesajes.slice(-MAX_PESAJES);
  return pesaje;
}

export const ultimoPeso = (medidas) => medidas.pesajes.at(-1) ?? null;

/**
 * Hacia dónde va, comparado con el pesaje anterior. Devuelve el sentido y la
 * diferencia, pero quien pinta decide si enseña el número o solo la flecha.
 */
export function tendenciaPeso(medidas) {
  const { pesajes } = medidas;
  if (pesajes.length < 2) return null;

  const actual = pesajes.at(-1);
  const previo = pesajes.at(-2);
  const diferencia = Math.round((actual.kg - previo.kg) * 10) / 10;

  let sentido = 'igual';
  if (diferencia <= -RUIDO_KG) sentido = 'baja';
  else if (diferencia >= RUIDO_KG) sentido = 'sube';

  return { sentido, diferencia, desde: previo.fecha, hasta: actual.fecha };
}

/** Diferencia con el primer pesaje: el viaje entero, sin enseñar kilos. */
export function recorridoPeso(medidas) {
  const { pesajes } = medidas;
  if (pesajes.length < 2) return null;
  return Math.round((pesajes.at(-1).kg - pesajes[0].kg) * 10) / 10;
}
