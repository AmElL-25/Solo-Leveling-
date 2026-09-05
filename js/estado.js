/* ==========================================================================
   Modelo de datos y persistencia.
   Todo el progreso vive en una única clave de localStorage y se normaliza al
   cargarlo, para que una copia manipulada o de otra versión nunca rompa la app.
   ========================================================================== */

export const CLAVE = 'sistema:v1';
export const VERSION = 1;
export const MAX_HISTORIAL = 60;

export const STATS = [
  { id: 'fuerza',       nombre: 'Fuerza',       abrev: 'FUE' },
  { id: 'agilidad',     nombre: 'Agilidad',     abrev: 'AGI' },
  { id: 'vitalidad',    nombre: 'Vitalidad',    abrev: 'VIT' },
  { id: 'inteligencia', nombre: 'Inteligencia', abrev: 'INT' },
  { id: 'percepcion',   nombre: 'Percepción',   abrev: 'PER' },
];

/** Fecha local en formato YYYY-MM-DD (no UTC: el día cambia a medianoche local). */
export function fechaHoy(fecha = new Date()) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function idNuevo() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** La misión diaria de partida: el set clásico del Sistema. */
export function misionesIniciales() {
  return [
    { nombre: 'Flexiones',   objetivo: 100, unidad: 'reps', paso: 10, xp: 40, stat: 'fuerza' },
    { nombre: 'Abdominales', objetivo: 100, unidad: 'reps', paso: 10, xp: 40, stat: 'vitalidad' },
    { nombre: 'Sentadillas', objetivo: 100, unidad: 'reps', paso: 10, xp: 40, stat: 'fuerza' },
    { nombre: 'Carrera',     objetivo: 10,  unidad: 'km',   paso: 1,  xp: 60, stat: 'agilidad' },
  ].map((m) => ({ id: idNuevo(), tipo: 'contador', progreso: 0, ...m }));
}

export function estadoInicial() {
  const stats = {};
  for (const s of STATS) stats[s.id] = 10;
  return {
    version: VERSION,
    jugador: {
      nombre: 'Jugador',
      nivel: 1,
      xp: 0,
      puntosLibres: 0,
      racha: 0,
      mejorRacha: 0,
      diasCompletados: 0,
      stats,
    },
    misiones: misionesIniciales(),
    dia: { fecha: fechaHoy(), completado: false, xpGanada: 0, avisado: false },
    historial: [],
    ajustes: { sonido: true },
  };
}

/* ----------------------------- normalización ----------------------------- */

function num(valor, porDefecto, minimo = -Infinity) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.max(minimo, n) : porDefecto;
}

/** Redondea a 2 decimales: los contadores admiten medios kilómetros. */
function dec(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo) * 100) / 100;
}

function entero(valor, porDefecto, minimo = 0) {
  return Math.round(num(valor, porDefecto, minimo));
}

function normalizarMision(mision) {
  if (!mision || typeof mision !== 'object') return null;
  const nombre = String(mision.nombre ?? '').trim().slice(0, 40);
  if (!nombre) return null;

  const tipo = mision.tipo === 'checkbox' ? 'checkbox' : 'contador';
  const objetivo = tipo === 'checkbox' ? 1 : Math.max(0.5, dec(mision.objetivo, 1, 0.5));

  return {
    id: String(mision.id || idNuevo()),
    nombre,
    tipo,
    objetivo,
    unidad: tipo === 'checkbox' ? '' : String(mision.unidad ?? '').trim().slice(0, 10),
    paso: tipo === 'checkbox' ? 1 : Math.max(0.5, dec(mision.paso, 1, 0.5)),
    progreso: Math.min(objetivo, dec(mision.progreso, 0, 0)),
    xp: Math.min(999, Math.max(1, entero(mision.xp, 20, 1))),
    stat: STATS.some((s) => s.id === mision.stat) ? mision.stat : 'fuerza',
  };
}

function normalizarEntradaHistorial(entrada) {
  if (!entrada || typeof entrada !== 'object' || !entrada.fecha) return null;
  return {
    fecha: String(entrada.fecha).slice(0, 10),
    porcentaje: Math.min(100, entero(entrada.porcentaje, 0, 0)),
    completado: Boolean(entrada.completado),
    xpGanada: entero(entrada.xpGanada, 0, 0),
  };
}

/** Devuelve siempre un estado válido, rellenando lo que falte con los valores por defecto. */
export function normalizar(datos) {
  const base = estadoInicial();
  if (!datos || typeof datos !== 'object') return base;

  const jugador = datos.jugador ?? {};
  const stats = {};
  for (const s of STATS) stats[s.id] = entero(jugador.stats?.[s.id], 10, 0);

  const misiones = Array.isArray(datos.misiones)
    ? datos.misiones.map(normalizarMision).filter(Boolean)
    : base.misiones;

  const historial = Array.isArray(datos.historial)
    ? datos.historial.map(normalizarEntradaHistorial).filter(Boolean).slice(0, MAX_HISTORIAL)
    : [];

  const dia = datos.dia ?? {};

  return {
    version: VERSION,
    jugador: {
      nombre: String(jugador.nombre ?? base.jugador.nombre).trim().slice(0, 24) || base.jugador.nombre,
      nivel: Math.max(1, entero(jugador.nivel, 1, 1)),
      xp: entero(jugador.xp, 0, 0),
      puntosLibres: entero(jugador.puntosLibres, 0, 0),
      racha: entero(jugador.racha, 0, 0),
      mejorRacha: entero(jugador.mejorRacha, 0, 0),
      diasCompletados: entero(jugador.diasCompletados, 0, 0),
      stats,
    },
    misiones,
    dia: {
      fecha: String(dia.fecha ?? base.dia.fecha).slice(0, 10),
      completado: Boolean(dia.completado),
      xpGanada: entero(dia.xpGanada, 0, 0),
      avisado: Boolean(dia.avisado),
    },
    historial,
    ajustes: { sonido: datos.ajustes?.sonido !== false },
  };
}

/* ------------------------------ persistencia ------------------------------ */

export function cargar() {
  let bruto = null;
  try {
    bruto = localStorage.getItem(CLAVE);
  } catch {
    return estadoInicial(); // navegador con el almacenamiento bloqueado
  }
  if (!bruto) return estadoInicial();
  try {
    return normalizar(JSON.parse(bruto));
  } catch {
    return estadoInicial();
  }
}

export function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

export function borrar() {
  try {
    localStorage.removeItem(CLAVE);
  } catch { /* nada que hacer */ }
}

export function exportar(estado) {
  return JSON.stringify(estado, null, 2);
}

export function importar(texto) {
  return normalizar(JSON.parse(texto));
}
