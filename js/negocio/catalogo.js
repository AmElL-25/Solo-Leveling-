/* ==========================================================================
   Feature: negocio — catálogo de indicadores. Cada misión puede declarar a
   qué indicador comercial aporta; las que no lo hacen (fuerza, cardio, sueño)
   siguen contando solo para el juego.
   ========================================================================== */

export const INDICADORES = [
  { id: 'contactos',  nombre: 'Contactos',  dinero: false, resultado: false },
  { id: 'reuniones',  nombre: 'Reuniones',  dinero: false, resultado: false },
  { id: 'propuestas', nombre: 'Propuestas', dinero: false, resultado: false },
  { id: 'cierres',    nombre: 'Ventas cerradas', dinero: false, resultado: true },
  { id: 'ingresos',   nombre: 'Facturación', dinero: true,  resultado: true },
];

export const MONEDAS = ['S/', '€', '$', 'MXN', 'COP', 'ARS'];

export const buscarIndicador = (id) => INDICADORES.find((i) => i.id === id) ?? null;
export const esIndicador = (id) => INDICADORES.some((i) => i.id === id);

/** Las ventas cerradas y la facturación pegan más fuerte que la actividad. */
export const esResultado = (id) => Boolean(buscarIndicador(id)?.resultado);
export const MULTIPLICADOR_RESULTADO = 2;
