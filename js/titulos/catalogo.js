/* ==========================================================================
   Feature: títulos — catálogo. Cada título define qué hace falta para
   desbloquearlo y cuánta experiencia extra otorga al llevarlo equipado.
   ========================================================================== */

/* La marca es la mejor racha de cualquiera de los dos carriles. Se calcula
   aquí a mano y no se importa de jugador/reglas.js: ese módulo ya importa
   este, y cerrar el círculo sería pedir problemas. */
const mejorRacha = (jugador) =>
  Math.max(jugador.mejoresRachas?.personal ?? 0, jugador.mejoresRachas?.profesional ?? 0);

export const TITULOS = [
  {
    id: 'ninguno',
    nombre: 'Sin título',
    descripcion: 'Todavía no has hecho nada digno de mención.',
    bono: 0,
    condicion: () => true,
  },
  {
    id: 'superviviente',
    nombre: 'Superviviente',
    descripcion: 'Completa tu primera misión diaria.',
    bono: 2,
    condicion: (estado) => estado.jugador.diasCompletados >= 1,
  },
  {
    id: 'lobo_solitario',
    nombre: 'Lobo solitario',
    descripcion: 'Mantén una racha de 7 días.',
    bono: 5,
    condicion: (estado) => mejorRacha(estado.jugador) >= 7,
  },
  {
    id: 'indomable',
    nombre: 'Indomable',
    descripcion: 'Sal de una zona de penalización completando la misión del día.',
    bono: 5,
    condicion: (estado) => estado.jugador.castigosSuperados >= 1,
  },
  {
    id: 'rompepuertas',
    nombre: 'Rompepuertas',
    descripcion: 'Cierra 10 puertas.',
    bono: 5,
    condicion: (estado) => estado.jugador.puertasCerradas >= 10,
  },
  {
    id: 'cazajefes',
    nombre: 'Cazador de jefes',
    descripcion: 'Derrota 5 jefes semanales.',
    bono: 8,
    condicion: (estado) => estado.jugador.jefesDerrotados >= 5,
  },
  {
    id: 'cazador',
    nombre: 'Cazador de élite',
    descripcion: 'Alcanza el nivel 20.',
    bono: 8,
    condicion: (estado) => estado.jugador.nivel >= 20,
  },
  {
    id: 'insomne',
    nombre: 'El que nunca duerme',
    descripcion: 'Mantén una racha de 30 días.',
    bono: 10,
    condicion: (estado) => mejorRacha(estado.jugador) >= 30,
  },
  {
    id: 'matagigantes',
    nombre: 'Matagigantes',
    descripcion: 'Alcanza el nivel 35.',
    bono: 12,
    condicion: (estado) => estado.jugador.nivel >= 35,
  },
  {
    id: 'monarca',
    nombre: 'Monarca de las sombras',
    descripcion: 'Alcanza el nivel 60.',
    bono: 20,
    condicion: (estado) => estado.jugador.nivel >= 60,
  },
];

export const buscarTitulo = (id) => TITULOS.find((t) => t.id === id) ?? TITULOS[0];
