/* ==========================================================================
   Feature: tienda — catálogo de objetos. El precio va en oro; el efecto lo
   resuelve reglas.js.
   ========================================================================== */

export const OBJETOS = [
  {
    id: 'pocion_vida',
    nombre: 'Poción de vida',
    precio: 60,
    icono: '🧪',
    descripcion: 'Restaura toda tu vida.',
  },
  {
    id: 'pocion_energia',
    nombre: 'Poción de energía',
    precio: 80,
    icono: '⚡',
    descripcion: 'Elimina toda la fatiga acumulada.',
  },
  {
    id: 'piedra_doble',
    nombre: 'Piedra de doble experiencia',
    precio: 150,
    icono: '💠',
    descripcion: 'Duplica la recompensa de tu próxima misión diaria.',
  },
  {
    id: 'llave_puerta',
    nombre: 'Llave de invocación',
    precio: 120,
    icono: '🗝️',
    descripcion: 'Invoca una puerta ahora mismo, sin esperar a que aparezca.',
  },
  {
    id: 'pergamino_perdon',
    nombre: 'Pergamino del perdón',
    precio: 250,
    icono: '📜',
    descripcion: 'Anula la penalización activa y te devuelve la racha perdida.',
  },
];

export const buscarObjeto = (id) => OBJETOS.find((o) => o.id === id) ?? null;
