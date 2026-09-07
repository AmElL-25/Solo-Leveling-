/* ==========================================================================
   Feature: jefes semanales — catálogo. Nombres propios, no del anime ni del
   juego: aquí solo se toma prestada la mecánica.
   ========================================================================== */

/** Cuánto pega cada objetivo cumplido y cuánto aguanta el jefe. */
export const VIDA_POR_XP_DIARIA = 6;   // vidaMaxima = experiencia diaria × 6
export const GOLPE_PUERTA = 3;         // cerrar una puerta pega el triple
export const RECOMPENSA_XP = 0.25;     // experiencia = vidaMaxima × 0.25
export const RECOMPENSA_ORO = 0.5;     // oro = experiencia × 0.5

export const RANGOS_JEFE = [
  { rango: 'E', nivelMin: 1 },
  { rango: 'D', nivelMin: 8 },
  { rango: 'C', nivelMin: 16 },
  { rango: 'B', nivelMin: 26 },
  { rango: 'A', nivelMin: 40 },
  { rango: 'S', nivelMin: 55 },
];

export const NOMBRES_JEFE = [
  'Guardián de la puerta roja',
  'Coloso de hierro oxidado',
  'Serpiente de las profundidades',
  'Verdugo de piedra',
  'Araña de obsidiana',
  'Señor de las cenizas',
  'Centinela sin rostro',
  'Bestia del invierno',
  'Heraldo de la grieta',
  'Devorador de horas',
];
