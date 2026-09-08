/* Service worker: guarda la app en caché para que funcione sin conexión.
   Sube CACHE al cambiar cualquier archivo para forzar la actualización. */

const CACHE = 'sistema-v12';

const ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './js/progreso.js',
  './js/nucleo/fecha.js',
  './js/nucleo/almacenamiento.js',
  './js/notificaciones/notificaciones.js',
  './js/sonido/sintetizador.js',
  './js/jugador/reglas.js',
  './js/jugador/vista.js',
  './js/misiones/reglas.js',
  './js/misiones/vista.js',
  './js/ciclo-diario/reglas.js',
  './js/ciclo-diario/vista.js',
  './js/castigo/catalogo.js',
  './js/castigo/reglas.js',
  './js/castigo/vista.js',
  './js/plantillas/catalogo.js',
  './js/plantillas/vista.js',
  './js/jefes/catalogo.js',
  './js/jefes/reglas.js',
  './js/jefes/vista.js',
  './js/puertas/catalogo.js',
  './js/puertas/reglas.js',
  './js/puertas/vista.js',
  './js/titulos/catalogo.js',
  './js/titulos/reglas.js',
  './js/titulos/vista.js',
  './js/clases/catalogo.js',
  './js/clases/reglas.js',
  './js/clases/vista.js',
  './js/tienda/catalogo.js',
  './js/tienda/reglas.js',
  './js/tienda/vista.js',
  './js/recompensas/reglas.js',
  './js/historial/reglas.js',
  './js/historial/vista.js',
  './js/ajustes/reglas.js',
  './js/configuracion/vista.js',
  './js/modo/catalogo.js',
  './js/modo/reglas.js',
  './js/modo/vista.js',
  './js/negocio/catalogo.js',
  './js/negocio/reglas.js',
  './js/negocio/vista.js',
  './js/ajustes/vista.js',
  './manifest.webmanifest',
  './iconos/icono.svg',
  './iconos/icono-app.svg',
  './iconos/favicon-32.png',
  './iconos/icono-180.png',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || !peticion.url.startsWith('http')) return;

  // Primero la caché: la app debe abrir igual de rápido con o sin red.
  evento.respondWith(
    caches.match(peticion).then((guardada) => guardada || fetch(peticion).then((respuesta) => {
      if (respuesta.ok && new URL(peticion.url).origin === location.origin) {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(peticion, copia));
      }
      return respuesta;
    }).catch(() => caches.match('./index.html')))
  );
});
