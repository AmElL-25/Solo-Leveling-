/* ==========================================================================
   Feature: clases — catálogo. Cada clase se especializa en una estadística
   y da experiencia extra en las misiones de esa especialidad.
   ========================================================================== */

export const NIVEL_CAMBIO_CLASE = 10;
export const BONO_CLASE = 15;   // porcentaje extra en las misiones de tu especialidad
export const PUNTOS_CLASE = 3;  // puntos que se suman a la estadística al elegirla

export const CLASES = [
  {
    id: 'guerrero',
    nombre: 'Guerrero',
    stat: 'fuerza',
    descripcion: 'Golpea primero. +15 % de experiencia en misiones de Fuerza.',
  },
  {
    id: 'asesino',
    nombre: 'Asesino',
    stat: 'agilidad',
    descripcion: 'Rápido y silencioso. +15 % de experiencia en misiones de Agilidad.',
  },
  {
    id: 'tanque',
    nombre: 'Tanque',
    stat: 'vitalidad',
    descripcion: 'Aguanta lo que sea. +15 % de experiencia en misiones de Vitalidad.',
  },
  {
    id: 'mago',
    nombre: 'Mago',
    stat: 'inteligencia',
    descripcion: 'El conocimiento es poder. +15 % de experiencia en misiones de Inteligencia.',
  },
  {
    id: 'explorador',
    nombre: 'Explorador',
    stat: 'percepcion',
    descripcion: 'Ve lo que otros no. +15 % de experiencia en misiones de Percepción.',
  },
];

export const buscarClase = (id) => CLASES.find((c) => c.id === id) ?? null;
