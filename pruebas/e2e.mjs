/* Prueba de extremo a extremo con Playwright.
   Levanta antes un servidor local (python3 -m http.server 8000) y ejecuta:
     npm install playwright && node pruebas/e2e.mjs
   Recorre el ciclo completo: misión diaria, fatiga, recompensa, oro, títulos,
   puertas, tienda, inventario, cambio de clase, penalización, jefe semanal
   y persistencia. */

import { chromium } from 'playwright';

const URL = process.env.URL ?? 'http://127.0.0.1:8000/';
const fallos = [], ok = [];
const comprobar = (n, c, extra = '') => (c ? ok : fallos).push(`${c ? 'OK  ' : 'FALLO'} ${n} ${extra}`);

const navegador = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

const aceptar = async () => {
  // El primer clic completa el texto; el segundo cierra la ventana.
  while (!(await page.locator('#notificacion').isHidden())) {
    await page.click('#noti-aceptar');
    await page.waitForTimeout(60);
  }
};
const leerEstado = () => page.evaluate(() => JSON.parse(localStorage.getItem('sistema:v1')));
const escribirEstado = async (cambios) => {
  await page.evaluate((c) => {
    const e = JSON.parse(localStorage.getItem('sistema:v1'));
    Object.assign(e, c);
    localStorage.setItem('sistema:v1', JSON.stringify(e));
  }, cambios);
};
const completarTodo = async () => {
  for (const tarjeta of await page.locator('.mision').all()) {
    const campo = tarjeta.locator('input[data-accion="fijar"]');
    if (await campo.count()) { await campo.fill('9999'); await campo.dispatchEvent('change'); }
    else await tarjeta.locator('[data-accion="alternar"]').click();
  }
};

await page.goto(URL);
await page.waitForSelector('.mision');

// 1. Ventana de estado del anime
comprobar('la misión diaria se anuncia',
  await page.locator('#noti-titulo').textContent() === 'HA LLEGADO LA MISIÓN DIARIA');
await aceptar();
comprobar('ventana de estado con vida', /^\d+\/\d+$/.test(await page.locator('#hp-texto').textContent()));
comprobar('ventana de estado con maná', /^\d+\/\d+$/.test(await page.locator('#mp-texto').textContent()));
comprobar('poder de combate calculado', Number(await page.locator('#poder').textContent()) > 0);
comprobar('empieza sin clase', await page.locator('#clase').textContent() === 'Sin clase');
comprobar('empieza sin título', await page.locator('#titulo-equipado').textContent() === 'Sin título');
comprobar('advertencia del Sistema',
  (await page.locator('#aviso-diaria').textContent()).includes('castigo correspondiente'));

// 2. Fatiga al completar objetivos
await page.locator('.mision').first().locator('input[data-accion="fijar"]').fill('9999');
await page.locator('.mision').first().locator('input[data-accion="fijar"]').dispatchEvent('change');
comprobar('completar una misión genera fatiga', Number(await page.locator('#fatiga-texto').textContent()) > 0);

// 3. Recompensa: XP, oro, título y nivel
await completarTodo();
comprobar('el día llega al 100 %', await page.locator('#dia-porcentaje').textContent() === '100%');
await page.click('#btn-completar');
comprobar('recompensa anunciada',
  await page.locator('#noti-titulo').textContent() === 'MISIÓN DIARIA COMPLETADA');
await aceptar();
const trasDia = await leerEstado();
comprobar('gana oro', trasDia.jugador.oro > 0, `(${trasDia.jugador.oro})`);
comprobar('sube de nivel', trasDia.jugador.nivel > 1, `(nivel ${trasDia.jugador.nivel})`);
comprobar('desbloquea el título Superviviente', trasDia.jugador.titulos.includes('superviviente'));
comprobar('la racha sube a 1', trasDia.jugador.racha === 1);

// 4. Equipar un título sube el poder de combate
const poderAntes = Number(await page.locator('#poder').textContent());
await page.click('.pestana[data-tab="estado"]');
await page.click('.titulo-item[data-titulo="superviviente"]');
comprobar('el título se equipa',
  await page.locator('#titulo-equipado').textContent() === 'Superviviente');
comprobar('el título aumenta el poder', Number(await page.locator('#poder').textContent()) > poderAntes);

// 5. Puerta: inyectamos una y la cerramos
await escribirEstado({
  puerta: {
    id: 'p1', rango: 'E', nombre: 'Flexiones explosivas', objetivo: 30, unidad: 'reps',
    paso: 5, progreso: 0, xp: 60, oro: 40, stat: 'fuerza', cerrada: false,
    fecha: new Date().toISOString().slice(0, 10),
  },
});
await page.reload();
await page.waitForSelector('.puerta');
comprobar('la puerta muestra su rango', await page.locator('#puerta-rango').textContent() === 'RANGO E');
const oroAntes = (await leerEstado()).jugador.oro;
await page.locator('.puerta input[data-accion="puerta-fijar"]').fill('30');
await page.locator('.puerta input[data-accion="puerta-fijar"]').dispatchEvent('change');
await page.click('[data-accion="cerrar-puerta"]');
comprobar('puerta despejada', await page.locator('#noti-titulo').textContent() === 'PUERTA DESPEJADA');
await aceptar();
const trasPuerta = await leerEstado();
comprobar('la puerta paga oro', trasPuerta.jugador.oro === oroAntes + 40);
comprobar('la puerta cuenta para el título', trasPuerta.jugador.puertasCerradas === 1);
comprobar('la puerta queda cerrada', await page.locator('.puerta--cerrada').count() === 1);

// 6. Tienda e inventario
await escribirEstado({ jugador: { ...trasPuerta.jugador, oro: 1000, fatiga: 40 } });
await page.reload();
await page.click('.pestana[data-tab="tienda"]');
await page.click('[data-comprar="pocion_energia"]');
await aceptar();
comprobar('la compra descuenta oro', (await leerEstado()).jugador.oro === 920);
comprobar('el objeto entra en el inventario', (await leerEstado()).inventario.pocion_energia === 1);
await page.click('[data-usar="pocion_energia"]');
await aceptar();
comprobar('la poción elimina la fatiga', (await leerEstado()).jugador.fatiga === 0);
comprobar('el objeto se consume', (await leerEstado()).inventario.pocion_energia === 0);

// 7. Cambio de clase al nivel 10
const estadoActual = await leerEstado();
await escribirEstado({ jugador: { ...estadoActual.jugador, nivel: 10 } });
await page.reload();
await page.click('.pestana[data-tab="estado"]');
comprobar('se ofrece el cambio de clase', await page.locator('#btn-clase').count() === 1);
const fuerzaAntes = (await leerEstado()).jugador.stats.fuerza;
await page.click('#btn-clase');
await page.click('.clase-item[data-clase="guerrero"]');
await aceptar();
const conClase = await leerEstado();
comprobar('la clase queda registrada', conClase.jugador.clase === 'guerrero');
comprobar('la clase da puntos de estadística', conClase.jugador.stats.fuerza === fuerzaAntes + 3);
comprobar('la ventana muestra la clase', await page.locator('#clase').textContent() === 'Guerrero');

// 8. Penalización: castigo activo, media experiencia y pergamino
await escribirEstado({
  dia: { fecha: '2000-01-01', completado: false, xpGanada: 0, avisado: true },
  jugador: { ...conClase.jugador, racha: 9, oro: 1000 },
});
await page.reload();
await page.waitForSelector('.mision');
comprobar('salta la zona de penalización',
  await page.locator('#noti-titulo').textContent() === 'ZONA DE PENALIZACIÓN');
await aceptar();
comprobar('la banda de castigo es visible', await page.locator('#banda-castigo').isVisible());
comprobar('el fondo cambia en castigo',
  (await page.locator('body').getAttribute('class')).includes('en-castigo'));
const enCastigo = await leerEstado();
comprobar('el castigo queda registrado', enCastigo.castigo.activo === true);
comprobar('guarda la racha perdida', enCastigo.castigo.rachaPerdida === 9);
comprobar('rompe la racha', enCastigo.jugador.racha === 0);
comprobar('quita vida', enCastigo.jugador.hp !== null && enCastigo.jugador.hp > 0);

// El pergamino devuelve la racha
await page.evaluate(() => {
  const e = JSON.parse(localStorage.getItem('sistema:v1'));
  e.inventario.pergamino_perdon = 1;
  localStorage.setItem('sistema:v1', JSON.stringify(e));
});
await page.reload();
await page.click('.pestana[data-tab="tienda"]');
await page.click('[data-usar="pergamino_perdon"]');
await aceptar();
const perdonado = await leerEstado();
comprobar('el pergamino anula el castigo', perdonado.castigo.activo === false);
comprobar('el pergamino devuelve la racha', perdonado.jugador.racha === 9);
comprobar('la banda de castigo desaparece', await page.locator('#banda-castigo').isHidden());

// 9. Persistencia y misiones propias
await page.click('.pestana[data-tab="mision"]');
await page.click('#btn-nueva');
await page.fill('#campo-nombre', 'Leer 20 páginas');
await page.selectOption('#campo-tipo', 'checkbox');
await page.selectOption('#campo-stat', 'inteligencia');
await page.click('#form-mision button[value="guardar"]');
comprobar('se añade la misión', await page.locator('.mision').count() === 5);
await page.reload();
await page.waitForSelector('.mision');
comprobar('la misión persiste', await page.locator('.mision').count() === 5);

// 10. Jefe semanal: aparición, daño, curación y golpe de la puerta
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.mision');
await aceptar();

const conJefe = await leerEstado();
comprobar('aparece un jefe al empezar la semana', Boolean(conJefe.jefe));
comprobar('la vida del jefe sale de la misión diaria (180 XP × 6)',
  conJefe.jefe.vidaMaxima === 1080, `(${conJefe.jefe?.vidaMaxima})`);
comprobar('la tarjeta del jefe se pinta', await page.locator('.jefe').count() === 1);

const campoFlexiones = page.locator('.mision').first().locator('input[data-accion="fijar"]');
await campoFlexiones.fill('9999');
await campoFlexiones.dispatchEvent('change');
const golpeMision = 1080 - (await leerEstado()).jefe.vida;
comprobar('completar un objetivo le hace daño', golpeMision > 0, `(${golpeMision} de daño)`);
await campoFlexiones.fill('0');
await campoFlexiones.dispatchEvent('change');
comprobar('deshacer el objetivo le devuelve la vida', (await leerEstado()).jefe.vida === 1080);

await escribirEstado({
  puerta: {
    id: 'p2', rango: 'E', nombre: 'Burpees', objetivo: 40, unidad: 'reps', paso: 5,
    progreso: 0, xp: 60, oro: 40, stat: 'fuerza', cerrada: false,
    fecha: new Date().toISOString().slice(0, 10),
  },
});
await page.reload();
await page.waitForSelector('.puerta');
await aceptar();
await page.locator('.puerta input[data-accion="puerta-fijar"]').fill('40');
await page.locator('.puerta input[data-accion="puerta-fijar"]').dispatchEvent('change');
await page.click('[data-accion="cerrar-puerta"]');
await aceptar();
const golpePuerta = 1080 - (await leerEstado()).jefe.vida;
comprobar('la puerta pega más fuerte que un objetivo', golpePuerta > golpeMision * 2,
  `(${golpePuerta} frente a ${golpeMision})`);

// 11. Rematarlo: recompensa, contador y título
const antesDeMatar = await leerEstado();
await page.evaluate(() => {
  const e = JSON.parse(localStorage.getItem('sistema:v1'));
  e.jefe.vida = 5;
  e.jugador.jefesDerrotados = 4;
  e.misiones[1].progreso = 0;
  localStorage.setItem('sistema:v1', JSON.stringify(e));
});
await page.reload();
await page.waitForSelector('.mision');
await aceptar();
const oroPrevio = (await leerEstado()).jugador.oro;
const campoAbdominales = page.locator('.mision').nth(1).locator('input[data-accion="fijar"]');
await campoAbdominales.fill('9999');
await campoAbdominales.dispatchEvent('change');
comprobar('anuncia la derrota del jefe',
  await page.locator('#noti-titulo').textContent() === 'JEFE DERROTADO');
await aceptar();
const matado = await leerEstado();
comprobar('el jefe queda derrotado', matado.jefe.derrotado === true && matado.jefe.vida === 0);
comprobar('paga oro por el jefe', matado.jugador.oro > oroPrevio, `(${matado.jugador.oro})`);
comprobar('suma al contador de jefes', matado.jugador.jefesDerrotados === 5);
comprobar('desbloquea el título Cazador de jefes', matado.jugador.titulos.includes('cazajefes'));
comprobar('la tarjeta se marca como derrotada', await page.locator('.jefe--derrotado').count() === 1);

// 12. Cambio de semana: el jefe vivo escapa y llega otro
await page.evaluate(() => {
  const e = JSON.parse(localStorage.getItem('sistema:v1'));
  e.jefe = { ...e.jefe, semana: '2000-01-03', vida: 500, derrotado: false };
  localStorage.setItem('sistema:v1', JSON.stringify(e));
});
await page.reload();
await page.waitForSelector('.mision');
comprobar('avisa de que el jefe escapó',
  await page.locator('#noti-titulo').textContent() === 'EL JEFE HA ESCAPADO');
await page.click('#noti-aceptar');
await page.waitForTimeout(80);
await page.click('#noti-aceptar');
comprobar('aparece el jefe de la semana nueva',
  await page.locator('#noti-titulo').textContent() === 'HA APARECIDO UN JEFE');
await aceptar();
const relevo = await leerEstado();
comprobar('el jefe nuevo llega con toda la vida', relevo.jefe.vida === relevo.jefe.vidaMaxima);
comprobar('el jefe nuevo es de esta semana', relevo.jefe.semana !== '2000-01-03');


console.log(ok.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
if (errores.length) console.log('\nERRORES DE PÁGINA:\n' + errores.join('\n'));
console.log(`\n${ok.length} correctas, ${fallos.length} fallidas, ${errores.length} errores de página`);
await navegador.close();
process.exit(fallos.length || errores.length ? 1 : 0);
