/* Prueba de extremo a extremo con Playwright.
   Levanta antes un servidor local (python3 -m http.server 8000) y ejecuta:
     npm install playwright && node pruebas/e2e.mjs
   Recorre el ciclo completo: misión diaria, recompensa, subida de nivel, puntos,
   creación y borrado de misiones, persistencia y penalización por fallar el día. */

import { chromium } from 'playwright';

const URL = process.env.URL ?? 'http://127.0.0.1:8000/';
const fallos = [];
const ok = [];
function comprobar(nombre, condicion, extra = '') {
  (condicion ? ok : fallos).push(`${condicion ? 'OK  ' : 'FALLO'} ${nombre} ${extra}`);
}

const navegador = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await page.goto(URL);
await page.waitForSelector('.mision');

// 1. Notificación de misión diaria en el primer arranque
comprobar('aparece la notificación de misión diaria',
  await page.locator('#noti-titulo').textContent() === 'HA LLEGADO LA MISIÓN DIARIA');
await page.click('#noti-aceptar');
comprobar('la notificación se cierra', await page.locator('#notificacion').isHidden());

comprobar('hay 4 misiones iniciales', await page.locator('.mision').count() === 4);
comprobar('el botón de recompensa empieza deshabilitado', await page.locator('#btn-completar').isDisabled());

// 2. Progreso con el botón +
await page.locator('.mision').first().locator('[data-accion="mas"]').click();
comprobar('el botón + suma el paso',
  (await page.locator('.mision').first().locator('.barra__texto').textContent()).trim().startsWith('10 / 100'));

// 3. Completar los 4 objetivos escribiendo el progreso
const tarjetas = await page.locator('.mision').all();
for (const tarjeta of tarjetas) {
  const campo = tarjeta.locator('input[data-accion="fijar"]');
  await campo.fill('9999');
  await campo.dispatchEvent('change');
}
comprobar('el día llega al 100 %', await page.locator('#dia-porcentaje').textContent() === '100%');
comprobar('se habilita reclamar', !(await page.locator('#btn-completar').isDisabled()));

// 4. Reclamar recompensa: 180 XP + 90 de bono = 270 → nivel 2 (100) y nivel 3 (263 restantes)
await page.click('#btn-completar');
comprobar('notificación de misión completada',
  await page.locator('#noti-titulo').textContent() === 'MISIÓN DIARIA COMPLETADA');
await page.click('#noti-aceptar');
comprobar('notificación de subida de nivel',
  await page.locator('#noti-titulo').textContent() === '¡HAS SUBIDO DE NIVEL!');
await page.click('#noti-aceptar');

const nivel = await page.locator('#nivel').textContent();
comprobar('sube de nivel', Number(nivel) > 1, `(nivel ${nivel})`);
comprobar('la racha sube a 1', await page.locator('#racha').textContent() === '1');
const puntos = Number(await page.locator('#puntos').textContent());
comprobar('reparte puntos de estadística', puntos > 0, `(${puntos} puntos)`);
comprobar('no se puede reclamar dos veces', await page.locator('#btn-completar').isDisabled());

// 5. Asignar un punto
await page.click('.pestana[data-tab="estado"]');
const fuerzaAntes = Number(await page.locator('.stat').first().locator('.stat__valor').textContent());
await page.locator('.stat').first().locator('button[data-stat]').click();
const fuerzaDespues = Number(await page.locator('.stat').first().locator('.stat__valor').textContent());
comprobar('el punto sube la estadística', fuerzaDespues === fuerzaAntes + 1);
comprobar('el punto se descuenta', Number(await page.locator('#puntos').textContent()) === puntos - 1);
comprobar('el historial pinta 30 días', await page.locator('.dia').count() === 30);
comprobar('hoy aparece como completado', await page.locator('.dia--hoy.dia--ok').count() === 1);

// 6. Crear una misión propia
await page.click('.pestana[data-tab="mision"]');
await page.click('#btn-nueva');
await page.fill('#campo-nombre', 'Leer 20 páginas');
await page.selectOption('#campo-tipo', 'checkbox');
comprobar('los campos de contador se ocultan en las misiones sencillas',
  await page.locator('#campos-contador').isHidden());
await page.selectOption('#campo-stat', 'inteligencia');
await page.click('#form-mision button[value="guardar"]');
comprobar('se añade la misión', await page.locator('.mision').count() === 5);
comprobar('la misión nueva reabre el día', await page.locator('#btn-completar').isDisabled());

// 7. Persistencia tras recargar
await page.reload();
await page.waitForSelector('.mision');
comprobar('la misión persiste tras recargar', await page.locator('.mision').count() === 5);
comprobar('el nivel persiste', await page.locator('#nivel').textContent() === nivel);
comprobar('no se repite la notificación diaria el mismo día',
  await page.locator('#notificacion').isHidden());

// 8. Marcar la misión de tipo casilla
const sencilla = page.locator('.mision', { hasText: 'Leer 20 páginas' });
await sencilla.locator('[data-accion="alternar"]').click();
comprobar('la casilla se marca como hecha',
  (await sencilla.getAttribute('class')).includes('mision--completa'));

// 9. Borrar la misión propia
page.once('dialog', (d) => d.accept());
await sencilla.locator('[data-accion="borrar"]').click();
comprobar('se borra la misión', await page.locator('.mision').count() === 4);

// 10. Cambio de día con la misión sin completar → penalización
await page.evaluate(() => {
  const estado = JSON.parse(localStorage.getItem('sistema:v1'));
  estado.dia = { fecha: '2000-01-01', completado: false, xpGanada: 0, avisado: true };
  estado.jugador.racha = 7;
  estado.misiones[0].progreso = 50;
  localStorage.setItem('sistema:v1', JSON.stringify(estado));
});
await page.reload();
await page.waitForSelector('.mision');
comprobar('salta la zona de penalización',
  await page.locator('#noti-titulo').textContent() === 'ZONA DE PENALIZACIÓN');
comprobar('la ventana de penalización se marca en rojo',
  (await page.locator('#notificacion').getAttribute('class')).includes('notificacion--peligro'));
await page.click('#noti-aceptar');
comprobar('tras la penalización llega la misión del nuevo día',
  await page.locator('#noti-titulo').textContent() === 'HA LLEGADO LA MISIÓN DIARIA');
await page.click('#noti-aceptar');
comprobar('se rompe la racha', await page.locator('#racha').textContent() === '0');
comprobar('el récord de racha se conserva', Number(await page.locator('#mejor-racha').textContent()) >= 1);
comprobar('el nivel no baja con la penalización', await page.locator('#nivel').textContent() === nivel);
comprobar('los progresos se reinician', await page.locator('#dia-porcentaje').textContent() === '0%');

console.log(ok.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
if (errores.length) console.log('\nERRORES DE PÁGINA:\n' + errores.join('\n'));
console.log(`\n${ok.length} correctas, ${fallos.length} fallidas, ${errores.length} errores de página`);
await navegador.close();
process.exit(fallos.length || errores.length ? 1 : 0);
