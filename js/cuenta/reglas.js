/* ==========================================================================
   Feature: cuenta — la sesión y qué hacer con ella. Funciones sin DOM.

   La sesión vive en este aparato, igual que la partida: así se puede abrir la
   app sin conexión y seguir jugando con lo último que se bajó. Solo se pide
   red cuando hay que renovar o sincronizar.
   ========================================================================== */

import { leer, escribir, eliminar } from '../nucleo/almacenamiento.js';
import { entrar, registrar, renovar, salir, leerPartida, guardarPartida } from '../nucleo/supabase.js';

const CLAVE_SESION = 'sistema:sesion';
// Margen para no usar un token que caduca mientras va de camino al servidor.
const MARGEN_MS = 60_000;

/** { acceso, refresco, caduca, usuario, correo } o null si no hay sesión. */
export function sesionGuardada() {
  try {
    const crudo = leer(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null; // sesión corrupta: se trata como no haber entrado
  }
}

const guardarSesion = (sesion) => escribir(CLAVE_SESION, JSON.stringify(sesion));
export const olvidarSesion = () => eliminar(CLAVE_SESION);

/* Lo que devuelve Supabase al entrar, reducido a lo que la app necesita. */
function comoSesion(datos) {
  return {
    acceso: datos.access_token,
    refresco: datos.refresh_token,
    caduca: Date.now() + (Number(datos.expires_in) || 3600) * 1000,
    usuario: datos.user?.id ?? '',
    correo: datos.user?.email ?? '',
  };
}

export async function iniciarSesion(correo, clave) {
  const r = await entrar(String(correo).trim().toLowerCase(), clave);
  if (!r.ok) return r;
  const sesion = comoSesion(r.datos);
  if (!sesion.acceso || !sesion.usuario) {
    return { ok: false, error: 'El servidor no devolvió una sesión válida.' };
  }
  guardarSesion(sesion);
  return { ok: true, sesion };
}

/** Registro. Con la confirmación por correo activada, Supabase no devuelve
    sesión todavía: hay que ir al buzón antes de poder entrar. */
export async function crearCuenta(correo, clave) {
  const r = await registrar(String(correo).trim().toLowerCase(), clave);
  if (!r.ok) return r;
  if (r.datos?.access_token) {
    const sesion = comoSesion(r.datos);
    guardarSesion(sesion);
    return { ok: true, sesion };
  }
  return { ok: true, sesion: null, confirmar: true };
}

/** Devuelve una sesión utilizable, renovándola si hace falta. null si caducó
    del todo y hay que volver a entrar. Sin red, se devuelve la que haya: la
    app sigue jugándose aunque no se pueda sincronizar. */
export async function sesionValida() {
  const sesion = sesionGuardada();
  if (!sesion) return null;
  if (Date.now() < Number(sesion.caduca) - MARGEN_MS) return sesion;

  const r = await renovar(sesion.refresco);
  if (r.ok && r.datos?.access_token) {
    const fresca = { ...comoSesion(r.datos), correo: r.datos.user?.email || sesion.correo };
    guardarSesion(fresca);
    return fresca;
  }
  // Un refresco rechazado (no un fallo de red) significa sesión muerta.
  if (r.estado && r.estado !== 0) {
    olvidarSesion();
    return null;
  }
  return sesion;
}

export async function cerrarSesion() {
  const sesion = sesionGuardada();
  if (sesion?.acceso) await salir(sesion.acceso);
  olvidarSesion();
}

/* ----------------------------- sincronizar ----------------------------- */

/** Baja la partida de la nube si debe mandar sobre la de este aparato.
    Devuelve el estado que hay que usar, o null si manda el local.

    'sinPartidaPropia' es un aparato donde nunca se ha guardado nada. Ahí la
    nube gana siempre, sin mirar fechas: en cuanto la app arranca se sella la
    hora actual, así que un aparato recién instalado tendría una fecha más
    nueva que tu partida de verdad y la borraría al subir la vacía. */
export async function bajarSiGana(estadoLocal, sinPartidaPropia = false) {
  const sesion = await sesionValida();
  if (!sesion) return null;
  const r = await leerPartida(sesion.acceso);
  if (!r.ok || !r.datos) return null;
  const remoto = r.datos.estado;
  if (!remoto) return null;
  if (sinPartidaPropia) return remoto;
  return Number(r.datos.actualizado) > (Number(estadoLocal?.actualizado) || 0) ? remoto : null;
}

/** Sube la partida. Best-effort: si no hay sesión o no hay red, se reintenta
    en el siguiente guardado y mientras tanto lo local no se pierde. */
export async function subirPartida(estado) {
  const sesion = await sesionValida();
  if (!sesion) return false;
  const r = await guardarPartida(sesion.acceso, sesion.usuario, estado);
  return r.ok;
}
