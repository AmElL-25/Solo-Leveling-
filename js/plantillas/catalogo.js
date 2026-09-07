/* ==========================================================================
   Feature: plantillas de misión diaria. Conjuntos de objetivos pensados para
   una vida concreta: el jugador elige el suyo y luego lo edita a mano.
   ========================================================================== */

export const PLANTILLAS = [
  {
    id: 'gerente-fisico',
    nombre: 'Gerente de ventas + físico',
    descripcion: 'Dirigir al equipo, vender y recuperar el cuerpo. El set completo.',
    misiones: [
      { nombre: 'Prospección',        tipo: 'contador', objetivo: 20,  unidad: 'contactos', paso: 5,   xp: 40, stat: 'percepcion' },
      { nombre: 'Reunión con el equipo', tipo: 'checkbox',                                            xp: 30, stat: 'percepcion' },
      { nombre: 'Uno a uno con un vendedor', tipo: 'checkbox',                                        xp: 35, stat: 'inteligencia' },
      { nombre: 'Propuestas enviadas', tipo: 'contador', objetivo: 3,   unidad: 'envíos',    paso: 1,  xp: 40, stat: 'percepcion' },
      { nombre: 'Formación en ventas', tipo: 'contador', objetivo: 30,  unidad: 'min',       paso: 10, xp: 35, stat: 'inteligencia' },
      { nombre: 'Entrenamiento de fuerza', tipo: 'contador', objetivo: 45, unidad: 'min',    paso: 15, xp: 50, stat: 'fuerza' },
      { nombre: 'Cardio',             tipo: 'contador', objetivo: 5,   unidad: 'km',        paso: 1,  xp: 45, stat: 'agilidad' },
      { nombre: 'Agua',               tipo: 'contador', objetivo: 2.5, unidad: 'L',         paso: 0.5, xp: 20, stat: 'vitalidad' },
      { nombre: 'Dormir 7 horas',     tipo: 'checkbox',                                              xp: 25, stat: 'vitalidad' },
    ],
  },
  {
    id: 'gerente',
    nombre: 'Gerente de ventas',
    descripcion: 'Solo el trabajo: prospección, equipo, propuestas y formación.',
    misiones: [
      { nombre: 'Prospección',        tipo: 'contador', objetivo: 25,  unidad: 'contactos', paso: 5,   xp: 45, stat: 'percepcion' },
      { nombre: 'Reunión con el equipo', tipo: 'checkbox',                                            xp: 30, stat: 'percepcion' },
      { nombre: 'Uno a uno con un vendedor', tipo: 'checkbox',                                        xp: 35, stat: 'inteligencia' },
      { nombre: 'Revisar el embudo',  tipo: 'checkbox',                                               xp: 30, stat: 'percepcion' },
      { nombre: 'Propuestas enviadas', tipo: 'contador', objetivo: 4,   unidad: 'envíos',    paso: 1,  xp: 45, stat: 'percepcion' },
      { nombre: 'Formación en ventas', tipo: 'contador', objetivo: 45,  unidad: 'min',       paso: 15, xp: 45, stat: 'inteligencia' },
    ],
  },
  {
    id: 'fisico',
    nombre: 'Recuperar el físico',
    descripcion: 'Fuerza, cardio, agua y sueño. Nada más.',
    misiones: [
      { nombre: 'Entrenamiento de fuerza', tipo: 'contador', objetivo: 60, unidad: 'min', paso: 15,  xp: 60, stat: 'fuerza' },
      { nombre: 'Cardio',             tipo: 'contador', objetivo: 6,   unidad: 'km',  paso: 1,   xp: 55, stat: 'agilidad' },
      { nombre: 'Movilidad',          tipo: 'contador', objetivo: 15,  unidad: 'min', paso: 5,   xp: 30, stat: 'agilidad' },
      { nombre: 'Agua',               tipo: 'contador', objetivo: 3,   unidad: 'L',   paso: 0.5, xp: 25, stat: 'vitalidad' },
      { nombre: 'Dormir 7 horas',     tipo: 'checkbox',                                          xp: 30, stat: 'vitalidad' },
    ],
  },
  {
    id: 'clasico',
    nombre: 'El set del Sistema',
    descripcion: '100 flexiones, 100 abdominales, 100 sentadillas y 10 km.',
    misiones: [
      { nombre: 'Flexiones',   tipo: 'contador', objetivo: 100, unidad: 'reps', paso: 10, xp: 40, stat: 'fuerza' },
      { nombre: 'Abdominales', tipo: 'contador', objetivo: 100, unidad: 'reps', paso: 10, xp: 40, stat: 'vitalidad' },
      { nombre: 'Sentadillas', tipo: 'contador', objetivo: 100, unidad: 'reps', paso: 10, xp: 40, stat: 'fuerza' },
      { nombre: 'Carrera',     tipo: 'contador', objetivo: 10,  unidad: 'km',   paso: 1,  xp: 60, stat: 'agilidad' },
    ],
  },
];

export const PLANTILLA_INICIAL = 'gerente-fisico';

export const buscarPlantilla = (id) => PLANTILLAS.find((p) => p.id === id) ?? PLANTILLAS[0];
