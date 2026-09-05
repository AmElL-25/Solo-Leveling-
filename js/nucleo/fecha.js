/* ==========================================================================
   Utilidades de fecha y tiempo. No pertenecen a ninguna característica del
   juego: viven en el núcleo técnico y las usa cualquier feature.
   ========================================================================== */

/** Fecha local en formato YYYY-MM-DD (no UTC: el día cambia a medianoche local). */
export function fechaHoy(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function idNuevo() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Milisegundos que faltan para la medianoche local. */
export function msHastaMedianoche(ahora = new Date()) {
  const medianoche = new Date(ahora);
  medianoche.setHours(24, 0, 0, 0);
  return medianoche - ahora;
}

/** Días completos transcurridos entre dos fechas YYYY-MM-DD. */
export function diasEntre(desde, hasta) {
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  return Math.max(1, Math.round((b - a) / 86400000));
}
