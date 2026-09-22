/* ==========================================================================
   Feature: cuenta — la sesión y qué hacer con ella. Funciones sin DOM.

   La sesión vive en este aparato, igual que la partida: así se puede abrir la
   app sin conexión y seguir jugando con lo último que se bajó. Solo se pide
   red cuando hay que renovar o sincronizar.
   ========================================================================== */

import { leer, escribir, eliminar } from '../nucleo/almacenamiento.js';
import {
  entrar, entrarConNick, registrar, nickLibre, renovar, salir, leerPartida, guardarPartida,
} from '../nucleo/supabase.js';

const CLAVE_SESION = 'sistema:sesion';
const CLAVE_OMITIR = 'sistema:cuenta-omitida'; // este aparato eligió jugar en local
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

/* Quien dijo que no quiere cuenta no debe verlo cada vez que abre la app.
   En el servidor local del README se da por omitida siempre: desarrollando se
   abre la app con el navegador en blanco una y otra vez, y una pantalla de
   acceso en cada arranque solo estorba. La cuenta sigue a mano en
   ⚙ Configuración, que es donde se prueba. */
const enDesarrollo = () => ['localhost', '127.0.0.1', '::1', ''].includes(location.hostname);
export const cuentaOmitida = () => enDesarrollo() || leer(CLAVE_OMITIR) === '1';
export const omitirCuenta = () => escribir(CLAVE_OMITIR, '1');

/* Lo que devuelve Supabase al entrar, reducido a lo que la app necesita. */
function comoSesion(datos) {
  return {
    acceso: datos.access_token,
    refresco: datos.refresh_token,
    caduca: Date.now() + (Number(datos.expires_in) || 3600) * 1000,
    usuario: datos.user?.id ?? '',
    correo: datos.user?.email ?? '',
    // Lo añade la función 'entrar-con-nick'; al entrar por correo no viene.
    nick: datos.nick ?? '',
  };
}

export const FORMATO_NICK = /^[A-Za-z0-9_-]{3,20}$/;

/** Entrar con el nombre de jugador. Se acepta también el correo, para las
    cuentas creadas antes de que existieran los nombres. */
export async function iniciarSesion(nombre, clave) {
  const limpio = String(nombre).trim();
  const r = limpio.includes('@')
    ? await entrar(limpio.toLowerCase(), clave)
    : await entrarConNick(limpio, clave);
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
export async function crearCuenta(correo, clave, nick) {
  const nombre = String(nick).trim();
  if (!FORMATO_NICK.test(nombre)) {
    return { ok: false, error: 'El nombre lleva de 3 a 20 letras, números, guion o guion bajo.' };
  }
  // Se pregunta antes para poder avisar con claridad; el índice único de la
  // base es la garantía de verdad si dos personas eligen el mismo a la vez.
  const libre = await nickLibre(nombre);
  if (libre === false) return { ok: false, error: 'Ese nombre ya está cogido. Prueba otro.' };
  if (libre === null) return { ok: false, error: 'Sin conexión.' };

  const r = await registrar(String(correo).trim().toLowerCase(), clave, nombre);
  if (!r.ok) return r;
  if (r.datos?.access_token) {
    const sesion = { ...comoSesion(r.datos), nick: nombre };
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
    const fresca = { ...comoSesion(r.datos),
      correo: r.datos.user?.email || sesion.correo,
      nick: sesion.nick };
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

/* Las subidas van de una en una y siempre con el último estado: si dos
   salieran a la vez, la vieja podría llegar después y pisar a la nueva. Y
   varios toques seguidos viajan en una sola: no hace falta una petición por
   cada +1. */
const ESPERA_SUBIDA = 1500; // ms
let pendiente = null;
let temporizador = null;
let enCurso = null;

async function vaciar({ alCerrar = false } = {}) {
  clearTimeout(temporizador);
  temporizador = null;
  if (enCurso) await enCurso;
  if (!pendiente) return true;
  const estado = pendiente;
  pendiente = null;
  enCurso = (async () => {
    const sesion = await sesionValida();
    if (!sesion) return false;
    const r = await guardarPartida(sesion.acceso, sesion.usuario, estado, { keepalive: alCerrar });
    return r.ok;
  })();
  const ok = await enCurso;
  enCurso = null;
  return ok;
}

/** Sube la partida. Best-effort: si no hay sesión o no hay red, se reintenta
    en el siguiente guardado y mientras tanto lo local no se pierde. Con
    `inmediato` no espera a agrupar toques y devuelve si llegó. */
export function subirPartida(estado, { inmediato = false } = {}) {
  if (!sesionGuardada()) return Promise.resolve(false);
  pendiente = estado;
  if (inmediato) return vaciar();
  clearTimeout(temporizador);
  temporizador = setTimeout(vaciar, ESPERA_SUBIDA);
  return Promise.resolve(true);
}

/** Sube ya lo que esté esperando: al esconder o cerrar la app, que en el
    móvil puede no volver a abrirse. */
export function subirPendiente() {
  if (pendiente) vaciar({ alCerrar: true });
}
