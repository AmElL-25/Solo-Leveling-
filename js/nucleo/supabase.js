/* ==========================================================================
   Cliente HTTP de Supabase. Entorno técnico: aquí no hay reglas del juego,
   solo las llamadas y la traducción de sus errores.

   Se habla directo con la API REST en vez de traer la librería oficial: son
   cinco llamadas, y así la app sigue sin dependencias, sin build y entera en
   tu dominio (importa para que funcione sin conexión). Las contraseñas las
   sigue guardando y cifrando Supabase; aquí nunca se almacena ninguna.
   ========================================================================== */

import { URL_SUPABASE, CLAVE_PUBLICA } from '../cuenta/configuracion.js';

export const hayCuentas = () => Boolean(URL_SUPABASE && CLAVE_PUBLICA);

const base = () => URL_SUPABASE.replace(/\/+$/, '');

// Una red lenta no puede dejar la app esperando: pasado esto cuenta como sin conexión.
const TIEMPO_MAXIMO = 10_000;

/* Mensajes de Supabase (en inglés y pensados para quien programa) traducidos a
   algo que un jugador pueda entender y accionar. */
const MENSAJES = [
  [/invalid login credentials/i, 'El correo o la contraseña no coinciden.'],
  [/email not confirmed/i, 'Falta confirmar tu correo. Busca el mensaje que te enviamos.'],
  [/user already registered/i, 'Ese correo ya tiene cuenta. Entra en vez de registrarte.'],
  [/password should be at least (\d+)/i, 'La contraseña es muy corta: usa al menos $1 caracteres.'],
  [/unable to validate email|invalid format/i, 'Ese correo no parece válido.'],
  [/rate limit|too many requests/i, 'Demasiados intentos seguidos. Espera un momento.'],
];

function traducir(datos, estado) {
  const crudo = String(datos?.error_description || datos?.msg || datos?.message || datos?.error || '');
  for (const [patron, texto] of MENSAJES) {
    if (patron.test(crudo)) return crudo.replace(patron, texto);
  }
  if (estado === 0) return 'Sin conexión.';
  return crudo || 'No se pudo completar la operación.';
}

/** Toda llamada devuelve { ok, datos } o { ok: false, error }, nunca lanza:
    quien la use no tiene que envolver nada en try. */
async function llamar(ruta, opciones = {}) {
  try {
    const respuesta = await fetch(`${base()}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', apikey: CLAVE_PUBLICA, ...opciones.headers },
      cache: 'no-store',
      signal: AbortSignal.timeout?.(TIEMPO_MAXIMO), // Safari < 16 no lo tiene
    });
    const texto = await respuesta.text();
    const datos = texto ? JSON.parse(texto) : null;
    if (!respuesta.ok) return { ok: false, error: traducir(datos, respuesta.status), estado: respuesta.status };
    return { ok: true, datos };
  } catch {
    return { ok: false, error: 'Sin conexión.', estado: 0 };
  }
}

/* ------------------------------- cuentas ------------------------------- */

/* El nick viaja en 'data': Supabase lo guarda con el usuario y un disparador
   de la base crea el perfil. Así el nombre queda reservado en el mismo acto
   del registro, sin un segundo paso que pueda quedarse a medias. */
export const registrar = (correo, clave, nick) => llamar('/auth/v1/signup', {
  method: 'POST',
  body: JSON.stringify({ email: correo, password: clave, data: { nick } }),
});

/** ¿Está libre ese nombre? true/false, o null si no se pudo preguntar.
    Responde un sí o un no, nunca un correo. */
export async function nickLibre(nick) {
  const r = await llamar('/rest/v1/rpc/nick_libre', {
    method: 'POST',
    body: JSON.stringify({ consulta: String(nick).trim() }),
  });
  return r.ok ? r.datos === true : null;
}

/** Entrar con nombre de jugador. La traducción nick → correo ocurre dentro de
    Supabase (función 'entrar-con-nick'), nunca aquí: el correo de nadie llega
    al navegador. Devuelve lo mismo que entrar() cuando sale bien. */
export const entrarConNick = (nick, clave) => llamar('/functions/v1/entrar-con-nick', {
  method: 'POST',
  body: JSON.stringify({ nick: String(nick).trim(), clave }),
});

export const entrar = (correo, clave) => llamar('/auth/v1/token?grant_type=password', {
  method: 'POST',
  body: JSON.stringify({ email: correo, password: clave }),
});

export const renovar = (refresco) => llamar('/auth/v1/token?grant_type=refresh_token', {
  method: 'POST',
  body: JSON.stringify({ refresh_token: refresco }),
});

export const salir = (acceso) => llamar('/auth/v1/logout', {
  method: 'POST',
  headers: { Authorization: `Bearer ${acceso}` },
});

export const recuperar = (correo) => llamar('/auth/v1/recover', {
  method: 'POST',
  body: JSON.stringify({ email: correo }),
});

/* -------------------------------- datos -------------------------------- */

/** La partida guardada de quien trae ese token, o null si todavía no tiene. */
export async function leerPartida(acceso) {
  const r = await llamar('/rest/v1/partidas?select=estado,actualizado', {
    headers: { Authorization: `Bearer ${acceso}` },
  });
  if (!r.ok) return r;
  // La política de la base ya recorta a la fila propia: no hace falta filtrar.
  return { ok: true, datos: r.datos?.[0] ?? null };
}

/** Guarda (o pisa) la partida de quien trae ese token. */
export function guardarPartida(acceso, usuario, estado, { keepalive = false } = {}) {
  // keepalive deja terminar la petición aunque la página se cierre, pero su
  // cuerpo tiene un tope de 64 KB: por encima, se intenta como una normal.
  const cuerpo = JSON.stringify({ usuario, estado, actualizado: Number(estado?.actualizado) || 0 });
  return llamar('/rest/v1/partidas', {
    method: 'POST',
    keepalive: keepalive && cuerpo.length < 60_000,
    headers: {
      Authorization: `Bearer ${acceso}`,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: cuerpo,
  });
}
