/* ==========================================================================
   Feature: negocio — reglas. Agrega los indicadores del historial y del día
   en curso para responder a lo que un gerente necesita saber: cuánto llevo
   esta semana, cómo voy frente a la anterior, qué convierto y cuánto me falta
   para la cuota. Funciones puras: no tocan el DOM ni el almacenamiento.
   ========================================================================== */

import { fechaHoy, lunesDeLaSemana } from '../nucleo/fecha.js';
import { INDICADORES, esIndicador } from './catalogo.js';

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

export function indicadoresVacios() {
  const vacio = {};
  for (const indicador of INDICADORES) vacio[indicador.id] = 0;
  return vacio;
}

export function normalizarIndicadores(indicadores) {
  const limpio = indicadoresVacios();
  for (const indicador of INDICADORES) {
    limpio[indicador.id] = Math.round(num(indicadores?.[indicador.id], 0, 0) * 100) / 100;
  }
  return limpio;
}

/** Lo conseguido hoy: el progreso de cada misión sumado a su indicador. */
export function indicadoresDelDia(misiones) {
  const total = indicadoresVacios();
  for (const mision of misiones) {
    if (!esIndicador(mision.indicador)) continue;
    total[mision.indicador] += mision.progreso;
  }
  return normalizarIndicadores(total);
}

/** Objetivo diario declarado en las misiones, por indicador. */
export function objetivosDelDia(misiones) {
  const total = indicadoresVacios();
  for (const mision of misiones) {
    if (!esIndicador(mision.indicador)) continue;
    total[mision.indicador] += mision.objetivo;
  }
  return normalizarIndicadores(total);
}

const restarDias = (fecha, dias) => {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() - dias);
  return fechaHoy(d);
};

/**
 * Días del periodo con sus cifras: el historial para los días cerrados y las
 * misiones en curso para hoy, que aún no está archivado.
 */
function diasDelPeriodo(estado, desde, hasta, hoy) {
  const registro = new Map(estado.historial.map((d) => [d.fecha, d.indicadores]));
  const dias = [];
  for (let fecha = desde; fecha <= hasta; fecha = restarDias(fecha, -1)) {
    if (fecha > hoy) break;
    const cifras = fecha === hoy
      ? indicadoresDelDia(estado.misiones)
      : registro.get(fecha) ?? null;
    if (cifras) dias.push({ fecha, indicadores: normalizarIndicadores(cifras) });
  }
  return dias;
}

function sumar(dias) {
  const total = indicadoresVacios();
  for (const dia of dias) {
    for (const indicador of INDICADORES) total[indicador.id] += dia.indicadores[indicador.id];
  }
  return normalizarIndicadores(total);
}

/** Cierres por cada cien propuestas. Null si todavía no hay propuestas. */
export function conversion(totales) {
  if (!totales.propuestas) return null;
  return Math.round((totales.cierres / totales.propuestas) * 1000) / 10;
}

/** Variación porcentual frente a la semana anterior. Null si no había con qué comparar. */
export function tendencia(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** Resumen de la semana en curso, con la anterior al lado para comparar. */
export function resumenSemana(estado, hoy = fechaHoy()) {
  const lunes = lunesDeLaSemana(hoy);
  const dias = diasDelPeriodo(estado, lunes, hoy, hoy);
  const totales = sumar(dias);

  const lunesPasado = restarDias(lunes, 7);
  const domingoPasado = restarDias(lunes, 1);
  const totalesPrevios = sumar(diasDelPeriodo(estado, lunesPasado, domingoPasado, hoy));

  const media = indicadoresVacios();
  for (const indicador of INDICADORES) {
    media[indicador.id] = dias.length
      ? Math.round((totales[indicador.id] / dias.length) * 10) / 10
      : 0;
  }

  const variacion = {};
  for (const indicador of INDICADORES) {
    variacion[indicador.id] = tendencia(totales[indicador.id], totalesPrevios[indicador.id]);
  }

  return {
    desde: lunes,
    dias: dias.length,
    totales,
    media,
    totalesPrevios,
    variacion,
    conversion: conversion(totales),
    conversionPrevia: conversion(totalesPrevios),
  };
}

/** Resumen del mes natural en curso. */
export function resumenMes(estado, hoy = fechaHoy()) {
  const primero = `${hoy.slice(0, 7)}-01`;
  const dias = diasDelPeriodo(estado, primero, hoy, hoy);
  return { desde: primero, dias: dias.length, totales: sumar(dias) };
}

/* ---------------------------------- cuota ---------------------------------- */

export function estadoInicialCuota() {
  return { objetivo: 0, moneda: 'S/', indicador: 'ingresos' };
}

export function normalizarCuota(cuota) {
  const base = estadoInicialCuota();
  return {
    objetivo: Math.max(0, Math.round(num(cuota?.objetivo, 0, 0))),
    moneda: String(cuota?.moneda ?? base.moneda).slice(0, 4) || base.moneda,
    indicador: esIndicador(cuota?.indicador) ? cuota.indicador : base.indicador,
  };
}

/** Cuánto llevas del objetivo del mes. Se calcula, no se acumula. */
export function progresoCuota(estado, hoy = fechaHoy()) {
  const { objetivo, moneda, indicador } = estado.cuota;
  const conseguido = resumenMes(estado, hoy).totales[indicador] ?? 0;
  return {
    objetivo,
    moneda,
    indicador,
    conseguido,
    falta: Math.max(0, objetivo - conseguido),
    porcentaje: objetivo > 0 ? Math.min(100, Math.round((conseguido / objetivo) * 100)) : 0,
  };
}

export { INDICADORES };
