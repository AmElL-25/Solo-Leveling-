/* ==========================================================================
   Feature: puertas — catálogo. Desafíos extra que aparecen algunos días.
   No penalizan si no los haces: son la recompensa de arriesgarse.
   ========================================================================== */

export const RANGOS_PUERTA = [
  { rango: 'E', nivelMin: 1,  xp: 60,  oro: 40 },
  { rango: 'D', nivelMin: 8,  xp: 110, oro: 70 },
  { rango: 'C', nivelMin: 16, xp: 180, oro: 110 },
  { rango: 'B', nivelMin: 26, xp: 280, oro: 160 },
  { rango: 'A', nivelMin: 40, xp: 420, oro: 240 },
  { rango: 'S', nivelMin: 55, xp: 650, oro: 350 },
];

export const DESAFIOS_PUERTA = [
  { nombre: 'Flexiones explosivas',  objetivo: 30, unidad: 'reps',   paso: 5,  stat: 'fuerza' },
  { nombre: 'Plancha sin descanso',  objetivo: 3,  unidad: 'min',    paso: 1,  stat: 'vitalidad' },
  { nombre: 'Sprints',               objetivo: 10, unidad: 'series', paso: 1,  stat: 'agilidad' },
  { nombre: 'Burpees',               objetivo: 40, unidad: 'reps',   paso: 5,  stat: 'fuerza' },
  { nombre: 'Lectura concentrada',   objetivo: 30, unidad: 'min',    paso: 5,  stat: 'inteligencia' },
  { nombre: 'Meditación',            objetivo: 15, unidad: 'min',    paso: 5,  stat: 'percepcion' },
  { nombre: 'Sentadillas búlgaras',  objetivo: 40, unidad: 'reps',   paso: 10, stat: 'fuerza' },
  { nombre: 'Estiramientos',         objetivo: 20, unidad: 'min',    paso: 5,  stat: 'agilidad' },
];

/** Probabilidad de que se abra una puerta al empezar el día. */
export const PROBABILIDAD_PUERTA = 0.45;
