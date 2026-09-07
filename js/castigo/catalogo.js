/* ==========================================================================
   Feature: castigo — catálogo. La penalización no es solo perder cosas: el
   Sistema asigna una misión de castigo que hay que aceptar y cumplir. Hasta
   entonces la semana no vuelve a empezar.
   ========================================================================== */

/** Castigos por fallar la misión diaria. Duros, pero de un solo día. */
export const CASTIGOS_DIA = [
  { nombre: 'Penitencia: flexiones',   tipo: 'contador', objetivo: 100, unidad: 'reps',      paso: 10 },
  { nombre: 'Penitencia: caminata',    tipo: 'contador', objetivo: 8,   unidad: 'km',        paso: 1 },
  { nombre: 'Penitencia: prospección', tipo: 'contador', objetivo: 30,  unidad: 'contactos', paso: 5 },
  { nombre: 'Penitencia: sentadillas', tipo: 'contador', objetivo: 120, unidad: 'reps',      paso: 20 },
  { nombre: 'Penitencia: formación',   tipo: 'contador', objetivo: 60,  unidad: 'min',       paso: 15 },
];

/** Castigos por dejar escapar al jefe. Cuestan una semana de disciplina. */
export const CASTIGOS_JEFE = [
  { nombre: 'Deuda con el Sistema: entrenamiento', tipo: 'contador', objetivo: 120, unidad: 'min',       paso: 15 },
  { nombre: 'Deuda con el Sistema: prospección',   tipo: 'contador', objetivo: 60,  unidad: 'contactos', paso: 10 },
  { nombre: 'Deuda con el Sistema: kilómetros',    tipo: 'contador', objetivo: 15,  unidad: 'km',        paso: 1 },
  { nombre: 'Deuda con el Sistema: uno a uno',     tipo: 'contador', objetivo: 5,   unidad: 'reuniones', paso: 1 },
];

export const MOTIVOS = {
  dia: 'Fallaste la misión diaria.',
  jefe: 'Dejaste escapar al jefe de la semana.',
};
