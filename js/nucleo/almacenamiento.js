/* ==========================================================================
   Acceso a localStorage con manejo de errores. Entorno técnico compartido:
   ninguna feature debe tocar localStorage directamente.
   ========================================================================== */

export function leer(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null; // navegador con el almacenamiento bloqueado
  }
}

export function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch {
    return false;
  }
}

export function eliminar(clave) {
  try {
    localStorage.removeItem(clave);
  } catch { /* nada que hacer */ }
}
