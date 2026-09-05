/* ==========================================================================
   Feature: notificaciones del Sistema. Ventanas emergentes en cola y el
   pitido que las acompaña. No conoce nada del resto del juego: cualquier
   otra feature le pide "notificar" o "sonar" y ella se encarga del resto.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

const el = {
  notificacion: $('#notificacion'),
  notiTitulo: $('#noti-titulo'),
  notiCuerpo: $('#noti-cuerpo'),
  notiAceptar: $('#noti-aceptar'),
};

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

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
