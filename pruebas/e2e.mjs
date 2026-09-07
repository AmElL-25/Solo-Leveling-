/* Prueba de extremo a extremo con Playwright.
   Levanta antes un servidor local (python3 -m http.server 8000) y ejecuta:
     npm install playwright && node pruebas/e2e.mjs
   Recorre el ciclo completo: misión diaria, fatiga, jefe semanal, recompensa,
   títulos, puertas, tienda, clase, castigo con bloqueo de la semana,
   plantillas, indicadores de negocio, cuadro de mando, cuota y los dos modos
   (SISTEMA y SALES) con su horario automático. */

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

/* --------------------------------- utilidades --------------------------------- */

const titulo = () => page.locator('#noti-titulo').textContent();
const visible = () => page.locator('#notificacion').isHidden().then((h) => !h);

/** Cierra la cola de ventanas; el primer clic completa el texto, el segundo avanza. */
const aceptar = async () => {
  while (await visible()) {
    await page.click('#noti-aceptar');
    await page.waitForTimeout(60);
  }
};
/** Va cerrando ventanas hasta encontrar la que se busca. */
const buscarAviso = async (esperado, maximo = 8) => {
  for (let i = 0; i < maximo && await visible(); i += 1) {
    if ((await titulo()) === esperado) return true;
    await page.click('#noti-aceptar');
    await page.waitForTimeout(60);
    if (await visible() && (await titulo()) === esperado) return true;
  }
  return false;
};

const leerEstado = () => page.evaluate(() => JSON.parse(localStorage.getItem('sistema:v1')));
const escribirEstado = (cambios) => page.evaluate((c) => {
  const e = JSON.parse(localStorage.getItem('sistema:v1'));
  Object.assign(e, c);
  localStorage.setItem('sistema:v1', JSON.stringify(e));
}, cambios);

const mision = (nombre) => page.locator('.mision', { hasText: nombre });
const fijar = async (nombre, valor) => {
  const campo = mision(nombre).locator('input[data-accion="fijar"]');
  await campo.fill(String(valor));
  await campo.dispatchEvent('change');
};
const completarTodo = async (incluirOpcionales = false) => {
  const tarjetas = incluirOpcionales
    ? await page.locator('.mision').all()
    : await page.locator('.mision:not(.mision--opcional)').all();
  for (const tarjeta of tarjetas) {
    const campo = tarjeta.locator('input[data-accion="fijar"]');
    if (await campo.count()) { await campo.fill('9999'); await campo.dispatchEvent('change'); }
    else await tarjeta.locator('[data-accion="alternar"]').click();
  }
};
const hoy = () => new Date().toISOString().slice(0, 10);

/* ------------------------------- 1. arranque ------------------------------- */

await page.goto(URL);
await page.waitForSelector('.mision');

comprobar('la misión diaria se anuncia', await titulo() === 'HA LLEGADO LA MISIÓN DIARIA');
await aceptar();

comprobar('el set inicial es el de gerente de ventas y físico',
  await page.locator('.mision').count() === 12);
comprobar('trae misiones de resultado opcionales',
  await page.locator('.mision--opcional').count() === 2);
comprobar('trae misiones de trabajo', await mision('Prospección').count() === 1);
comprobar('trae misiones de físico', await mision('Entrenamiento de fuerza').count() === 1);
comprobar('ventana de estado con vida', /^\d+\/\d+$/.test(await page.locator('#hp-texto').textContent()));
comprobar('poder de combate calculado', Number(await page.locator('#poder').textContent()) > 0);
comprobar('empieza sin clase', await page.locator('#clase').textContent() === 'Sin clase');
comprobar('advertencia del Sistema',
  (await page.locator('#aviso-diaria').textContent()).includes('castigo correspondiente'));
comprobar('el botón de recompensa empieza deshabilitado', await page.locator('#btn-completar').isDisabled());

/* ------------------------- 2. progreso, fatiga y jefe ------------------------- */

const inicial = await leerEstado();
comprobar('aparece un jefe al empezar la semana', Boolean(inicial.jefe));
comprobar('la vida del jefe sale de las misiones obligatorias', inicial.jefe.vidaMaxima === 3060,
  `(${inicial.jefe?.vidaMaxima})`);
comprobar('la tarjeta del jefe se pinta', await page.locator('.jefe').count() === 1);

await mision('Prospección').locator('[data-accion="mas"]').click();
comprobar('el botón + suma el paso',
  (await mision('Prospección').locator('.barra__texto').textContent()).trim().startsWith('5 / 20'));

await fijar('Prospección', 9999);
comprobar('completar un objetivo genera fatiga',
  Number(await page.locator('#fatiga-texto').textContent()) > 0);
const golpeMision = inicial.jefe.vidaMaxima - (await leerEstado()).jefe.vida;
comprobar('completar un objetivo daña al jefe', golpeMision > 0, `(${golpeMision} de daño)`);
await fijar('Prospección', 0);
comprobar('deshacerlo le devuelve la vida al jefe',
  (await leerEstado()).jefe.vida === inicial.jefe.vidaMaxima);
comprobar('deshacerlo devuelve la fatiga',
  Number(await page.locator('#fatiga-texto').textContent()) === 0);

/* --------------------------- 3. recompensa del día --------------------------- */

await completarTodo();
comprobar('las opcionales no bloquean el día',
  await page.locator('#dia-porcentaje').textContent() === '100%');
comprobar('se habilita reclamar', !(await page.locator('#btn-completar').isDisabled()));

await page.click('#btn-completar');
comprobar('recompensa anunciada', await titulo() === 'MISIÓN DIARIA COMPLETADA');
await aceptar();

const trasDia = await leerEstado();
comprobar('gana oro', trasDia.jugador.oro > 0, `(${trasDia.jugador.oro})`);
comprobar('sube de nivel', trasDia.jugador.nivel > 1, `(nivel ${trasDia.jugador.nivel})`);
comprobar('desbloquea el título Superviviente', trasDia.jugador.titulos.includes('superviviente'));
comprobar('la racha sube a 1', trasDia.jugador.racha === 1);
comprobar('no se puede reclamar dos veces', await page.locator('#btn-completar').isDisabled());

/* ------------------------------ 4. títulos ------------------------------ */

const poderAntes = Number(await page.locator('#poder').textContent());
await page.click('.pestana[data-tab="estado"]');
await page.click('.titulo-item[data-titulo="superviviente"]');
comprobar('el título se equipa', await page.locator('#titulo-equipado').textContent() === 'Superviviente');
comprobar('el título aumenta el poder', Number(await page.locator('#poder').textContent()) > poderAntes);
comprobar('el historial pinta 30 días', await page.locator('.dia').count() === 30);

/* ------------------------------- 5. puertas ------------------------------- */

await escribirEstado({
  puerta: {
    id: 'p1', rango: 'E', nombre: 'Burpees', objetivo: 40, unidad: 'reps', paso: 5,
    progreso: 0, xp: 60, oro: 40, stat: 'fuerza', cerrada: false, fecha: hoy(),
  },
});
await page.reload();
await page.waitForSelector('.puerta');
await aceptar();
comprobar('la puerta muestra su rango', await page.locator('#puerta-rango').textContent() === 'RANGO E');

const oroAntesPuerta = (await leerEstado()).jugador.oro;
const vidaAntesPuerta = (await leerEstado()).jefe.vida;
await page.locator('.puerta input[data-accion="puerta-fijar"]').fill('40');
await page.locator('.puerta input[data-accion="puerta-fijar"]').dispatchEvent('change');
await page.click('[data-accion="cerrar-puerta"]');
comprobar('puerta despejada', await titulo() === 'PUERTA DESPEJADA');
await aceptar();

const trasPuerta = await leerEstado();
comprobar('la puerta paga oro', trasPuerta.jugador.oro === oroAntesPuerta + 40);
comprobar('la puerta cuenta para el título', trasPuerta.jugador.puertasCerradas === 1);
comprobar('la puerta pega más fuerte que un objetivo',
  vidaAntesPuerta - trasPuerta.jefe.vida > golpeMision * 2,
  `(${vidaAntesPuerta - trasPuerta.jefe.vida} frente a ${golpeMision})`);

/* -------------------------- 6. tienda e inventario -------------------------- */

await escribirEstado({ jugador: { ...trasPuerta.jugador, oro: 1000, fatiga: 40 } });
await page.reload();
await aceptar();
await page.click('.pestana[data-tab="tienda"]');
await page.click('[data-comprar="pocion_energia"]');
await aceptar();
comprobar('la compra descuenta oro', (await leerEstado()).jugador.oro === 920);
comprobar('el objeto entra en el inventario', (await leerEstado()).inventario.pocion_energia === 1);
await page.click('[data-usar="pocion_energia"]');
await aceptar();
comprobar('la poción elimina la fatiga', (await leerEstado()).jugador.fatiga === 0);
comprobar('el objeto se consume', (await leerEstado()).inventario.pocion_energia === 0);

/* --------------------------- 7. cambio de clase --------------------------- */

const antesClase = await leerEstado();
await escribirEstado({ jugador: { ...antesClase.jugador, nivel: 10 } });
await page.reload();
await aceptar();
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

/* ------------------- 8. fallar el día: castigo y bloqueo ------------------- */

await escribirEstado({
  dia: { fecha: '2000-01-01', completado: false, xpGanada: 0, avisado: true },
  jugador: { ...conClase.jugador, racha: 9, oro: 1000 },
});
await page.reload();
await page.waitForSelector('.mision');
comprobar('salta la zona de penalización', await titulo() === 'ZONA DE PENALIZACIÓN');
comprobar('anuncia el castigo asignado', await buscarAviso('CASTIGO ASIGNADO'));
await aceptar();

const castigado = await leerEstado();
comprobar('el castigo queda activo', castigado.castigo.activo === true);
comprobar('el castigo trae misión propia', Boolean(castigado.castigo.mision?.nombre));
comprobar('el castigo empieza sin aceptar', castigado.castigo.aceptado === false);
comprobar('guarda la racha perdida', castigado.castigo.rachaPerdida === 9);
comprobar('rompe la racha', castigado.jugador.racha === 0);
comprobar('quita vida', castigado.jugador.hp > 0 && castigado.jugador.hp < 328);
comprobar('la sección de castigo es visible', await page.locator('#seccion-castigo').isVisible());
comprobar('la banda de castigo es visible', await page.locator('#banda-castigo').isVisible());
comprobar('el fondo cambia en castigo',
  (await page.locator('body').getAttribute('class')).includes('en-castigo'));

// Completar el día ya no perdona la deuda
await completarTodo();
await page.click('#btn-completar');
await aceptar();
comprobar('completar el día no levanta el castigo', (await leerEstado()).castigo.activo === true);

/* ------------------ 9. la semana no empieza con deuda ------------------ */

await page.evaluate(() => {
  const e = JSON.parse(localStorage.getItem('sistema:v1'));
  e.jefe = { ...e.jefe, semana: '2000-01-03', vida: 500, derrotado: false };
  localStorage.setItem('sistema:v1', JSON.stringify(e));
});
await page.reload();
await page.waitForSelector('.mision');
comprobar('avisa de que la semana está bloqueada', await buscarAviso('SEMANA BLOQUEADA'));
await aceptar();
comprobar('no hay jefe mientras haya deuda', (await leerEstado()).jefe === null);

/* -------------------- 10. aceptar y cumplir el castigo -------------------- */

await page.click('[data-accion="aceptar-castigo"]');
comprobar('anuncia el castigo aceptado', await titulo() === 'CASTIGO ACEPTADO');
await aceptar();
comprobar('el castigo queda aceptado', (await leerEstado()).castigo.aceptado === true);

const objetivo = (await leerEstado()).castigo.mision.objetivo;
const campoCastigo = page.locator('input[data-accion="castigo-fijar"]');
await campoCastigo.fill(String(objetivo));
await campoCastigo.dispatchEvent('change');
await page.click('[data-accion="cumplir-castigo"]');
comprobar('anuncia la deuda saldada', await titulo() === 'DEUDA SALDADA');
comprobar('al saldar la deuda vuelve el jefe', await buscarAviso('HA APARECIDO UN JEFE'));
await aceptar();

const saldado = await leerEstado();
comprobar('el castigo desaparece', saldado.castigo.activo === false);
comprobar('cuenta como castigo superado', saldado.jugador.castigosSuperados === 1);
comprobar('la semana se desbloquea con jefe nuevo', Boolean(saldado.jefe) && saldado.jefe.vida > 0);
comprobar('la sección de castigo se oculta', await page.locator('#seccion-castigo').isHidden());

/* ------------------------ 11. plantillas de misión ------------------------ */

await page.click('.pestana[data-tab="ajustes"]');
page.once('dialog', (d) => d.accept());
await page.click('[data-plantilla="fisico"]');
await aceptar();
comprobar('la plantilla cambia el set de misiones', await page.locator('.mision').count() === 5);
comprobar('la plantilla trae sus propias misiones', await mision('Movilidad').count() === 1);
await page.reload();
await aceptar();
comprobar('la plantilla persiste', await page.locator('.mision').count() === 5);

/* ---------------------- 12. misiones propias y borrado ---------------------- */

await page.click('.pestana[data-tab="mision"]');
await page.click('#btn-nueva');
await page.fill('#campo-nombre', 'Leer 20 páginas');
await page.selectOption('#campo-tipo', 'checkbox');
await page.selectOption('#campo-stat', 'inteligencia');
await page.click('#form-mision button[value="guardar"]');
comprobar('se añade la misión', await page.locator('.mision').count() === 6);
const sencilla = mision('Leer 20 páginas');
await sencilla.locator('[data-accion="alternar"]').click();
comprobar('la casilla se marca como hecha',
  (await sencilla.getAttribute('class')).includes('mision--completa'));
page.once('dialog', (d) => d.accept());
await sencilla.locator('[data-accion="borrar"]').click();
comprobar('se borra la misión', await page.locator('.mision').count() === 5);

/* ---------------------- 13. indicadores y cuadro de mando ---------------------- */

await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.mision');
await aceptar();

await fijar('Prospección', 20);
await fijar('Propuestas enviadas', 9999);   // el progreso se limita al objetivo: 3
await page.click('.pestana[data-tab="cuadro"]');
const kpis = await page.locator('.kpi').allTextContents();
comprobar('el cuadro muestra los contactos de hoy',
  kpis.some((t) => t.includes('Contactos') && t.includes('20')));
comprobar('el cuadro muestra las propuestas',
  kpis.some((t) => t.includes('Propuestas') && t.includes('3')));
comprobar('sin cierres todavía no hay conversión',
  (await page.locator('#cuadro-mes').textContent()).includes('sin propuestas') === false);

// Un cierre da conversión y hace el doble de daño que la actividad
const vidaAntes = (await leerEstado()).jefe.vida;
await page.click('.pestana[data-tab="mision"]');
await fijar('Ventas cerradas', 1);
const danoCierre = vidaAntes - (await leerEstado()).jefe.vida;
comprobar('la venta cerrada pega el doble que la actividad',
  Math.abs(danoCierre - golpeMision * (80 / 40) * 2) <= 2,
  `(${danoCierre} de daño)`);

await page.click('.pestana[data-tab="cuadro"]');
comprobar('la conversión aparece al haber cierres (1 de 3)',
  (await page.locator('#cuadro-mes').textContent()).includes('33.3 %'));

/* ------------------------------- 14. cuota ------------------------------- */

await page.click('.pestana[data-tab="ajustes"]');
await page.fill('#ajuste-cuota', '5000');
await page.locator('#ajuste-cuota').dispatchEvent('change');
await aceptar();
await page.click('.pestana[data-tab="mision"]');
await fijar('Facturación', 4500);   // por encima del objetivo diario: es un registro
comprobar('una misión opcional admite más que su objetivo',
  (await leerEstado()).misiones.find((m) => m.nombre === 'Facturación').progreso === 4500);
await page.click('.pestana[data-tab="cuadro"]');
comprobar('la cuota guarda el objetivo', (await leerEstado()).cuota.objetivo === 5000);
comprobar('la cuota avanza con la facturación',
  (await page.locator('#cuadro-cuota').textContent()).includes('90 %'));

/* ------------------- 15. el historial guarda las cifras ------------------- */

await escribirEstado({ dia: { fecha: '2000-01-01', completado: true, xpGanada: 0, avisado: true } });
await page.reload();
await page.waitForSelector('.mision');
await aceptar();
const archivado = (await leerEstado()).historial[0];
comprobar('el día archivado guarda los contactos', archivado.indicadores.contactos === 20);
comprobar('el día archivado guarda la facturación', archivado.indicadores.ingresos === 4500);

/* ------------------------- 16. los dos modos ------------------------- */

comprobar('arranca en modo Sistema',
  await page.locator('body').getAttribute('data-modo') === 'sistema');
comprobar('el interruptor ofrece el otro modo',
  await page.locator('#btn-modo').textContent() === 'MODO SALES');

await page.click('#btn-modo');
comprobar('el interruptor cambia a SALES',
  await page.locator('body').getAttribute('data-modo') === 'sales');
comprobar('la cabecera cambia de nombre',
  await page.locator('#titulo-app').textContent() === 'SALES');
comprobar('el vocabulario cambia: el jefe es el objetivo de la semana',
  (await page.locator('#tab-mision').textContent()).includes('OBJETIVO DE LA SEMANA'));
comprobar('el texto del aviso diario se traduce',
  (await page.locator('#aviso-diaria').textContent()).includes('plan de recuperación'));
comprobar('las pestañas se traducen',
  (await page.locator('.pestana[data-tab="mision"]').textContent()).trim() === 'OBJETIVOS');
comprobar('el modo se guarda', (await leerEstado()).ajustes.modo === 'sales');

// Nada desaparece: siguen todas las secciones
comprobar('en SALES sigue estando la tienda', await page.locator('#tab-tienda').count() === 1);
comprobar('en SALES siguen estando los títulos', await page.locator('#lista-titulos .titulo-item').count() > 0);
comprobar('en SALES sigue estando la puerta', await page.locator('#puerta').count() === 1);
comprobar('en SALES sigue estando el cuadro de mando', await page.locator('#tab-cuadro').count() === 1);

// Los avisos no bloquean: salen arriba y se van solos
await page.click('.pestana[data-tab="mision"]');
await page.locator('.mision', { hasText: 'Cardio' }).locator('[data-accion="mas"]').click();
await page.evaluate(async () => {
  const { notificar } = await import('/js/notificaciones/notificaciones.js');
  notificar({ titulo: 'PRUEBA', lineas: [{ texto: 'aviso discreto' }] });
});
await page.waitForTimeout(150);
comprobar('en SALES el aviso es una barra flotante', await page.locator('.aviso').count() === 1);
comprobar('el aviso no bloquea la pantalla', await page.locator('#notificacion').isHidden());
await page.click('.aviso');
await page.waitForTimeout(350);
comprobar('el aviso se puede cerrar de un toque', await page.locator('.aviso').count() === 0);

await page.click('#btn-modo');
comprobar('se vuelve al Sistema de un toque',
  await page.locator('#titulo-app').textContent() === 'EL SISTEMA');
comprobar('el vocabulario vuelve',
  (await page.locator('#tab-mision').textContent()).includes('JEFE DE LA SEMANA'));

/* --------------------- 17. horario automático y migración --------------------- */

const horario = await page.evaluate(async () => {
  const { modoEfectivo, forzar, estadoInicialHorario } = await import('/js/modo/reglas.js');
  const ajustes = {
    modo: 'sistema',
    horario: { ...estadoInicialHorario(), activo: true, dias: [1, 2, 3, 4, 5], desde: '09:00', hasta: '18:00' },
    forzado: null,
  };
  const lunes = (hora) => new Date(2026, 8, 7, hora, 0);   // 7 de septiembre de 2026, lunes
  const domingo = (hora) => new Date(2026, 8, 6, hora, 0);
  const dentro = modoEfectivo(ajustes, lunes(11));
  const fuera = modoEfectivo(ajustes, lunes(21));
  const finde = modoEfectivo(ajustes, domingo(11));
  // Forzar SISTEMA en horario de oficina manda hasta que acabe el tramo
  const forzados = { ...ajustes, forzado: forzar(ajustes, 'sistema', lunes(11)) };
  return {
    dentro,
    fuera,
    finde,
    forzadoDentro: modoEfectivo(forzados, lunes(12)),
    forzadoFuera: modoEfectivo(forzados, lunes(21)),
  };
});
comprobar('en horario laboral se pone en SALES', horario.dentro === 'sales');
comprobar('fuera de horario vuelve al Sistema', horario.fuera === 'sistema');
comprobar('el fin de semana es del Sistema', horario.finde === 'sistema');
comprobar('el interruptor manda dentro del tramo', horario.forzadoDentro === 'sistema');
comprobar('al cambiar el tramo vuelve a mandar el horario', horario.forzadoFuera === 'sistema');

const migrado = await page.evaluate(async () => {
  const { normalizarAjustes } = await import('/js/ajustes/reglas.js');
  return normalizarAjustes({ sonido: true, animaciones: true, tema: 'sobrio' });
});
comprobar('el ajuste antiguo "sobrio" se migra a modo SALES', migrado.modo === 'sales');


console.log(ok.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
if (errores.length) console.log('\nERRORES DE PÁGINA:\n' + errores.join('\n'));
console.log(`\n${ok.length} correctas, ${fallos.length} fallidas, ${errores.length} errores de página`);
await navegador.close();
process.exit(fallos.length || errores.length ? 1 : 0);
