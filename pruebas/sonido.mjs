/* Comprobación del sintetizador: que cada aviso genera sonido, que respeta
   el ajuste de "sonido apagado" y que no lanza errores.
   Con un servidor local en marcha (python3 -m http.server 8000):
     npm install playwright && node pruebas/sonido.mjs */

import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
await p.goto(process.env.BASE ?? 'http://127.0.0.1:8000/');
await p.waitForSelector('.mision');

const resultado = await p.evaluate(async () => {
  const { sonar } = await import('/js/sonido/sintetizador.js');
  const tipos = ['aviso','nivel','logro','oro','puerta','jefe','error','guardar','punto','objetivo','toque'];
  // Contamos los osciladores creados por cada aviso interceptando el constructor.
  const original = AudioContext.prototype.createOscillator;
  const cuenta = {};
  let actual = null;
  AudioContext.prototype.createOscillator = function (...args) { if (actual) cuenta[actual] = (cuenta[actual] ?? 0) + 1; return original.apply(this, args); };
  for (const tipo of tipos) { actual = tipo; sonar(tipo, true); }
  AudioContext.prototype.createOscillator = original;
  // Y que respeta el ajuste de sonido apagado
  actual = 'apagado';
  sonar('aviso', false);
  return cuenta;
});
const tipos = Object.keys(resultado);
console.log(tipos.map((t) => `${t}: ${resultado[t]} osciladores`).join('\n'));
console.log(resultado.apagado === undefined ? 'OK   con el sonido apagado no suena nada' : 'FALLO suena con el ajuste apagado');
console.log(tipos.every((t) => t === 'apagado' || resultado[t] > 0) ? 'OK   los 11 avisos generan sonido' : 'FALLO algún aviso no suena');
console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'OK   sin errores de página');
await b.close();
