/* ==========================================================================
   Feature: modo — reglas. Qué cara toca ahora mismo: la que manda el horario
   laboral, o la que hayas forzado tú con el interruptor. Funciones puras.
   ========================================================================== */

import { MODOS, MODO_INICIAL } from './catalogo.js';

export function estadoInicialHorario() {
  return { activo: false, dias: [1, 2, 3, 4, 5], desde: '09:00', hasta: '18:00' };
}

const hora = (texto, porDefecto) => (/^\d{2}:\d{2}$/.test(texto) ? texto : porDefecto);

export function normalizarHorario(horario) {
  const base = estadoInicialHorario();
  const dias = Array.isArray(horario?.dias)
    ? [...new Set(horario.dias.map(Number).filter((d) => d >= 0 && d <= 6))].sort()
    : base.dias;
  return {
    activo: Boolean(horario?.activo),
    dias: dias.length ? dias : base.dias,
    desde: hora(horario?.desde, base.desde),
    hasta: hora(horario?.hasta, base.hasta),
  };
}

export const normalizarModo = (modo) => (MODOS.includes(modo) ? modo : MODO_INICIAL);

/** El modo que pide el horario: SALES en horas de oficina, SISTEMA fuera. */
export function modoPorHorario(horario, ahora = new Date()) {
  if (!horario.activo) return null;
  if (!horario.dias.includes(ahora.getDay())) return 'sistema';
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const aMinutos = (texto) => {
    const [h, m] = texto.split(':').map(Number);
    return h * 60 + m;
  };
  const desde = aMinutos(horario.desde);
  const hasta = aMinutos(horario.hasta);
  const dentro = desde <= hasta
    ? minutos >= desde && minutos < hasta
    : minutos >= desde || minutos < hasta; // turnos que cruzan la medianoche
  return dentro ? 'sales' : 'sistema';
}

/**
 * El modo que toca ahora. El interruptor manual manda hasta que el horario
 * cambia de tramo: si fuerzas SISTEMA a media mañana, aguanta hasta que
 * termine tu jornada, y entonces el horario vuelve a llevar la voz.
 */
export function modoEfectivo(ajustes, ahora = new Date()) {
  const automatico = modoPorHorario(ajustes.horario, ahora);
  if (!automatico) return normalizarModo(ajustes.modo);

  const forzado = ajustes.forzado;
  if (forzado?.modo && forzado.contra === automatico) return normalizarModo(forzado.modo);
  return automatico;
}

/**
 * Lo que guarda el interruptor manual: el modo elegido y contra qué tramo se
 * eligió, para saber cuándo deja de valer.
 */
export function forzar(ajustes, modo, ahora = new Date()) {
  return { modo: normalizarModo(modo), contra: modoPorHorario(ajustes.horario, ahora) };
}

export function normalizarForzado(forzado) {
  if (!forzado?.modo) return null;
  return { modo: normalizarModo(forzado.modo), contra: MODOS.includes(forzado.contra) ? forzado.contra : null };
}
