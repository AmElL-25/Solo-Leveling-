/* ==========================================================================
   Feature: ciclo diario — el reloj hasta medianoche y el aviso de la
   misión diaria (progreso y botón de reclamar recompensa).
   ========================================================================== */

import { msHastaMedianoche } from '../nucleo/fecha.js';
import { diaCompleto } from '../misiones/reglas.js';
import { recompensaDia } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elCicloDiario = {
  reloj: $('#reloj'),
  avisoDiaria: $('#aviso-diaria'),
  btnCompletar: $('#btn-completar'),
};

export function renderReloj() {
  const restante = msHastaMedianoche();
  const horas = Math.floor(restante / 3600000);
  const minutos = Math.floor((restante % 3600000) / 60000);
  elCicloDiario.reloj.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

export function renderAvisoDiario(estado) {
  const completo = diaCompleto(estado.misiones);
  const reclamado = estado.dia.completado;

  elCicloDiario.btnCompletar.disabled = !completo || reclamado;
  elCicloDiario.btnCompletar.textContent = reclamado ? 'MISIÓN DIARIA COMPLETADA' : 'RECLAMAR RECOMPENSA';
  elCicloDiario.btnCompletar.classList.toggle('boton--hecho', reclamado);

  const { total } = recompensaDia(estado.misiones);
  elCicloDiario.avisoDiaria.classList.toggle('alerta--ok', reclamado || completo);
  if (reclamado) {
    elCicloDiario.avisoDiaria.textContent = `Recompensa reclamada: +${estado.dia.xpGanada} XP. Vuelve mañana, jugador.`;
  } else if (completo) {
    elCicloDiario.avisoDiaria.textContent = `Objetivos cumplidos. Reclama tus ${total} XP antes de medianoche.`;
  } else {
    elCicloDiario.avisoDiaria.textContent = 'Completa todas las misiones antes de medianoche o serás penalizado.';
  }
}
