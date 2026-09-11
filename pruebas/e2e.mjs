/* Prueba de extremo a extremo con Playwright.
   Levanta antes un servidor local (python3 -m http.server 8000) y ejecuta:
     npm install playwright && node pruebas/e2e.mjs
   Recorre el ciclo completo: misión diaria, fatiga, jefe semanal, recompensa,
   títulos, puertas, tienda, clase, castigo con bloqueo de la semana,
   plantillas, indicadores de negocio, cuadro de mando, cuota, los dos modos
   (SISTEMA y SALES) y el apartado de configuración. */

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
/* Solo las diarias del carril visible: los cupos de la semana viven en su
   propia lista y al cerrarlos saltan ventanas que taparían lo siguiente. */
const completarTodo = async (incluirOpcionales = false) => {
  const tarjetas = incluirOpcionales
    ? await page.locator('#lista-misiones .mision').all()
    : await page.locator('#lista-misiones .mision:not(.mision--opcional)').all();
  for (const tarjeta of tarjetas) {
    const campo = tarjeta.locator('input[data-accion="fijar"]');
    if (await campo.count()) { await campo.fill('9999'); await campo.dispatchEvent('change'); }
    else await tarjeta.locator('[data-accion="alternar"]').click();
  }
};
const hoy = () => new Date().toISOString().slice(0, 10);

const abrirConfig = async () => { await page.click('#btn-configuracion'); await page.waitForTimeout(80); };
const cerrarConfig = async (tab = 'mision') => {
  await page.click('#btn-cerrar-config');
  await page.waitForTimeout(80);
  await page.click(`.pestana[data-tab="${tab}"]`);
};
const filaObjetivo = (nombre) => page.locator('.objetivo-fila', { hasText: nombre });

/** Salta al otro carril con el interruptor de la cabecera. */
const cambiarCarril = async () => { await page.click('#btn-modo'); await page.waitForTimeout(120); };
const carrilActual = () => page.locator('body').getAttribute('data-modo');

/* ------------------------------- 1. arranque ------------------------------- */

await page.goto(URL);
await page.waitForSelector('.mision');

comprobar('la misión diaria se anuncia', await titulo() === 'HA LLEGADO LA MISIÓN DIARIA');
await aceptar();

comprobar('el carril personal trae sus cinco objetivos del día',
  await page.locator('#lista-misiones .mision').count() === 5,
  `(${await page.locator('#lista-misiones .mision').count()})`);
comprobar('y sus tres cupos de la semana',
  await page.locator('#lista-semanales .mision').count() === 3);
comprobar('en el carril personal está el cuerpo', await mision('Pasos').count() === 1);
comprobar('no se cuela nada del oficio', await mision('Escucha en llamada').count() === 0);
comprobar('el otro carril se resume en una línea',
  (await page.locator('#otro-carril').textContent()).includes('SALES'));
comprobar('ventana de estado con vida', /^\d+\/\d+$/.test(await page.locator('#hp-texto').textContent()));
comprobar('poder de combate calculado', Number(await page.locator('#poder').textContent()) > 0);
comprobar('empieza sin clase', await page.locator('#clase').textContent() === 'Sin clase');
comprobar('el aviso dice cuánto falta para el umbral',
  (await page.locator('#aviso-diaria').textContent()).includes('el día cuenta a partir del 80 %'));
comprobar('el botón de recompensa empieza deshabilitado', await page.locator('#btn-completar').isDisabled());

/* ------------------------- 2. progreso, fatiga y jefe ------------------------- */

const inicial = await leerEstado();
comprobar('aparece un jefe al empezar la semana', Boolean(inicial.jefe));
comprobar('la vida del jefe sale solo del carril personal',
  inicial.jefe.vidaMaxima === Math.max(100, Math.round(
    inicial.misiones.filter((m) => m.area === 'personal' && !m.opcional)
      .reduce((t, m) => t + m.xp, 0) * 6 * (1 + 625 / 1500))),
  `(${inicial.jefe?.vidaMaxima})`);
comprobar('la tarjeta del jefe se pinta', await page.locator('.jefe').count() === 1);

await mision('Pasos').locator('[data-accion="mas"]').click();
comprobar('el botón + suma el paso',
  (await mision('Pasos').locator('.barra__texto').textContent()).trim().startsWith('1000 / 8000'));

await fijar('Pasos', 9999);
comprobar('completar un objetivo genera fatiga',
  Number(await page.locator('#fatiga-texto').textContent()) > 0);
const golpeMision = inicial.jefe.vidaMaxima - (await leerEstado()).jefe.vida;
comprobar('completar un objetivo daña al jefe', golpeMision > 0, `(${golpeMision} de daño)`);
await fijar('Pasos', 0);
comprobar('deshacerlo le devuelve la vida al jefe',
  (await leerEstado()).jefe.vida === inicial.jefe.vidaMaxima);
comprobar('deshacerlo devuelve la fatiga',
  Number(await page.locator('#fatiga-texto').textContent()) === 0);

/* --------------------------- 3. recompensa del día --------------------------- */

await completarTodo();
comprobar('el carril llega al 100 %',
  await page.locator('#dia-porcentaje').textContent() === '100%');
comprobar('se habilita reclamar', !(await page.locator('#btn-completar').isDisabled()));

await page.click('#btn-completar');
comprobar('recompensa anunciada', await titulo() === 'MISIÓN DIARIA COMPLETADA');
await aceptar();

const trasDia = await leerEstado();
comprobar('gana oro', trasDia.jugador.oro > 0, `(${trasDia.jugador.oro})`);
comprobar('sube de nivel', trasDia.jugador.nivel > 1, `(nivel ${trasDia.jugador.nivel})`);
comprobar('desbloquea el título Superviviente', trasDia.jugador.titulos.includes('superviviente'));
comprobar('la racha personal sube a 1', trasDia.jugador.rachas.personal === 1);
comprobar('la profesional se queda donde estaba', trasDia.jugador.rachas.profesional === 0);
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

// Se deja el día a cero a propósito: ahora el castigo depende del porcentaje
// cumplido, así que arrastrar el progreso de las secciones anteriores daría
// un día aprobado y no habría castigo que comprobar.
await escribirEstado({
  dia: { fecha: '2000-01-01', completado: false, xpGanada: 0, avisado: true },
  misiones: conClase.misiones.map((m) => ({ ...m, progreso: 0 })),
  jugador: {
    ...conClase.jugador,
    rachas: { personal: 9, profesional: 0 },
    oro: 1000,
  },
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
comprobar('rompe la racha del carril', castigado.jugador.rachas.personal === 0);
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

await abrirConfig();
page.once('dialog', (d) => d.accept());
await page.click('[data-plantilla="fisico"]');
await aceptar();
comprobar('la plantilla cambia el set de misiones', await page.locator('.mision').count() === 5);
comprobar('la plantilla trae sus propias misiones', await mision('Movilidad').count() === 1);
await page.reload();
await aceptar();
comprobar('la plantilla persiste', await page.locator('.mision').count() === 5);

/* ---------------------- 12. misiones propias y borrado ---------------------- */

await abrirConfig();
await page.click('#btn-nueva');
await page.fill('#campo-nombre', 'Leer 20 páginas');
await page.selectOption('#campo-tipo', 'checkbox');
await page.selectOption('#campo-stat', 'inteligencia');
await page.click('#form-mision button[value="guardar"]');
await cerrarConfig();
comprobar('se añade la misión', await page.locator('#lista-misiones .mision').count() === 6);
const sencilla = mision('Leer 20 páginas');
await sencilla.locator('[data-accion="alternar"]').click();
comprobar('la casilla se marca como hecha',
  (await sencilla.getAttribute('class')).includes('mision--completa'));
await abrirConfig();
page.once('dialog', (d) => d.accept());
await filaObjetivo('Leer 20 páginas').locator('[data-accion="borrar"]').click();
await cerrarConfig();
comprobar('se borra la misión', await page.locator('#lista-misiones .mision').count() === 5);

/* ---------------------- 13. indicadores y cuadro de mando ---------------------- */

await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.mision');
await aceptar();

// La plantilla de gerente sí tiene cierres y facturación: es la que mide
// resultados, y sigue ahí para cuando llegue el puesto.
await abrirConfig();
page.once('dialog', (d) => d.accept());
await page.click('[data-plantilla="gerente-fisico"]');
await page.waitForTimeout(150);
await aceptar();          // la ventana del Sistema tapa el apartado: primero se cierra
await cerrarConfig();
comprobar('se puede volver a la plantilla de gerente',
  await mision('Prospección').count() === 1);

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

// Un cierre da conversión y hace el doble de daño que la actividad. Se mide
// contra una misión de actividad de la misma plantilla, no contra la de antes.
await page.click('.pestana[data-tab="mision"]');
const vidaLimpia = (await leerEstado()).jefe.vida;
await fijar('Reuniones con clientes', 9999);   // 40 XP, actividad
const danoActividad = vidaLimpia - (await leerEstado()).jefe.vida;
const vidaAntes = (await leerEstado()).jefe.vida;
await fijar('Ventas cerradas', 1);             // 80 XP, resultado: ×2
const danoCierre = vidaAntes - (await leerEstado()).jefe.vida;
comprobar('la venta cerrada pega el doble que la actividad',
  Math.abs(danoCierre - danoActividad * (80 / 40) * 2) <= 2,
  `(${danoCierre} frente a ${danoActividad})`);

await page.click('.pestana[data-tab="cuadro"]');
comprobar('la conversión aparece al haber cierres (1 de 3)',
  (await page.locator('#cuadro-mes').textContent()).includes('33.3 %'));

/* ------------------------------- 14. cuota ------------------------------- */

await abrirConfig();
await page.fill('#ajuste-cuota', '5000');
await page.locator('#ajuste-cuota').dispatchEvent('change');
await aceptar();
await cerrarConfig();
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

// Se vuelve a la plantilla de dos carriles: es la que tiene lado profesional.
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.mision');
await aceptar();

await page.click('#btn-modo');
comprobar('el interruptor cambia a SALES',
  await page.locator('body').getAttribute('data-modo') === 'sales');
comprobar('la cabecera cambia de nombre',
  await page.locator('#titulo-app').textContent() === 'SALES');
comprobar('el vocabulario cambia: el jefe es el objetivo de la semana',
  (await page.locator('#tab-mision').textContent()).includes('OBJETIVO DE LA SEMANA'));
comprobar('el texto del aviso diario se traduce',
  (await page.locator('#aviso-diaria').textContent()).includes('plan de recuperación'));
comprobar('en SALES se ven los objetivos del oficio',
  await mision('Escucha en llamada').count() === 1);
comprobar('y no los del cuerpo', await mision('Pasos').count() === 0);
comprobar('el resumen del otro carril apunta al Sistema',
  (await page.locator('#otro-carril').textContent()).includes('EL SISTEMA'));
comprobar('las pestañas se traducen',
  (await page.locator('.pestana[data-tab="mision"]').textContent()).trim() === 'OBJETIVOS');
comprobar('el modo se guarda', (await leerEstado()).ajustes.modo === 'sales');

// Nada desaparece: siguen todas las secciones
comprobar('en SALES sigue estando la tienda', await page.locator('#tab-tienda').count() === 1);
comprobar('en SALES siguen estando los títulos', await page.locator('#lista-titulos .titulo-item').count() > 0);
// El jefe y la puerta son retos del carril personal: en SALES no se enseñan,
// pero siguen ahí y vuelven al cambiar de carril.
comprobar('en SALES se esconden el jefe y la puerta',
  await page.locator('#retos-sistema').isHidden());
comprobar('pero no se pierden', await page.locator('#puerta').count() === 1);
comprobar('en SALES sigue estando el cuadro de mando', await page.locator('#tab-cuadro').count() === 1);

// Los avisos no bloquean: salen arriba y se van solos
await page.click('.pestana[data-tab="mision"]');
await page.locator('.mision', { hasText: 'Formación' }).locator('[data-accion="mas"]').click();
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


/* --------------------- 18. la configuración vive aparte --------------------- */

comprobar('la barra tiene cuatro pestañas', await page.locator('.pestana').count() === 4);
comprobar('ya no hay pestaña de ajustes',
  await page.locator('.pestana[data-tab="ajustes"]').count() === 0);
comprobar('la tarjeta del día no tiene lápiz',
  await page.locator('.mision [data-accion="editar"]').count() === 0);
comprobar('la tarjeta del día no tiene papelera',
  await page.locator('.mision [data-accion="borrar"]').count() === 0);
comprobar('la pantalla del día no tiene botón de crear',
  await page.locator('#tab-mision #btn-nueva').count() === 0);
comprobar('el apartado empieza cerrado', await page.locator('#configuracion').isHidden());

await abrirConfig();
comprobar('el engranaje abre la configuración', await page.locator('#configuracion').isVisible());
comprobar('el apartado lista los objetivos', await page.locator('.objetivo-fila').count() > 0);
comprobar('el apartado tiene los ajustes', await page.locator('#ajuste-sonido').isVisible());
comprobar('el apartado tiene las plantillas', await page.locator('#lista-plantillas').isVisible());
comprobar('el apartado tiene los datos', await page.locator('#btn-exportar').isVisible());

// Editar desde el apartado cambia la pantalla del día
await filaObjetivo('Pasos').locator('[data-accion="editar"]').click();
await page.fill('#campo-nombre', 'Pasos del día');
await page.click('#form-mision button[value="guardar"]');
comprobar('editar desde el apartado renombra el objetivo',
  await filaObjetivo('Pasos del día').count() === 1);
await cerrarConfig();
comprobar('el cambio se ve en la pantalla del día',
  await mision('Pasos del día').count() === 1);
comprobar('el botón de volver cierra el apartado',
  await page.locator('#configuracion').isHidden());

await abrirConfig();
await page.keyboard.press('Escape');
await page.waitForTimeout(80);
comprobar('la tecla Escape también cierra', await page.locator('#configuracion').isHidden());

/* ------------------- 19. la ventana de penalización ------------------- */

await page.evaluate(async () => {
  const { notificar } = await import('/js/notificaciones/notificaciones.js');
  notificar({
    titulo: 'ZONA DE PENALIZACIÓN',
    tipo: 'peligro',
    boton: 'ACEPTO EL CASTIGO',
    lineas: [
      'Has fallado la misión del 2026-09-09 (0 % completado).',
      { texto: '-55 HP', destacado: true },
      'Ganarás la mitad de experiencia hasta que completes un día entero.',
    ],
  });
});
// 420 ms: hay que dejar terminar la animación de entrada (scale + translateY,
// 0,32 s) o se mide la ventana encogida y a medio camino.
await page.waitForTimeout(420);

// Sale en el centro exacto de la pantalla
const sitio = await page.evaluate(() => {
  const c = document.querySelector('#noti-ventana').getBoundingClientRect();
  return {
    dx: Math.abs(c.x + c.width / 2 - innerWidth / 2),
    dy: Math.abs(c.y + c.height / 2 - innerHeight / 2),
    alto: Math.round(c.height),
  };
});
comprobar('la ventana sale centrada en la pantalla', sitio.dx < 1 && sitio.dy < 1,
  `desviación ${sitio.dx.toFixed(1)}×${sitio.dy.toFixed(1)}px`);

// El texto de dentro también va centrado
const centrado = await page.evaluate(() => {
  const c = (sel) => getComputedStyle(document.querySelector(sel));
  return {
    titulo: c('#noti-titulo').textAlign,
    cuerpo: c('#noti-cuerpo p').textAlign,
    cabecera: c('.notificacion__cabecera').justifyContent,
  };
});
comprobar('el título va centrado', centrado.titulo === 'center', centrado.titulo);
comprobar('el cuerpo va centrado', centrado.cuerpo === 'center', centrado.cuerpo);
comprobar('la cabecera va centrada', centrado.cabecera === 'center', centrado.cabecera);

// El rojo de la penalización es rojo de verdad, no el salmón de antes
const rojo = await page.evaluate(() => {
  const leer = (sel, prop) => getComputedStyle(document.querySelector(sel))[prop]
    .match(/\d+/g).slice(0, 3).map(Number);
  return { marco: leer('.notificacion__panel', 'borderTopColor'), titulo: leer('#noti-titulo', 'color') };
});
const vivo = ([r, g, b]) => r > 200 && r - g > 120 && r - b > 100;
comprobar('el marco de la penalización es rojo vivo', vivo(rojo.marco), rojo.marco.join(','));
comprobar('el título de la penalización es rojo', vivo(rojo.titulo), rojo.titulo.join(','));

// El panel sigue siendo la ventana azul del Sistema: en el anime lo rojo es el
// marco y el texto, no el fondo. Se compara con el panel sin penalización.
const fondos = await page.evaluate(() => {
  const panel = document.querySelector('.notificacion__panel');
  const noti = document.querySelector('#notificacion');
  const conPeligro = getComputedStyle(panel).backgroundImage;
  noti.classList.remove('notificacion--peligro');
  const normal = getComputedStyle(panel).backgroundImage;
  noti.classList.add('notificacion--peligro');
  return { conPeligro, normal };
});
comprobar('el fondo del panel no se tiñe de rojo', fondos.conPeligro === fondos.normal);

// Con el texto centrado, la ventana no puede cambiar de tamaño mientras escribe
const altoAlEmpezar = sitio.alto;
await page.waitForTimeout(900);
const altoAMedias = await page.evaluate(() =>
  Math.round(document.querySelector('#noti-ventana').getBoundingClientRect().height));
await aceptar();
comprobar('la ventana no da saltos mientras se escribe', altoAlEmpezar === altoAMedias,
  `${altoAlEmpezar}px → ${altoAMedias}px`);

/* ---------------- 20. dos carriles, cupos semanales y umbral ---------------- */

await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForSelector('.mision');
await aceptar();

// El umbral: cuatro de cinco diarias bastan para aprobar el día.
const cincoDiarias = await page.locator('#lista-misiones .mision').all();
for (const tarjeta of cincoDiarias.slice(0, 4)) {
  const campo = tarjeta.locator('input[data-accion="fijar"]');
  if (await campo.count()) { await campo.fill('99999'); await campo.dispatchEvent('change'); }
  else await tarjeta.locator('[data-accion="alternar"]').click();
}
comprobar('cuatro de cinco son el 80 %',
  await page.locator('#dia-porcentaje').textContent() === '80%');
comprobar('con el 80 % ya se puede reclamar',
  !(await page.locator('#btn-completar').isDisabled()));

// Los cupos de la semana pagan al cerrarse, sin esperar al día
const antesCupo = await leerEstado();
await page.locator('#lista-semanales .mision', { hasText: 'Ciclismo' })
  .locator('[data-accion="mas"]').click();
await page.waitForTimeout(120);
comprobar('cerrar un cupo semanal avisa', await titulo() === 'CUPO DE LA SEMANA CERRADO');
await aceptar();
const trasCupo = await leerEstado();
comprobar('y paga en el momento', trasCupo.jugador.oro > antesCupo.jugador.oro);

// Medianoche: lo diario vuelve a cero, el cupo semanal aguanta
await escribirEstado({ dia: { ...trasCupo.dia, fecha: '2000-01-01' } });
await page.reload();
await page.waitForSelector('.mision');
await aceptar();
const traNoche = await leerEstado();
comprobar('lo diario se reinicia cada noche',
  traNoche.misiones.filter((m) => m.periodo === 'dia').every((m) => m.progreso === 0));
comprobar('el cupo semanal aguanta la medianoche',
  traNoche.misiones.find((m) => m.nombre === 'Ciclismo').progreso === 1);

/* Tres de cinco personales (60 %): por debajo del umbral pero por encima del
   50 %. Lo profesional se deja cumplido para que el único carril en juego sea
   el personal. */
const sinCastigo = { activo: false, aceptado: false, origen: null, area: null, desde: null, rachaPerdida: 0, mision: null };
const diaDe = (fecha) => ({
  fecha, semana: '2000-01-03',
  completado: { personal: false, profesional: false },
  xpGanada: { personal: 0, profesional: 0 },
  avisado: true,
});
const cumplidas = (m) => ({ ...m, progreso: m.objetivo });
const aCero = (m) => ({ ...m, progreso: 0 });
const personalesDelDia = traNoche.misiones
  .filter((m) => m.area === 'personal' && m.periodo === 'dia')
  .map((m) => m.nombre);
const tresPrimeras = personalesDelDia.slice(0, 3);

await escribirEstado({
  castigo: sinCastigo,
  jugador: { ...traNoche.jugador, rachas: { personal: 4, profesional: 3 } },
  misiones: traNoche.misiones.map((m) => (
    m.area === 'profesional' || tresPrimeras.includes(m.nombre) ? cumplidas(m) : aCero(m)
  )),
  dia: diaDe('2000-01-02'),
});
await page.reload();
await page.waitForSelector('.mision');
const aMedias = await leerEstado();
comprobar('el 60 % rompe la racha del carril', aMedias.jugador.rachas.personal === 0);
comprobar('pero no cae castigo por un día a medias', aMedias.castigo.activo === false);
// La racha sube al reclamar, no al cruzar el umbral: aquí lo que importa es
// que el carril que llegó al umbral no pierda la suya.
comprobar('y el carril que sí cumplió conserva la suya',
  aMedias.jugador.rachas.profesional === 3);
await aceptar();

// Un día personal vacío sí: castigo, y del carril que falló
await escribirEstado({
  castigo: sinCastigo,
  misiones: aMedias.misiones.map((m) => (m.area === 'profesional' ? cumplidas(m) : aCero(m))),
  dia: diaDe('2000-01-04'),
});
await page.reload();
await page.waitForSelector('.mision');
const vacio = await leerEstado();
comprobar('un día vacío sí trae castigo', vacio.castigo.activo === true);
comprobar('el castigo es del carril personal', vacio.castigo.area === 'personal');
comprobar('la penitencia es lo que se falló, a 1,5×',
  vacio.castigo.mision.nombre === 'Penitencia: Pasos' && vacio.castigo.mision.objetivo === 12000,
  `(${vacio.castigo.mision.nombre} ${vacio.castigo.mision.objetivo})`);
await aceptar();

/* ------------------ 21. un guardado antiguo sigue abriendo ------------------ */

await page.evaluate(() => {
  localStorage.setItem('sistema:v1', JSON.stringify({
    version: 1,
    jugador: { nombre: 'Viejo', nivel: 4, xp: 50, racha: 6, mejorRacha: 8, diasCompletados: 3 },
    misiones: [{ id: 'm1', nombre: 'Flexiones', tipo: 'contador', objetivo: 100, unidad: 'reps', paso: 10, progreso: 30, xp: 40, stat: 'fuerza' }],
    dia: { fecha: '2000-01-01', completado: false, xpGanada: 0, avisado: true },
  }));
});
await page.reload();
await page.waitForSelector('.mision');
await aceptar();
const antiguo = await leerEstado();
comprobar('el guardado antiguo conserva el nivel', antiguo.jugador.nivel === 4);
comprobar('su racha pasa a ser la personal', antiguo.jugador.mejoresRachas.personal === 8);
comprobar('sus misiones pasan a ser personales y diarias',
  antiguo.misiones.every((m) => m.area === 'personal' && m.periodo === 'dia'));
comprobar('y se siguen viendo', await mision('Flexiones').count() === 1);


console.log(ok.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
if (errores.length) console.log('\nERRORES DE PÁGINA:\n' + errores.join('\n'));
console.log(`\n${ok.length} correctas, ${fallos.length} fallidas, ${errores.length} errores de página`);
await navegador.close();
process.exit(fallos.length || errores.length ? 1 : 0);
