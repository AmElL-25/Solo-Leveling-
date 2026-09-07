/* ==========================================================================
   Feature: tienda — reglas. Compra con oro, inventario y efecto de cada
   objeto al usarlo.
   ========================================================================== */

import { fechaHoy } from '../nucleo/fecha.js';
import { vidaMaxima, vidaActual } from '../jugador/reglas.js';
import { generarPuerta } from '../puertas/reglas.js';
import { OBJETOS, buscarObjeto } from './catalogo.js';

export function inventarioInicial() {
  const inventario = {};
  for (const objeto of OBJETOS) inventario[objeto.id] = 0;
  return inventario;
}

export function normalizarInventario(inventario) {
  const limpio = inventarioInicial();
  for (const objeto of OBJETOS) {
    const cantidad = Number(inventario?.[objeto.id]);
    limpio[objeto.id] = Number.isFinite(cantidad) ? Math.max(0, Math.round(cantidad)) : 0;
  }
  return limpio;
}

export function estadoInicialEfectos() {
  return { dobleXp: false };
}

export function normalizarEfectos(efectos) {
  return { dobleXp: Boolean(efectos?.dobleXp) };
}

/** Compra un objeto si hay oro suficiente. Devuelve el objeto o null. */
export function comprar(estado, objetoId) {
  const objeto = buscarObjeto(objetoId);
  if (!objeto || estado.jugador.oro < objeto.precio) return null;
  estado.jugador.oro -= objeto.precio;
  estado.inventario[objeto.id] += 1;
  return objeto;
}

/**
 * Usa un objeto del inventario. Devuelve { objeto, mensaje }, o null si no se
 * puede usar: sin unidades, o sin efecto que aplicar en este momento.
 */
export function usar(estado, objetoId, aleatorio = Math.random) {
  const objeto = buscarObjeto(objetoId);
  if (!objeto || estado.inventario[objetoId] <= 0) return null;
  const jugador = estado.jugador;
  let mensaje = null;

  switch (objetoId) {
    case 'pocion_vida': {
      if (vidaActual(jugador) >= vidaMaxima(jugador)) return null;
      jugador.hp = vidaMaxima(jugador);
      mensaje = 'Vida restaurada al máximo.';
      break;
    }
    case 'pocion_energia': {
      if (jugador.fatiga <= 0) return null;
      jugador.fatiga = 0;
      mensaje = 'Fatiga eliminada.';
      break;
    }
    case 'piedra_doble': {
      if (estado.efectos.dobleXp) return null;
      estado.efectos.dobleXp = true;
      mensaje = 'La próxima misión diaria dará el doble de experiencia.';
      break;
    }
    case 'llave_puerta': {
      if (estado.puerta && !estado.puerta.cerrada) return null;
      estado.puerta = generarPuerta(jugador.nivel, fechaHoy(), aleatorio);
      mensaje = `Se ha abierto una puerta de rango ${estado.puerta.rango}.`;
      break;
    }
    case 'pergamino_perdon': {
      if (!estado.castigo.activo) return null;
      jugador.racha = estado.castigo.rachaPerdida;
      jugador.mejorRacha = Math.max(jugador.mejorRacha, jugador.racha);
      estado.castigo = { activo: false, desde: null, rachaPerdida: 0 };
      mensaje = `Penalización anulada. Racha recuperada: ${jugador.racha} días.`;
      break;
    }
    default:
      return null;
  }

  estado.inventario[objetoId] -= 1;
  return { objeto, mensaje };
}

export { OBJETOS, buscarObjeto };
