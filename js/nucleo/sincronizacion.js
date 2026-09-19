/* ==========================================================================
   Sincronización opcional con el servidor. Sin token guardado, la app se
   comporta exactamente como antes: todo en localStorage, sin red. Con
   token, el progreso también viaja a /api/estado y llega a todos tus
   dispositivos.
   ========================================================================== */

import { leer, escribir } from './almacenamiento.js';

const CLAVE_TOKEN = 'sistema:token-sync'; // aparte de CLAVE en progreso.js: es del dispositivo, no del jugador

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
