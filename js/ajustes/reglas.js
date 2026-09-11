/* ==========================================================================
   Feature: ajustes. Preferencias del jugador: sonido, efecto de máquina de
   escribir, modo de la app y horario en el que cambia sola.
   ========================================================================== */

import { normalizarModo, normalizarHorario, normalizarForzado, estadoInicialHorario } from '../modo/reglas.js';

export function estadoInicialAjustes() {
  return {
    sonido: true,
    animaciones: true,
    // Qué parte del día hay que cumplir para que cuente. Perfección no.
    umbral: 0.8,
    modo: 'sistema',
    horario: estadoInicialHorario(),
    forzado: null,
  };
}

export function normalizarAjustes(ajustes) {
  // Antes esto se llamaba "tema" y su valor de oficina era "sobrio".
  const modo = ajustes?.modo ?? (ajustes?.tema === 'sobrio' ? 'sales' : ajustes?.tema);
  return {
    sonido: ajustes?.sonido !== false,
    animaciones: ajustes?.animaciones !== false,
    umbral: Math.min(1, Math.max(0.5, Number(ajustes?.umbral) || 0.8)),
    modo: normalizarModo(modo),
    horario: normalizarHorario(ajustes?.horario),
    forzado: normalizarForzado(ajustes?.forzado),
  };
}

/** En modo SALES la app no suena ni escribe letra a letra, sin perder tus ajustes. */
export const sonidoActivo = (ajustes, modo) => ajustes.sonido && modo !== 'sales';
export const textoAnimado = (ajustes, modo) => ajustes.animaciones && modo !== 'sales';
