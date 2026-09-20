/* Service worker: guarda la app en caché para que funcione sin conexión.
   Sube CACHE al cambiar cualquier archivo para forzar la actualización. */

const CACHE = 'sistema-v25';

const ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/app.js',
  './js/progreso.js',
  './js/nucleo/fecha.js',
  './js/nucleo/almacenamiento.js',
  './js/nucleo/supabase.js',
  './js/cuenta/configuracion.js',
  './js/cuenta/reglas.js',
  './js/cuenta/vista.js',
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
  './js/incursion/reglas.js',
  './js/incursion/vista.js',
  './js/medidas/reglas.js',
  './js/medidas/vista.js',
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
      .then((claves) => {
        // Había caché anterior = esto es un relevo, no una instalación nueva.
        // Solo entonces hay pestañas pintadas con la versión vieja.
        const habiaVersionAnterior = claves.some((c) => c !== CACHE);
        return Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
          .then(() => habiaVersionAnterior);
      })
      .then((habiaVersionAnterior) => self.clients.claim().then(() => habiaVersionAnterior))
      // La pestaña abierta se pintó con la versión anterior, que ya está fuera
      // de la caché: sin esto haría falta abrir la app dos veces para ver lo
      // nuevo. Se recarga desde aquí porque el relevo lo decide este
      // trabajador, que es el nuevo — la página todavía corre el código viejo
      // y no puede encargarse ella. Pasa una sola vez por versión.
      .then((habiaVersionAnterior) => (habiaVersionAnterior
        ? self.clients.matchAll({ type: 'window' })
          .then((pestanas) => Promise.all(pestanas.map((p) => p.navigate(p.url).catch(() => {}))))
        : null))
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET' || !peticion.url.startsWith('http')) return;

  // La sincronización nunca se guarda: su gracia es traer lo último del
  // servidor, y una copia en caché devolvería siempre la primera respuesta.
  // Sin red, bajar() ya se queda con lo local, así que no se pierde nada.
  if (new URL(peticion.url).pathname.startsWith('/api/')) return;

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
