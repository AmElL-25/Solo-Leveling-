/* ==========================================================================
   Feature: historial de días. Guarda un resumen por cada día ya cerrado
   para pintar el mapa de calor de los últimos 30 días.
   ========================================================================== */

export const MAX_HISTORIAL = 60;

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

export function normalizarEntradaHistorial(entrada) {
  if (!entrada || typeof entrada !== 'object' || !entrada.fecha) return null;
  return {
    fecha: String(entrada.fecha).slice(0, 10),
    porcentaje: Math.min(100, entero(entrada.porcentaje, 0, 0)),
    completado: Boolean(entrada.completado),
    xpGanada: entero(entrada.xpGanada, 0, 0),
  };
}

export function normalizarHistorial(historial) {
  return Array.isArray(historial)
    ? historial.map(normalizarEntradaHistorial).filter(Boolean).slice(0, MAX_HISTORIAL)
    : [];
}

/** Añade una entrada al principio del historial y recorta al máximo permitido. */
export function registrarDia(historial, entrada) {
  historial.unshift(entrada);
  historial.length = Math.min(historial.length, MAX_HISTORIAL);
  return historial;
}
