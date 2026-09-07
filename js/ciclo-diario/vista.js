/* ==========================================================================
   Feature: ciclo diario — el reloj hasta medianoche, el aviso de la misión
   diaria y la banda de la zona de penalización.
   ========================================================================== */

import { msHastaMedianoche } from '../nucleo/fecha.js';
import { diaCompleto } from '../misiones/reglas.js';
import { recompensaDia } from './reglas.js';

const $ = (selector) => document.querySelector(selector);

export const elCicloDiario = {
  reloj: $('#reloj'),
  avisoDiaria: $('#aviso-diaria'),
  btnCompletar: $('#btn-completar'),
  bandaCastigo: $('#banda-castigo'),
  castigoTexto: $('#castigo-texto'),
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

  const { total, oro } = recompensaDia(estado);
  elCicloDiario.avisoDiaria.classList.toggle('alerta--ok', reclamado || completo);
  if (reclamado) {
    elCicloDiario.avisoDiaria.textContent =
      `Recompensa reclamada: +${estado.dia.xpGanada} XP. Vuelve mañana, jugador.`;
  } else if (completo) {
    elCicloDiario.avisoDiaria.textContent =
      `Objetivos cumplidos. Reclama tus ${total} XP y ${oro} de oro antes de medianoche.`;
  } else {
    elCicloDiario.avisoDiaria.textContent =
      'ADVERTENCIA: si no completas la misión diaria recibirás el castigo correspondiente.';
  }
}

export function renderCastigo(castigo) {
  elCicloDiario.bandaCastigo.hidden = !castigo.activo;
  document.body.classList.toggle('en-castigo', castigo.activo);
  if (castigo.activo) {
    elCicloDiario.castigoTexto.textContent =
      'Fallaste la misión diaria. Ganas la mitad de experiencia hasta que completes un día entero.';
  }
}
