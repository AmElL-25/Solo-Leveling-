/* ==========================================================================
   Feature: ciclo diario. Recompensa por cumplir la misión, racha, cambio de
   día, penalización y la puerta que se abre algunos días. Orquesta al
   jugador, las misiones, las puertas y el historial para resolver el día:
   es el caso de uso que une a las demás features, no una capa técnica.
   ========================================================================== */

import { fechaHoy, diasEntre } from '../nucleo/fecha.js';
import { otorgarXp, xpNecesaria, vidaMaxima, vidaActual } from '../jugador/reglas.js';
import { diaCompleto, porcentajeDia } from '../misiones/reglas.js';
import { registrarDia } from '../historial/reglas.js';
import { multiplicadorXp, oroPorXp } from '../recompensas/reglas.js';
import { revisarTitulos } from '../titulos/reglas.js';
import { generarPuerta, hayPuertaHoy } from '../puertas/reglas.js';
import { revisarSemana } from '../jefes/reglas.js';

export const BONO_DIA = 0.5;         // +50 % de experiencia por completar la misión entera
export const PENALIZACION_XP = 0.10; // se pierde el 10 % de la experiencia del nivel actual
export const PENALIZACION_HP = 0.25; // ...y una cuarta parte de la vida
export const CURACION_DIA = 0.25;    // cumplir el día cura otro tanto

export function estadoInicialDia() {
  return { fecha: fechaHoy(), completado: false, xpGanada: 0, avisado: false };
}

export function estadoInicialCastigo() {
  return { activo: false, desde: null, rachaPerdida: 0 };
}

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

export function normalizarDia(dia) {
  const base = estadoInicialDia();
  const datos = dia ?? {};
  return {
    fecha: String(datos.fecha ?? base.fecha).slice(0, 10),
    completado: Boolean(datos.completado),
    xpGanada: entero(datos.xpGanada, 0, 0),
    avisado: Boolean(datos.avisado),
  };
}

export function normalizarCastigo(castigo) {
  return {
    activo: Boolean(castigo?.activo),
    desde: castigo?.desde ? String(castigo.desde).slice(0, 10) : null,
    rachaPerdida: entero(castigo?.rachaPerdida, 0, 0),
  };
}

/** Lo que pagará hoy la misión diaria, ya con título, clase, castigo y objetos aplicados. */
export function recompensaDia(estado) {
  const base = estado.misiones.reduce(
    (total, m) => total + m.xp * multiplicadorXp(estado, m.stat), 0,
  );
  const total = Math.round(base * (1 + BONO_DIA));
  return {
    base: Math.round(base),
    bono: total - Math.round(base),
    total,
    oro: oroPorXp(total),
  };
}

/**
 * Cierra la misión diaria: experiencia, bono, oro, punto extra y racha.
 * Cumplir el día también cura y saca de la zona de penalización.
 * Devuelve null si el día no está completo o ya se reclamó.
 */
export function completarDia(estado) {
  if (estado.dia.completado || !diaCompleto(estado.misiones)) return null;

  const jugador = estado.jugador;
  const recompensa = recompensaDia(estado);
  const nivelPrevio = jugador.nivel;
  const niveles = otorgarXp(jugador, recompensa.total);

  jugador.oro += recompensa.oro;
  jugador.puntosLibres += 1; // punto extra por cumplir la misión entera
  jugador.racha += 1;
  jugador.mejorRacha = Math.max(jugador.mejorRacha, jugador.racha);
  jugador.diasCompletados += 1;
  jugador.hp = Math.min(
    vidaMaxima(jugador),
    vidaActual(jugador) + Math.round(vidaMaxima(jugador) * CURACION_DIA),
  );

  const salioDelCastigo = estado.castigo.activo;
  if (salioDelCastigo) {
    estado.castigo = estadoInicialCastigo();
    jugador.castigosSuperados += 1;
  }

  const dobleUsado = estado.efectos.dobleXp;
  estado.efectos.dobleXp = false;

  estado.dia.completado = true;
  estado.dia.xpGanada = recompensa.total;

  return {
    ...recompensa,
    niveles,
    nivelPrevio,
    nivel: jugador.nivel,
    racha: jugador.racha,
    salioDelCastigo,
    dobleUsado,
    titulosNuevos: revisarTitulos(estado),
  };
}

/**
 * Archiva el día guardado si ya cambió la fecha, reinicia los progresos, aplica
 * la penalización cuando la misión quedó sin completar y decide si hoy se abre
 * una puerta. Devuelve el resumen de lo ocurrido, o null si seguimos en el mismo día.
 */
export function sincronizarDia(estado, hoy = fechaHoy(), aleatorio = Math.random) {
  const anterior = estado.dia;
  if (anterior.fecha === hoy) return null;

  const porcentaje = Math.round(porcentajeDia(estado.misiones) * 100);
  const resumen = {
    fecha: anterior.fecha,
    completado: anterior.completado,
    porcentaje,
    dias: diasEntre(anterior.fecha, hoy),
    perdida: 0,
    rachaPerdida: 0,
    vidaPerdida: 0,
    puerta: null,
    jefe: null,
  };

  registrarDia(estado.historial, {
    fecha: anterior.fecha,
    porcentaje,
    completado: anterior.completado,
    xpGanada: anterior.xpGanada,
  });

  if (!anterior.completado) {
    const jugador = estado.jugador;
    // Penalización: nunca deja la experiencia en negativo ni baja de nivel.
    const perdida = Math.min(jugador.xp, Math.floor(xpNecesaria(jugador.nivel) * PENALIZACION_XP));
    jugador.xp -= perdida;

    const dano = Math.round(vidaMaxima(jugador) * PENALIZACION_HP);
    jugador.hp = Math.max(1, vidaActual(jugador) - dano);

    resumen.perdida = perdida;
    resumen.vidaPerdida = dano;
    resumen.rachaPerdida = jugador.racha;

    estado.castigo = {
      activo: true,
      desde: hoy,
      rachaPerdida: jugador.racha || estado.castigo.rachaPerdida,
    };
    jugador.racha = 0;
  }

  for (const mision of estado.misiones) mision.progreso = 0;
  estado.jugador.fatiga = 0;
  estado.jugador.mp = null; // el maná se recupera durmiendo
  estado.dia = { fecha: hoy, completado: false, xpGanada: 0, avisado: false };

  // Puerta del día: no siempre se abre una.
  estado.puerta = null;
  if (hayPuertaHoy(aleatorio)) {
    estado.puerta = generarPuerta(estado.jugador.nivel, hoy, aleatorio);
    resumen.puerta = estado.puerta;
  }

  // Si además cambió la semana, el jefe que siguiera vivo escapa y llega otro.
  resumen.jefe = revisarSemana(estado, hoy, aleatorio);

  return resumen;
}
