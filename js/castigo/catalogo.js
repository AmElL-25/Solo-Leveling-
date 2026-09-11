/* ==========================================================================
   Feature: castigo — catálogo. La penalización no es solo perder cosas: el
   Sistema asigna una misión de castigo que hay que aceptar y cumplir. Hasta
   entonces la semana no vuelve a empezar.

   Lo primero que se intenta siempre es reconstruir lo que se dejó sin hacer
   (js/castigo/reglas.js). Estas listas son la reserva, para cuando no hay
   nada concreto que reconstruir: se dejó escapar al jefe, o todo lo fallado
   era de sí/no y no se puede pedir «duerme siete horas y media».
   ========================================================================== */

/* Reserva del carril personal: cuerpo. Duras, pero de un solo día y sin
   nada que pueda lesionar a quien está empezando. */
const RESERVA_PERSONAL = [
  { nombre: 'Penitencia: caminata',     tipo: 'contador', objetivo: 6,  unidad: 'km',  paso: 1 },
  { nombre: 'Penitencia: sentadillas',  tipo: 'contador', objetivo: 60, unidad: 'reps', paso: 10 },
  { nombre: 'Penitencia: movilidad',    tipo: 'contador', objetivo: 30, unidad: 'min', paso: 10 },
  { nombre: 'Penitencia: pasos',        tipo: 'contador', objetivo: 12000, unidad: 'pasos', paso: 1000 },
];

/* Reserva del carril profesional: oficio. Nunca se paga con cuerpo lo que se
   falló en el trabajo, ni al revés. */
const RESERVA_PROFESIONAL = [
  { nombre: 'Penitencia: formación',        tipo: 'contador', objetivo: 60, unidad: 'min',     paso: 15 },
  { nombre: 'Penitencia: escucha',          tipo: 'contador', objetivo: 5,  unidad: 'notas',   paso: 1 },
  { nombre: 'Penitencia: llamada preparada', tipo: 'contador', objetivo: 3, unidad: 'llamadas', paso: 1 },
];

export const RESERVAS = {
  personal: RESERVA_PERSONAL,
  profesional: RESERVA_PROFESIONAL,
};

/** Cuánto se multiplica lo que quedó sin hacer para convertirlo en penitencia. */
export const FACTOR_PENITENCIA = 1.5;

export const MOTIVOS = {
  dia: 'Fallaste la misión diaria.',
  jefe: 'Dejaste escapar al jefe de la semana.',
};
