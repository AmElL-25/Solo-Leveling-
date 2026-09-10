/* ==========================================================================
   Feature: notificaciones del Sistema. Ventanas emergentes en cola y el
   texto que se escribe solo. El sonido lo pone js/sonido/, que se reexporta
   aquí para que las demás features tengan una sola puerta de entrada.
   ========================================================================== */

import { sonar } from '../sonido/sintetizador.js';

const $ = (selector) => document.querySelector(selector);

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const el = {
  notificacion: $('#notificacion'),
  notiTitulo: $('#noti-titulo'),
  notiCuerpo: $('#noti-cuerpo'),
  notiAceptar: $('#noti-aceptar'),
  avisos: $('#avisos'),
};

/* En SALES los avisos no interrumpen: salen arriba y se van solos. */
let discretos = false;
export function configurarAvisos({ discreto }) {
  discretos = Boolean(discreto);
}

const DURACION_AVISO = 5000;

function flotante(aviso) {
  const caja = document.createElement('div');
  caja.className = `aviso ${aviso.tipo === 'peligro' ? 'aviso--peligro' : ''}`;
  caja.innerHTML = `
    <p class="aviso__titulo">${escapar(aviso.titulo)}</p>
    ${(aviso.lineas ?? [])
      .map((linea) => `<p class="aviso__linea">${escapar(typeof linea === 'string' ? linea : linea.texto)}</p>`)
      .join('')}`;

  const cerrar = () => {
    caja.classList.add('aviso--saliendo');
    setTimeout(() => caja.remove(), 250);
  };
  caja.addEventListener('click', cerrar);
  setTimeout(cerrar, DURACION_AVISO);

  el.avisos.append(caja);
}

const cola = [];
let mostrando = false;
let escribiendo = null;   // función que termina la escritura de golpe

const reduceMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
let animarTexto = true;

export function configurarAnimaciones(activas) {
  animarTexto = activas && !reduceMovimiento;
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

  // Modo discreto: se sueltan todos seguidos, sin bloquear la pantalla.
  if (discretos) {
    flotante(aviso);
    siguiente();
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

  // Cada párrafo va en dos trozos: lo ya escrito y lo que falta, que ocupa
  // su sitio sin verse para que la ventana no crezca a tirones. El texto se
  // asigna siempre con textContent: nunca se interpreta como HTML lo que
  // haya escrito el jugador.
  el.notiCuerpo.replaceChildren(...lineas.map((linea) => {
    const parrafo = document.createElement('p');
    if (linea.destacado) parrafo.className = 'destacado';
    const escrito = document.createElement('span');
    const resto = document.createElement('span');
    resto.className = 'noti-resto';
    if (animarTexto) resto.textContent = linea.texto;
    else escrito.textContent = linea.texto;
    parrafo.append(escrito, resto);
    return parrafo;
  }));

  if (!animarTexto) {
    escribiendo = null;
    return;
  }
  escribir([...el.notiCuerpo.querySelectorAll('p')], lineas);
}

/** Va soltando el texto letra a letra, como los mensajes del Sistema. */
function escribir(parrafos, lineas) {
  let indice = 0;
  let posicion = 0;

  // El cursor vive en el trozo ya escrito, para que salga pegado a la última
  // letra y no al final del párrafo entero.
  const escrito = (parrafo) => parrafo.firstElementChild;
  const resto = (parrafo) => parrafo.lastElementChild;

  const terminar = () => {
    clearInterval(temporizador);
    parrafos.forEach((p, i) => {
      escrito(p).textContent = lineas[i].texto;
      escrito(p).classList.remove('escribiendo');
      resto(p).textContent = '';
    });
    escribiendo = null;
  };

  const temporizador = setInterval(() => {
    if (indice >= parrafos.length) return terminar();

    const parrafo = parrafos[indice];
    const texto = lineas[indice].texto;
    escrito(parrafo).classList.add('escribiendo');
    posicion += 1;
    escrito(parrafo).textContent = texto.slice(0, posicion);
    resto(parrafo).textContent = texto.slice(posicion);

    if (posicion >= texto.length) {
      escrito(parrafo).classList.remove('escribiendo');
      indice += 1;
      posicion = 0;
    }
  }, 18);

  escribiendo = terminar;
}

export { sonar };

el.notiAceptar.addEventListener('click', () => {
  // El primer toque completa el texto; el segundo pasa a la siguiente ventana.
  if (escribiendo) {
    escribiendo();
    return;
  }
  siguiente();
});
