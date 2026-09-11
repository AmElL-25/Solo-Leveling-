/* ==========================================================================
   Feature: plantillas de misión diaria. Conjuntos de objetivos pensados para
   una vida concreta: el jugador elige el suyo y luego lo edita a mano.
   ========================================================================== */

export const PLANTILLAS = [
  {
    id: 'preparacion-ascenso',
    nombre: 'Preparación para el ascenso',
    descripcion: 'Volver al cuerpo y aprender el oficio desde donde estás, sin equipo todavía.',
    misiones: [
      /* --- EL SISTEMA: cuerpo y cabeza --------------------------------- */
      { nombre: 'Agua', tipo: 'contador', objetivo: 2.5, unidad: 'L', paso: 0.5, xp: 20, stat: 'vitalidad', area: 'personal' },
      { nombre: 'Dormir 7 horas', tipo: 'checkbox', xp: 30, stat: 'vitalidad', area: 'personal' },
      { nombre: 'Comer limpio', tipo: 'checkbox', xp: 35, stat: 'vitalidad', area: 'personal' },
      { nombre: 'Pasos', tipo: 'contador', objetivo: 8000, unidad: 'pasos', paso: 1000, xp: 45, stat: 'agilidad', area: 'personal' },
      { nombre: 'Diario del estoico', tipo: 'checkbox', xp: 25, stat: 'percepcion', area: 'personal' },
      { nombre: 'Fuerza', tipo: 'contador', objetivo: 3, unidad: 'sesiones', paso: 1, xp: 90, stat: 'fuerza', area: 'personal', periodo: 'semana' },
      { nombre: 'Ciclismo', tipo: 'contador', objetivo: 1, unidad: 'salidas', paso: 1, xp: 70, stat: 'agilidad', area: 'personal', periodo: 'semana' },
      { nombre: 'Pesaje', tipo: 'contador', objetivo: 1, unidad: 'pesajes', paso: 1, xp: 20, stat: 'vitalidad', area: 'personal', periodo: 'semana', medida: 'peso' },

      /* --- SALES: el oficio -------------------------------------------- */
      { nombre: 'Escucha en llamada', tipo: 'contador', objetivo: 1, unidad: 'notas', paso: 1, xp: 40, stat: 'percepcion', area: 'profesional', indicador: 'contactos' },
      { nombre: 'Formación', tipo: 'contador', objetivo: 20, unidad: 'min', paso: 5, xp: 35, stat: 'inteligencia', area: 'profesional' },
      { nombre: 'Conversación de valor', tipo: 'contador', objetivo: 1, unidad: 'llamadas', paso: 1, xp: 80, stat: 'percepcion', area: 'profesional', periodo: 'semana', indicador: 'reuniones' },
      { nombre: 'Aplicar una idea del libro', tipo: 'contador', objetivo: 1, unidad: 'ideas', paso: 1, xp: 60, stat: 'inteligencia', area: 'profesional', periodo: 'semana' },
      { nombre: 'Avance hacia el ascenso', tipo: 'contador', objetivo: 1, unidad: 'avances', paso: 1, xp: 90, stat: 'inteligencia', area: 'profesional', periodo: 'semana' },
    ],
  },
  {
    id: 'gerente-fisico',
    nombre: 'Gerente de ventas + físico',
    descripcion: 'Dirigir al equipo, vender y recuperar el cuerpo. Con registro de ventas.',
    misiones: [
      { nombre: 'Prospección',        tipo: 'contador', objetivo: 20,  unidad: 'contactos', paso: 5,   xp: 40, stat: 'percepcion',   indicador: 'contactos' },
      { nombre: 'Reunión con el equipo', tipo: 'checkbox',                                            xp: 30, stat: 'percepcion' },
      { nombre: 'Uno a uno con un vendedor', tipo: 'checkbox',                                        xp: 35, stat: 'inteligencia' },
      { nombre: 'Reuniones con clientes', tipo: 'contador', objetivo: 2, unidad: 'reuniones', paso: 1, xp: 40, stat: 'percepcion',   indicador: 'reuniones' },
      { nombre: 'Propuestas enviadas', tipo: 'contador', objetivo: 3,   unidad: 'envíos',    paso: 1,  xp: 40, stat: 'percepcion',   indicador: 'propuestas' },
      { nombre: 'Formación en ventas', tipo: 'contador', objetivo: 30,  unidad: 'min',       paso: 10, xp: 35, stat: 'inteligencia' },
      { nombre: 'Entrenamiento de fuerza', tipo: 'contador', objetivo: 45, unidad: 'min',    paso: 15, xp: 50, stat: 'fuerza' },
      { nombre: 'Cardio',             tipo: 'contador', objetivo: 5,   unidad: 'km',        paso: 1,  xp: 45, stat: 'agilidad' },
      { nombre: 'Agua',               tipo: 'contador', objetivo: 2.5, unidad: 'L',         paso: 0.5, xp: 20, stat: 'vitalidad' },
      { nombre: 'Dormir 7 horas',     tipo: 'checkbox',                                              xp: 25, stat: 'vitalidad' },
      { nombre: 'Ventas cerradas',    tipo: 'contador', objetivo: 1,   unidad: 'ventas',    paso: 1,  xp: 80, stat: 'percepcion',   indicador: 'cierres',  opcional: true },
      { nombre: 'Facturación',        tipo: 'contador', objetivo: 1000, unidad: 'S/',       paso: 100, xp: 60, stat: 'inteligencia', indicador: 'ingresos', opcional: true },
    ],
  },
  {
    id: 'gerente',
    nombre: 'Gerente de ventas',
    descripcion: 'Solo el trabajo: prospección, equipo, propuestas, cierres y facturación.',
    misiones: [
      { nombre: 'Prospección',        tipo: 'contador', objetivo: 25,  unidad: 'contactos', paso: 5,   xp: 45, stat: 'percepcion',   indicador: 'contactos' },
      { nombre: 'Reunión con el equipo', tipo: 'checkbox',                                            xp: 30, stat: 'percepcion' },
      { nombre: 'Uno a uno con un vendedor', tipo: 'checkbox',                                        xp: 35, stat: 'inteligencia' },
      { nombre: 'Revisar el embudo',  tipo: 'checkbox',                                               xp: 30, stat: 'percepcion' },
      { nombre: 'Reuniones con clientes', tipo: 'contador', objetivo: 3, unidad: 'reuniones', paso: 1, xp: 45, stat: 'percepcion',   indicador: 'reuniones' },
      { nombre: 'Propuestas enviadas', tipo: 'contador', objetivo: 4,   unidad: 'envíos',    paso: 1,  xp: 45, stat: 'percepcion',   indicador: 'propuestas' },
      { nombre: 'Formación en ventas', tipo: 'contador', objetivo: 45,  unidad: 'min',       paso: 15, xp: 45, stat: 'inteligencia' },
      { nombre: 'Ventas cerradas',    tipo: 'contador', objetivo: 1,   unidad: 'ventas',    paso: 1,  xp: 90, stat: 'percepcion',   indicador: 'cierres',  opcional: true },
      { nombre: 'Facturación',        tipo: 'contador', objetivo: 1500, unidad: 'S/',       paso: 100, xp: 70, stat: 'inteligencia', indicador: 'ingresos', opcional: true },
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

export const PLANTILLA_INICIAL = 'preparacion-ascenso';

export const buscarPlantilla = (id) => PLANTILLAS.find((p) => p.id === id) ?? PLANTILLAS[0];
