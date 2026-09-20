/* ==========================================================================
   Sincronización opcional con el servidor. Sin token guardado, la app se
   comporta exactamente como antes: todo en localStorage, sin red. Con
   token, el progreso también viaja a /api/estado y llega a todos tus
   dispositivos.
   ========================================================================== */

import { leer, escribir } from './almacenamiento.js';

const CLAVE_TOKEN = 'sistema:token-sync'; // aparte de CLAVE en progreso.js: es del dispositivo, no del jugador
const CLAVE_OMITIR = 'sistema:sync-omitido'; // este aparato ya eligió jugar solo en local

export const tokenGuardado = () => leer(CLAVE_TOKEN) || '';

export function guardarToken(token) {
  escribir(CLAVE_TOKEN, String(token || '').trim());
}

/* Un aparato nuevo arrancaba con la partida vacía sin decir nada, y había que
   saber que el token se pega en la configuración. Ahora se ofrece al abrir,
   una sola vez: quien prefiera jugar en local no vuelve a ver la pregunta. */
export const syncOmitido = () => leer(CLAVE_OMITIR) === '1';
export const omitirSync = () => escribir(CLAVE_OMITIR, '1');

/* El servidor local del README (python3 -m http.server) sirve archivos y nada
   más: allí no hay funciones que puedan sincronizar. Se reconoce por el host,
   para no lanzar una petición que solo puede acabar en 404. */
const enDesarrollo = () => ['localhost', '127.0.0.1', '::1', ''].includes(location.hostname);

/** ¿Este despliegue tiene sincronización montada? Una petición sin token: el
    servidor la rechaza con 401 cuando la tiene, y contesta otra cosa cuando no.
    Sirve para no pedir un token donde no llevaría a ningún sitio. */
export async function haySincronizacion() {
  if (enDesarrollo()) return false;
  try {
    const respuesta = await fetch('/api/estado', { headers: { 'Content-Type': 'application/json' } });
    return respuesta.status === 401;
  } catch {
    return false; // sin red no se puede saber: se juega en local y se pregunta otro día
  }
}

/** Prueba un token contra el servidor sin llegar a guardarlo. Distingue por qué
    falló: no es lo mismo pegarlo mal que estar sin red o no tenerlo montado. */
export async function probarToken(token) {
  const limpio = String(token || '').trim();
  if (!limpio) return { ok: false, motivo: 'vacio' };
  try {
    const respuesta = await fetch('/api/estado', {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${limpio}` },
    });
    if (respuesta.status === 401) return { ok: false, motivo: 'token' };
    if (!respuesta.ok) return { ok: false, motivo: 'servidor' };
    return { ok: true };
  } catch {
    return { ok: false, motivo: 'red' };
  }
}

function cabeceras() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenGuardado()}`,
  };
}

/** Trae el estado del servidor. Null si no hay token, no hay red o aún no hay nada guardado. */
export async function bajar() {
  if (!tokenGuardado()) return null;
  try {
    const respuesta = await fetch('/api/estado', { headers: cabeceras() });
    if (!respuesta.ok) return null;
    const { estado } = await respuesta.json();
    return estado ?? null;
  } catch {
    return null; // sin red: seguimos con lo local
  }
}

/** Sube el estado al servidor. Best-effort: si falla, la próxima subida ya se encarga. */
export async function subir(estado) {
  if (!tokenGuardado()) return true;
  try {
    const respuesta = await fetch('/api/estado', {
      method: 'PUT',
      headers: cabeceras(),
      body: JSON.stringify(estado),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}
