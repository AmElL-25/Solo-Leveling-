/* Service worker: guarda la app en caché para que funcione sin conexión.
   Sube CACHE al cambiar cualquier archivo para forzar la actualización. */

const CACHE = 'sistema-v1';

const ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './js/estado.js',
  './js/sistema.js',
  './js/ui.js',
  './manifest.webmanifest',
  './iconos/icono.svg',
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
