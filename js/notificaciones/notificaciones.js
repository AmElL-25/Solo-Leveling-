/* ==========================================================================
   Feature: notificaciones del Sistema. Ventanas emergentes en cola, el
   texto que se escribe solo y los pitidos que las acompañan. No conoce
   nada del resto del juego: cualquier otra feature le pide "notificar" o
   "sonar" y ella se encarga del resto.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

const el = {
  notificacion: $('#notificacion'),
  notiTitulo: $('#noti-titulo'),
  notiCuerpo: $('#noti-cuerpo'),
  notiAceptar: $('#noti-aceptar'),
};

const cola = [];
let mostrando = false;
let escribiendo = null;   // función que termina la escritura de golpe
let audio = null;

const reduceMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
let animarTexto = true;

export function configurarAnimaciones(activas) {
  animarTexto = activas && !reduceMovimiento;
}

/** Sonidos del Sistema, generados al vuelo: no hay archivos de audio. */
export function sonar(tipo = 'aviso', activo = true) {
  if (!activo) return;
  const secuencias = {
    aviso: [[880, 0], [1320, 0.09]],
    nivel: [[660, 0], [880, 0.08], [1320, 0.16], [1760, 0.24]],
    error: [[220, 0], [165, 0.12]],
    oro: [[1046, 0], [1568, 0.07]],
    puerta: [[440, 0], [330, 0.1], [550, 0.2]],
  };
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    for (const [frecuencia, retardo] of secuencias[tipo] ?? secuencias.aviso) {
      const osc = audio.createOscillator();
      const vol = audio.createGain();
      const inicio = audio.currentTime + retardo;
      osc.type = 'sine';
      osc.frequency.value = frecuencia;
      vol.gain.setValueAtTime(0.0001, inicio);
      vol.gain.exponentialRampToValueAtTime(0.1, inicio + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.3);
      osc.connect(vol).connect(audio.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.32);
    }
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
  el.notiAceptar.textContent = aviso.boton ?? 'ACEPTAR';
  el.notificacion.classList.toggle('notificacion--peligro', aviso.tipo === 'peligro');
  el.notificacion.hidden = false;
  el.notiAceptar.focus();

  const lineas = (aviso.lineas ?? []).map((linea) => (
    typeof linea === 'string' ? { texto: linea } : linea
  ));

  // Los párrafos se crean vacíos y el texto entra después: así nunca se
  // interpreta como HTML lo que escriba el jugador.
  el.notiCuerpo.innerHTML = lineas
    .map((linea) => `<p class="${linea.destacado ? 'destacado' : ''}"></p>`)
    .join('');

  const parrafos = [...el.notiCuerpo.querySelectorAll('p')];
  if (!animarTexto) {
    parrafos.forEach((p, i) => { p.textContent = lineas[i].texto; });
    escribiendo = null;
    return;
  }
  escribir(parrafos, lineas);
}

/** Va soltando el texto letra a letra, como los mensajes del Sistema. */
function escribir(parrafos, lineas) {
  let indice = 0;
  let posicion = 0;

  const terminar = () => {
    clearInterval(temporizador);
    parrafos.forEach((p, i) => {
      p.textContent = lineas[i].texto;
      p.classList.remove('escribiendo');
    });
    escribiendo = null;
  };

  const temporizador = setInterval(() => {
    if (indice >= parrafos.length) return terminar();

    const parrafo = parrafos[indice];
    const texto = lineas[indice].texto;
    parrafo.classList.add('escribiendo');
    posicion += 1;
    parrafo.textContent = texto.slice(0, posicion);

    if (posicion >= texto.length) {
      parrafo.classList.remove('escribiendo');
      indice += 1;
      posicion = 0;
    }
  }, 18);

  escribiendo = terminar;
}

el.notiAceptar.addEventListener('click', () => {
  // El primer toque completa el texto; el segundo pasa a la siguiente ventana.
  if (escribiendo) {
    escribiendo();
    return;
  }
  siguiente();
});
