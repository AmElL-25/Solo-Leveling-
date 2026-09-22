/* ==========================================================================
   Sincronización opcional con el servidor. Sin token guardado, la app se
   comporta exactamente como antes: todo en localStorage, sin red. Con
   token, el progreso también viaja a /api/estado y llega a todos tus
   dispositivos.
   ========================================================================== */

import { leer, escribir } from './almacenamiento.js';

const CLAVE_TOKEN = 'sistema:token-sync'; // aparte de CLAVE en progreso.js: es del dispositivo, no del jugador
const TIEMPO_MAXIMO = 8000;  // ms; una red lenta no puede dejar la app esperando
const ESPERA_SUBIDA = 1500;  // ms; varios toques seguidos viajan en una sola subida

export const tokenGuardado = () => leer(CLAVE_TOKEN) || '';

export function guardarToken(token) {
  escribir(CLAVE_TOKEN, String(token || '').trim());
}

function cabeceras() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenGuardado()}`,
  };
}

/** fetch con límite de tiempo y sin pasar por ninguna caché. */
function pedir(opciones = {}) {
  return fetch('/api/estado', {
    ...opciones,
    headers: cabeceras(),
    cache: 'no-store',
    signal: AbortSignal.timeout?.(TIEMPO_MAXIMO), // Safari < 16 no lo tiene
  });
}

/** Trae el estado del servidor. Null si no hay token, no hay red o aún no hay nada guardado. */
export async function bajar() {
  if (!tokenGuardado()) return null;
  try {
    const respuesta = await pedir();
    if (!respuesta.ok) return null;
    const { estado } = await respuesta.json();
    return estado ?? null;
  } catch {
    return null; // sin red: seguimos con lo local
  }
}

/* Las subidas van de una en una y siempre con el último estado: si dos
   salieran a la vez, la vieja podría llegar después y pisar a la nueva. */
let pendiente = null;
let temporizador = null;
let enCurso = null;

async function vaciar() {
  temporizador = null;
  if (enCurso) await enCurso;
  if (!pendiente) return true;
  const cuerpo = pendiente;
  pendiente = null;
  enCurso = pedir({ method: 'PUT', body: cuerpo })
    .then((respuesta) => respuesta.ok)
    .catch(() => false);
  const ok = await enCurso;
  enCurso = null;
  return ok;
}

/**
 * Sube el estado al servidor. Best-effort: si falla, la próxima subida ya se
 * encarga. Con `inmediato` no espera a agrupar toques y devuelve si llegó.
 */
export function subir(estado, { inmediato = false } = {}) {
  if (!tokenGuardado()) return Promise.resolve(true);
  pendiente = JSON.stringify(estado);
  clearTimeout(temporizador);
  if (inmediato) return vaciar();
  temporizador = setTimeout(vaciar, ESPERA_SUBIDA);
  return Promise.resolve(true);
}

/** Sube ya lo que esté esperando (al cerrar o esconder la app). */
export function subirPendiente() {
  if (!pendiente || !tokenGuardado()) return;
  clearTimeout(temporizador);
  // keepalive deja que la petición termine aunque la página se esté cerrando.
  // Su cuerpo tiene un tope de 64 KB; si no cabe, lo intenta la subida normal.
  if (pendiente.length < 60000) {
    fetch('/api/estado', {
      method: 'PUT', headers: cabeceras(), body: pendiente, keepalive: true,
    }).catch(() => {});
    pendiente = null;
  } else {
    vaciar();
  }
}
