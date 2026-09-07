/* ==========================================================================
   Feature: notificaciones del Sistema. Ventanas emergentes en cola y el
   texto que se escribe solo. El sonido lo pone js/sonido/, que se reexporta
   aquí para que las demás features tengan una sola puerta de entrada.
   ========================================================================== */

import { sonar } from '../sonido/sintetizador.js';

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

export { sonar };

el.notiAceptar.addEventListener('click', () => {
  // El primer toque completa el texto; el segundo pasa a la siguiente ventana.
  if (escribiendo) {
    escribiendo();
    return;
  }
  siguiente();
});
