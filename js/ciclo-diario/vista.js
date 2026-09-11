/* ==========================================================================
   Feature: ciclo diario — el reloj hasta medianoche y el aviso de la misión
   diaria. La banda del castigo la pinta su propia feature.
   ========================================================================== */

import { t } from '../modo/vista.js';

import { msHastaMedianoche } from '../nucleo/fecha.js';
import { diaCompleto, porcentajeDia } from '../misiones/reglas.js';
import { recompensaDia, umbralDe } from './reglas.js';

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

export function renderAvisoDiario(estado, area = 'personal') {
  const umbral = umbralDe(estado);
  const completo = diaCompleto(estado.misiones, area, umbral);
  const reclamado = estado.dia.completado[area];

  elCicloDiario.btnCompletar.disabled = !completo || reclamado;
  elCicloDiario.btnCompletar.textContent = reclamado ? t('reclamado') : t('reclamar');
  elCicloDiario.btnCompletar.classList.toggle('boton--hecho', reclamado);

  const { total, oro } = recompensaDia(estado, area);
  elCicloDiario.avisoDiaria.classList.toggle('alerta--ok', reclamado || completo);

  if (reclamado) {
    elCicloDiario.avisoDiaria.textContent =
      `Recompensa reclamada: +${estado.dia.xpGanada[area]} ${t('xp')}. Vuelve mañana.`;
    return;
  }
  if (completo) {
    elCicloDiario.avisoDiaria.textContent =
      `Objetivos cumplidos. Reclama tus ${total} ${t('xp')} y ${oro} de ${t('oroMinuscula')} antes de medianoche.`;
    return;
  }
  // Cuánto falta para el umbral, que es lo que de verdad hay que saber.
  const hecho = Math.round(porcentajeDia(estado.misiones, area) * 100);
  const pide = Math.round(umbral * 100);
  elCicloDiario.avisoDiaria.textContent =
    `${t('avisoPendiente')} Llevas ${hecho} % y el día cuenta a partir del ${pide} %.`;
}
