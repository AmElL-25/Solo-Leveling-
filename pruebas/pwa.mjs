/* Comprobación de los requisitos de PWA: manifest, iconos, metadatos de iOS,
   service worker y ausencia de scroll horizontal en pantallas de móvil.
   Con un servidor local en marcha (python3 -m http.server 8000):
     npm install playwright && node pruebas/pwa.mjs
   Para comprobar la versión ya publicada:
     BASE=https://tu-app.vercel.app/ node pruebas/pwa.mjs */

import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://127.0.0.1:8000/';
const fallos = [], ok = [];
const comprobar = (n, c, extra = '') => (c ? ok : fallos).push(`${c ? 'OK  ' : 'FALLO'} ${n} ${extra}`);

const b = await chromium.launch({ args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(base);
await p.waitForSelector('.mision');

// Manifest enlazado y válido
const href = await p.getAttribute('link[rel="manifest"]', 'href');
comprobar('el HTML enlaza el manifest', href === 'manifest.webmanifest');
const m = await (await p.request.get(base + href)).json();
comprobar('name', typeof m.name === 'string' && m.name.length > 0, `("${m.name}")`);
comprobar('short_name cabe bajo el icono', m.short_name.length <= 12, `("${m.short_name}")`);
comprobar('display standalone', m.display === 'standalone');
comprobar('theme_color', m.theme_color === '#04070f');
comprobar('background_color', m.background_color === '#04070f');
comprobar('start_url', Boolean(m.start_url));
comprobar('icono de 192', m.icons.some((i) => i.sizes === '192x192' && i.type === 'image/png'));
comprobar('icono de 512', m.icons.some((i) => i.sizes === '512x512' && i.type === 'image/png'));
comprobar('icono maskable para Android', m.icons.some((i) => (i.purpose || '').includes('maskable')));

// Todos los iconos del manifest existen
for (const icono of m.icons) {
  const r = await p.request.get(base + icono.src);
  comprobar(`descarga ${icono.src}`, r.ok(), `(${r.status()})`);
}

// iOS
const apple = await p.getAttribute('link[rel="apple-touch-icon"]', 'href');
comprobar('apple-touch-icon en PNG', Boolean(apple) && apple.endsWith('.png'), `(${apple})`);
comprobar('apple-touch-icon descarga', (await p.request.get(base + apple)).ok());
comprobar('apple-mobile-web-app-capable',
  await p.getAttribute('meta[name="apple-mobile-web-app-capable"]', 'content') === 'yes');
comprobar('nombre en la pantalla de inicio de iOS',
  await p.getAttribute('meta[name="apple-mobile-web-app-title"]', 'content') === 'El Sistema');
comprobar('barra de estado de iOS',
  Boolean(await p.getAttribute('meta[name="apple-mobile-web-app-status-bar-style"]', 'content')));
comprobar('viewport-fit=cover para la muesca',
  (await p.getAttribute('meta[name="viewport"]', 'content')).includes('viewport-fit=cover'));
comprobar('theme-color en el HTML',
  await p.getAttribute('meta[name="theme-color"]', 'content') === '#04070f');

// Service worker con manejador de fetch (requisito de instalabilidad en Chrome)
await p.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 });
comprobar('service worker controlando la página', true);

// Responsive: sin desbordamiento horizontal en el móvil más estrecho
for (const ancho of [320, 390, 430]) {
  await p.setViewportSize({ width: ancho, height: 800 });
  const desborda = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  comprobar(`sin scroll horizontal a ${ancho}px`, !desborda);
}

console.log(ok.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
console.log(`\n${ok.length} correctas, ${fallos.length} fallidas`);
await b.close();
process.exit(fallos.length ? 1 : 0);
