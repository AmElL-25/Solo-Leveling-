/* ==========================================================================
   Feature: ciclo diario. Recompensa por cumplir el día, racha, cambio de
   día, penalización y la puerta que se abre algunos días. Orquesta al
   jugador, las misiones, las puertas y el historial para resolver el día:
   es el caso de uso que une a las demás features, no una capa técnica.

   Todo lo de aquí se resuelve por carril. Un día en el que entrenaste pero
   no escuchaste a ningún cliente no es un día cumplido a medias: es un día
   cumplido en lo personal y fallado en lo profesional.
   ========================================================================== */

import { fechaHoy, diasEntre, lunesDeLaSemana } from '../nucleo/fecha.js';
import { otorgarXp, xpNecesaria, vidaMaxima, vidaActual, sumarRacha } from '../jugador/reglas.js';
import {
  diaCompleto, porcentajeDia, misionCompleta, diarias, semanales,
  delArea, obligatorias, carrilesActivos, anotarCumplimiento, revisarObjetivos,
  UMBRAL_CUMPLIDO, UMBRAL_CASTIGO,
} from '../misiones/reglas.js';
import { registrarDia } from '../historial/reglas.js';
import { multiplicadorXp, oroPorXp } from '../recompensas/reglas.js';
import { revisarTitulos } from '../titulos/reglas.js';
import { generarPuerta, hayPuertaHoy } from '../puertas/reglas.js';
import { revisarSemana } from '../jefes/reglas.js';
import { asignarCastigo } from '../castigo/reglas.js';
import { indicadoresDelDia } from '../negocio/reglas.js';

export const BONO_DIA = 0.5;         // +50 % de experiencia por cumplir el día
export const PENALIZACION_XP = 0.10; // se pierde el 10 % de la experiencia del nivel actual
export const PENALIZACION_HP = 0.25; // ...y una cuarta parte de la vida
export const CURACION_DIA = 0.25;    // cumplir el día cura otro tanto

const porCarril = (valor = false) => ({ personal: valor, profesional: valor });

export function estadoInicialDia() {
  return {
    fecha: fechaHoy(),
    semana: lunesDeLaSemana(),
    completado: porCarril(false),
    xpGanada: porCarril(0),
    avisado: false,
  };
}

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

/* Los guardados de antes traían un booleano y un número sueltos, cuando solo
   había un carril. Ese valor pasa a ser el del carril personal. */
const migrarBandera = (valor, viejo) =>
  (valor && typeof valor === 'object'
    ? { personal: Boolean(valor.personal), profesional: Boolean(valor.profesional) }
    : { personal: Boolean(viejo), profesional: false });

const migrarNumero = (valor, viejo) =>
  (valor && typeof valor === 'object'
    ? { personal: entero(valor.personal, 0, 0), profesional: entero(valor.profesional, 0, 0) }
    : { personal: entero(viejo, 0, 0), profesional: 0 });

export function normalizarDia(dia) {
  const base = estadoInicialDia();
  const datos = dia ?? {};
  return {
    fecha: String(datos.fecha ?? base.fecha).slice(0, 10),
    semana: String(datos.semana ?? lunesDeLaSemana(String(datos.fecha ?? base.fecha))).slice(0, 10),
    completado: migrarBandera(datos.completado, datos.completado),
    xpGanada: migrarNumero(datos.xpGanada, datos.xpGanada),
    avisado: Boolean(datos.avisado),
  };
}

export const umbralDe = (estado) => num(estado.ajustes?.umbral, UMBRAL_CUMPLIDO, 0.5);

/** Lo que pagará hoy el carril, ya con título, clase, castigo y objetos aplicados. */
export function recompensaDia(estado, area) {
  // Los cupos de la semana se cobran al cerrarlos, no aquí.
  const delDia = diarias(delArea(estado.misiones, area));
  // Las opcionales solo pagan si se cumplieron.
  const cobrables = delDia.filter((m) => !m.opcional || misionCompleta(m));
  const base = cobrables.reduce(
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

/** Lo que paga cerrar un cupo semanal, en el momento de cerrarlo. */
export function recompensaSemanal(estado, mision) {
  const xp = Math.round(mision.xp * multiplicadorXp(estado, mision.stat));
  return { xp, oro: oroPorXp(xp) };
}

/**
 * Cierra el día de un carril: experiencia, bono, oro, punto extra y racha.
 * Cumplir también cura. Devuelve null si el carril no llegó al umbral o ya
 * se reclamó.
 */
export function completarDia(estado, area) {
  if (estado.dia.completado[area]) return null;
  if (!diaCompleto(estado.misiones, area, umbralDe(estado))) return null;

  const jugador = estado.jugador;
  const recompensa = recompensaDia(estado, area);
  const nivelPrevio = jugador.nivel;
  const niveles = otorgarXp(jugador, recompensa.total);

  jugador.oro += recompensa.oro;
  jugador.puntosLibres += 1; // punto extra por cerrar el carril
  const racha = sumarRacha(jugador, area);
  jugador.diasCompletados += 1;
  jugador.hp = Math.min(
    vidaMaxima(jugador),
    vidaActual(jugador) + Math.round(vidaMaxima(jugador) * CURACION_DIA),
  );

  const dobleUsado = estado.efectos.dobleXp;
  estado.efectos.dobleXp = false;

  estado.dia.completado[area] = true;
  estado.dia.xpGanada[area] = recompensa.total;

  return {
    ...recompensa,
    area,
    niveles,
    nivelPrevio,
    nivel: jugador.nivel,
    racha,
    dobleUsado,
    titulosNuevos: revisarTitulos(estado),
  };
}

/**
 * Juzga un carril al cerrar el día. Tres tramos, para que fallar una cosa de
 * siete no cueste lo mismo que no hacer nada:
 *   - por encima del umbral: cumplido;
 *   - entre el 50 % y el umbral: se pierde la racha, sin castigo;
 *   - por debajo del 50 %: castigo.
 */
function juzgarCarril(estado, area, hoy, aleatorio, umbral) {
  const jugador = estado.jugador;
  const porcentaje = porcentajeDia(estado.misiones, area);
  const balance = {
    area,
    porcentaje: Math.round(porcentaje * 100),
    cumplido: estado.dia.completado[area],
    perdida: 0,
    vidaPerdida: 0,
    rachaPerdida: 0,
    castigo: null,
  };

  if (estado.dia.completado[area] || porcentaje >= umbral) return balance;

  balance.rachaPerdida = jugador.rachas[area] ?? 0;

  if (porcentaje < UMBRAL_CASTIGO) {
    // Penalización: nunca deja la experiencia en negativo ni baja de nivel.
    const perdida = Math.min(jugador.xp, Math.floor(xpNecesaria(jugador.nivel) * PENALIZACION_XP));
    jugador.xp -= perdida;

    const dano = Math.round(vidaMaxima(jugador) * PENALIZACION_HP);
    jugador.hp = Math.max(1, vidaActual(jugador) - dano);

    balance.perdida = perdida;
    balance.vidaPerdida = dano;
    balance.castigo = asignarCastigo(estado, 'dia', area, hoy, aleatorio);
  }

  jugador.rachas[area] = 0;
  return balance;
}

/**
 * Archiva el día guardado si ya cambió la fecha, reinicia los progresos, juzga
 * cada carril y decide si hoy se abre una puerta. Los cupos semanales no se
 * reinician a medianoche: aguantan hasta que cambia el lunes.
 * Devuelve el resumen de lo ocurrido, o null si seguimos en el mismo día.
 */
export function sincronizarDia(estado, hoy = fechaHoy(), aleatorio = Math.random) {
  const anterior = estado.dia;
  if (anterior.fecha === hoy) return null;

  const umbral = umbralDe(estado);
  const carriles = carrilesActivos(estado.misiones);
  const balances = carriles.map((area) => juzgarCarril(estado, area, hoy, aleatorio, umbral));

  const porcentaje = Math.round(porcentajeDia(estado.misiones) * 100);
  const resumen = {
    fecha: anterior.fecha,
    completado: carriles.length > 0 && carriles.every((a) => anterior.completado[a]),
    porcentaje,
    balances,
    dias: diasEntre(anterior.fecha, hoy),
    semanaNueva: false,
    objetivos: [],
    puerta: null,
    jefe: null,
    castigo: balances.find((b) => b.castigo)?.castigo ?? null,
  };

  registrarDia(estado.historial, {
    fecha: anterior.fecha,
    porcentaje,
    completado: resumen.completado,
    xpGanada: anterior.xpGanada.personal + anterior.xpGanada.profesional,
    indicadores: indicadoresDelDia(estado.misiones),
  });

  // Se anota antes de borrar nada: es lo que alimenta la revisión del lunes.
  anotarCumplimiento(estado.misiones);

  const semana = lunesDeLaSemana(hoy);
  if (semana !== anterior.semana) {
    resumen.objetivos = revisarObjetivos(estado.misiones);
    resumen.semanaNueva = true;
  }

  // Lo diario vuelve a cero cada noche; lo semanal, solo al cambiar el lunes.
  for (const mision of diarias(estado.misiones)) mision.progreso = 0;
  if (resumen.semanaNueva) {
    for (const mision of semanales(estado.misiones)) mision.progreso = 0;
  }

  estado.jugador.fatiga = 0;
  estado.jugador.mp = null; // el maná se recupera durmiendo
  estado.dia = {
    fecha: hoy,
    semana,
    completado: porCarril(false),
    xpGanada: porCarril(0),
    avisado: false,
  };

  // Puerta del día: no siempre se abre una.
  estado.puerta = null;
  if (hayPuertaHoy(aleatorio)) {
    estado.puerta = generarPuerta(estado.jugador.nivel, hoy, aleatorio);
    resumen.puerta = estado.puerta;
  }

  // Si además cambió la semana, el jefe que siguiera vivo escapa y llega otro.
  resumen.jefe = revisarSemana(estado, hoy, aleatorio);
  if (resumen.jefe?.huido) {
    resumen.castigo = asignarCastigo(estado, 'jefe', 'personal', hoy, aleatorio) ?? resumen.castigo;
  }

  return resumen;
}

/** Cupos de la semana de un carril: cuántos van y cuántos quedan. */
export function cuposSemana(misiones, area) {
  const cupos = semanales(obligatorias(delArea(misiones, area)));
  return {
    total: cupos.length,
    hechos: cupos.filter(misionCompleta).length,
  };
}
