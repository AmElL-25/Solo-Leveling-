/* ==========================================================================
   Capa de presentación: pinta el estado en el DOM y gestiona las ventanas
   de notificación del Sistema. No modifica el estado del juego.
   ========================================================================== */

import { STATS } from './estado.js';
import {
  xpNecesaria, rango, misionCompleta, progresoMision,
  porcentajeDia, diaCompleto, recompensaDia, msHastaMedianoche,
} from './sistema.js';

const $ = (selector) => document.querySelector(selector);

const el = {
  nombre: $('#nombre-jugador'),
  rango: $('#rango'),
  nivel: $('#nivel'),
  xpBarra: $('#xp-barra'),
  xpTexto: $('#xp-texto'),
  racha: $('#racha'),
  mejorRacha: $('#mejor-racha'),
  dias: $('#dias'),
  puntos: $('#puntos'),
  reloj: $('#reloj'),
  misiones: $('#lista-misiones'),
  diaPorcentaje: $('#dia-porcentaje'),
  avisoDiaria: $('#aviso-diaria'),
  btnCompletar: $('#btn-completar'),
  stats: $('#lista-stats'),
  insigniaPuntos: $('#insignia-puntos'),
  avisoPuntos: $('#aviso-puntos'),
  historial: $('#historial'),
  sonido: $('#ajuste-sonido'),
  notificacion: $('#notificacion'),
  notiTitulo: $('#noti-titulo'),
  notiCuerpo: $('#noti-cuerpo'),
  notiAceptar: $('#noti-aceptar'),
};

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/** Muestra 10 en vez de 10.00, pero conserva 2.5. */
const numero = (valor) => (Number.isInteger(valor) ? String(valor) : String(Math.round(valor * 100) / 100));

const nombreStat = (id) => STATS.find((s) => s.id === id)?.nombre ?? id;

/* ------------------------------- render ------------------------------- */

export function render(estado) {
  renderVentanaEstado(estado);
  renderMisiones(estado);
  renderStats(estado);
  renderHistorial(estado);
  el.sonido.checked = estado.ajustes.sonido;
}

function renderVentanaEstado(estado) {
  const { jugador } = estado;
  const necesaria = xpNecesaria(jugador.nivel);

  el.nombre.textContent = jugador.nombre;
  el.rango.innerHTML = `<small>RANGO</small>${rango(jugador.nivel)}`;
  el.nivel.textContent = jugador.nivel;
  el.xpBarra.style.width = `${Math.min(100, (jugador.xp / necesaria) * 100)}%`;
  el.xpTexto.textContent = `${jugador.xp} / ${necesaria} XP`;
  el.racha.textContent = jugador.racha;
  el.mejorRacha.textContent = jugador.mejorRacha;
  el.dias.textContent = jugador.diasCompletados;
  el.puntos.textContent = jugador.puntosLibres;
}

function renderMisiones(estado) {
  const porcentaje = Math.round(porcentajeDia(estado) * 100);
  el.diaPorcentaje.textContent = `${porcentaje}%`;

  if (!estado.misiones.length) {
    el.misiones.innerHTML = '<p class="vacio">Sin misiones. Crea la primera para empezar a subir de nivel.</p>';
  } else {
    el.misiones.innerHTML = estado.misiones.map(tarjetaMision).join('');
  }

  const completo = diaCompleto(estado);
  const reclamado = estado.dia.completado;
  el.btnCompletar.disabled = !completo || reclamado;
  el.btnCompletar.textContent = reclamado ? 'MISIÓN DIARIA COMPLETADA' : 'RECLAMAR RECOMPENSA';
  el.btnCompletar.classList.toggle('boton--hecho', reclamado);

  const { total } = recompensaDia(estado);
  el.avisoDiaria.classList.toggle('alerta--ok', reclamado || completo);
  if (reclamado) {
    el.avisoDiaria.textContent = `Recompensa reclamada: +${estado.dia.xpGanada} XP. Vuelve mañana, jugador.`;
  } else if (completo) {
    el.avisoDiaria.textContent = `Objetivos cumplidos. Reclama tus ${total} XP antes de medianoche.`;
  } else {
    el.avisoDiaria.textContent = 'Completa todas las misiones antes de medianoche o serás penalizado.';
  }
}

function tarjetaMision(mision) {
  const completa = misionCompleta(mision);
  const ancho = progresoMision(mision) * 100;
  const unidad = mision.unidad ? ` ${escapar(mision.unidad)}` : '';

  const controles = mision.tipo === 'checkbox'
    ? `<button class="boton ${completa ? 'boton--hecho' : ''}" data-accion="alternar" type="button">
         ${completa ? '✔ HECHO' : 'MARCAR COMO HECHO'}
       </button>`
    : `<button class="boton" data-accion="menos" type="button" aria-label="Restar">−</button>
       <input class="paso" data-accion="fijar" type="number" inputmode="decimal" min="0"
              max="${mision.objetivo}" step="${mision.paso}" value="${numero(mision.progreso)}"
              aria-label="Progreso de ${escapar(mision.nombre)}">
       <button class="boton" data-accion="mas" type="button" aria-label="Sumar">+${numero(mision.paso)}</button>`;

  return `
    <article class="mision ${completa ? 'mision--completa' : ''}" data-id="${escapar(mision.id)}">
      <div class="mision__cabecera">
        <h3>${escapar(mision.nombre)}</h3>
        <div class="mision__acciones">
          <button class="icono" data-accion="editar" type="button" title="Editar" aria-label="Editar misión">&#9998;</button>
          <button class="icono" data-accion="borrar" type="button" title="Borrar" aria-label="Borrar misión">&#10005;</button>
        </div>
      </div>
      <div class="barra barra--mision">
        <div class="barra__relleno" style="width:${ancho}%"></div>
        <span class="barra__texto">${numero(mision.progreso)} / ${numero(mision.objetivo)}${unidad}</span>
      </div>
      <div class="mision__controles">${controles}</div>
      <div class="mision__pie">
        <span class="xp">+${mision.xp} XP</span>
        <span>${escapar(nombreStat(mision.stat))}</span>
      </div>
    </article>`;
}

function renderStats(estado) {
  const { puntosLibres, stats } = estado.jugador;

  el.insigniaPuntos.textContent = `${puntosLibres} ${puntosLibres === 1 ? 'punto' : 'puntos'}`;
  el.avisoPuntos.textContent = puntosLibres > 0
    ? 'Tienes puntos sin repartir. Elige dónde crecer.'
    : 'Sube de nivel o completa la misión diaria para conseguir puntos.';

  el.stats.innerHTML = STATS.map((s) => `
    <div class="stat">
      <span class="stat__nombre">${s.nombre}<small>${s.abrev}</small></span>
      <span class="stat__valor">${stats[s.id]}</span>
      <button class="icono" data-stat="${s.id}" type="button" ${puntosLibres > 0 ? '' : 'disabled'}
              title="Subir ${s.nombre}" aria-label="Subir ${s.nombre}">＋</button>
    </div>`).join('');
}

function renderHistorial(estado) {
  const registro = new Map(estado.historial.map((d) => [d.fecha, d]));
  const hoy = new Date();
  const celdas = [];

  // Últimos 30 días, del más antiguo al de hoy.
  for (let i = 29; i >= 0; i -= 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    const dia = registro.get(clave);
    const esHoy = i === 0;
    const porcentaje = esHoy ? Math.round(porcentajeDia(estado) * 100) : dia?.porcentaje ?? null;
    const completado = esHoy ? estado.dia.completado : Boolean(dia?.completado);

    let clase = 'dia';
    if (completado) clase += ' dia--ok';
    else if (porcentaje) clase += ' dia--parcial';
    if (esHoy) clase += ' dia--hoy';

    const detalle = porcentaje === null ? 'sin registro' : `${porcentaje}%`;
    celdas.push(`<div class="${clase}" title="${clave} · ${detalle}"></div>`);
  }

  el.historial.innerHTML = celdas.join('');
}

export function renderReloj() {
  const restante = msHastaMedianoche();
  const horas = Math.floor(restante / 3600000);
  const minutos = Math.floor((restante % 3600000) / 60000);
  el.reloj.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/* --------------------------- notificaciones --------------------------- */

const cola = [];
let mostrando = false;
let audio = null;

/** Pitido corto del Sistema; se genera en el momento, sin archivos de sonido. */
export function sonar(tipo = 'aviso', activo = true) {
  if (!activo) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const vol = audio.createGain();
    const frecuencias = { aviso: 880, nivel: 1320, error: 220 };
    osc.type = 'sine';
    osc.frequency.value = frecuencias[tipo] ?? 880;
    vol.gain.setValueAtTime(0.0001, audio.currentTime);
    vol.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.35);
    osc.connect(vol).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.36);
  } catch { /* el navegador puede bloquear el audio hasta la primera interacción */ }
}

/** Encola una ventana del Sistema: { titulo, lineas[], tipo, boton }. */
export function notificar(aviso) {
  cola.push(aviso);
  if (!mostrando) siguiente();
}

function siguiente() {
  const aviso = cola.shift();
  if (!aviso) {
    mostrando = false;
    el.notificacion.hidden = true;
    return;
  }

  mostrando = true;
  el.notiTitulo.textContent = aviso.titulo;
  el.notiCuerpo.innerHTML = (aviso.lineas ?? [])
    .map((linea) => `<p class="${linea.destacado ? 'destacado' : ''}">${escapar(linea.texto ?? linea)}</p>`)
    .join('');
  el.notiAceptar.textContent = aviso.boton ?? 'ACEPTAR';
  el.notificacion.classList.toggle('notificacion--peligro', aviso.tipo === 'peligro');
  el.notificacion.hidden = false;
  el.notiAceptar.focus();
}

el.notiAceptar.addEventListener('click', siguiente);

export { el };
