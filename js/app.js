/* ==========================================================================
   Raíz de composición: carga el progreso, cablea los eventos de cada
   feature y vuelve a pintar. No contiene reglas del juego ni pintado
   propio; solo conecta lo que ya define cada feature.
   ========================================================================== */

import { cargar, guardar, borrar, estadoInicial, exportar, importar } from './progreso.js';
import { fechaHoy } from './nucleo/fecha.js';
import { notificar, sonar, configurarAnimaciones } from './notificaciones/notificaciones.js';
import { despertarSonido } from './sonido/sintetizador.js';

import {
  STATS, xpNecesaria, asignarPunto, sumarFatiga, FATIGA_MISION,
} from './jugador/reglas.js';
import { elJugador, renderVentanaEstado, renderStats } from './jugador/vista.js';

import {
  ajustarProgreso, fijarProgreso, guardarMision, eliminarMision, misionCompleta,
} from './misiones/reglas.js';
import {
  elMisiones, renderMisiones, abrirDialogoMision, cerrarDialogoMision, leerFormularioMision,
} from './misiones/vista.js';

import { sincronizarDia, completarDia, recompensaDia } from './ciclo-diario/reglas.js';
import { elCicloDiario, renderReloj, renderAvisoDiario } from './ciclo-diario/vista.js';

import {
  aceptarCastigo, ajustarProgresoCastigo, fijarProgresoCastigo, cumplirCastigo,
} from './castigo/reglas.js';
import { elCastigo, renderCastigo } from './castigo/vista.js';

import { misionesDePlantilla } from './misiones/reglas.js';
import { buscarPlantilla } from './plantillas/catalogo.js';
import { elPlantillas, renderPlantillas } from './plantillas/vista.js';

import { ajustarProgresoPuerta, fijarProgresoPuerta, cerrarPuerta } from './puertas/reglas.js';
import { elPuertas, renderPuerta } from './puertas/vista.js';

import { revisarSemana, golpear, danoPorMision } from './jefes/reglas.js';
import { renderJefe } from './jefes/vista.js';

import { revisarTitulos, equiparTitulo } from './titulos/reglas.js';
import { elTitulos, renderTitulos } from './titulos/vista.js';

import { elegirClase, puedeCambiarClase, NIVEL_CAMBIO_CLASE } from './clases/reglas.js';
import {
  elClases, renderClase, renderDialogoClases, abrirDialogoClase, cerrarDialogoClase,
} from './clases/vista.js';

import { comprar, usar, buscarObjeto } from './tienda/reglas.js';
import { elTienda, renderTienda } from './tienda/vista.js';

import { renderHistorial } from './historial/vista.js';
import { elAjustes, renderAjustes } from './ajustes/vista.js';

let estado = cargar();

function render() {
  renderVentanaEstado(estado.jugador);
  renderStats(estado.jugador);
  renderMisiones(estado.misiones);
  renderAvisoDiario(estado);
  renderCastigo(estado.castigo);
  renderPuerta(estado.puerta);
  renderJefe(estado.jefe, estado.castigo.activo);
  renderTitulos(estado.jugador);
  renderClase(estado.jugador);
  renderTienda(estado);
  renderHistorial(estado);
  renderAjustes(estado.ajustes);
}

function actualizar() {
  guardar(estado);
  render();
}

function pitido(tipo) {
  sonar(tipo, estado.ajustes.sonido);
}

/* ------------------------- avisos compartidos ------------------------- */

function avisarTitulos(titulos) {
  for (const titulo of titulos) {
    notificar({
      titulo: 'TÍTULO DESBLOQUEADO',
      lineas: [
        { texto: titulo.nombre, destacado: true },
        { texto: titulo.descripcion },
        { texto: titulo.bono > 0 ? `Otorga +${titulo.bono} % de experiencia al equiparlo.` : 'Puro honor.' },
        { texto: 'Equípalo desde la pestaña ESTADO.' },
      ],
    });
  }
  if (titulos.length) pitido('logro');
}

function avisarNivel(resultado) {
  if (resultado.niveles <= 0) return;
  notificar({
    titulo: '¡HAS SUBIDO DE NIVEL!',
    lineas: [
      { texto: `Nivel ${resultado.nivelPrevio} → ${resultado.nivel}`, destacado: true },
      { texto: `+${resultado.niveles * 3} puntos de estadística disponibles.` },
      { texto: `Siguiente nivel: ${xpNecesaria(resultado.nivel)} XP.` },
    ],
    boton: 'REPARTIR PUNTOS',
  });
  pitido('nivel');

  if (puedeCambiarClase(estado.jugador)) {
    notificar({
      titulo: 'MISIÓN DE CAMBIO DE CLASE',
      lineas: [
        { texto: `Has alcanzado el nivel ${NIVEL_CAMBIO_CLASE}.` },
        { texto: 'El Sistema te ofrece especializarte.', destacado: true },
        { texto: 'Elige tu clase en la pestaña ESTADO.' },
      ],
      boton: 'ENTENDIDO',
    });
  }
}

function avisarJefeCaido(caido) {
  if (!caido) return;
  notificar({
    titulo: 'JEFE DERROTADO',
    lineas: [
      { texto: `${caido.nombre} (rango ${caido.rango}) ha caído.`, destacado: true },
      { texto: `+${caido.xp} XP · +${caido.oro} oro` },
      { texto: 'El lunes aparecerá otro.' },
    ],
    boton: 'RECIBIR',
  });
  pitido('jefe');
  avisarNivel(caido);
  avisarTitulos(caido.titulosNuevos);
}

function avisarCastigo(castigo) {
  if (!castigo) return;
  notificar({
    titulo: 'CASTIGO ASIGNADO',
    lineas: [
      { texto: castigo.mision.nombre, destacado: true },
      { texto: `${castigo.mision.objetivo} ${castigo.mision.unidad} para saldar la deuda.` },
      { texto: 'Acéptalo en la pestaña MISIÓN. Hasta cumplirlo no empieza una semana nueva.' },
    ],
    tipo: 'peligro',
    boton: 'VER EL CASTIGO',
  });
  pitido('error');
}

function avisarSemana(cambio) {
  if (!cambio) return;
  if (cambio.huido) {
    notificar({
      titulo: 'EL JEFE HA ESCAPADO',
      lineas: [
        { texto: `${cambio.huido.nombre} sobrevivió a la semana.` },
        { texto: 'Su recompensa se pierde. Nada más: el castigo ya lo llevan los días fallados.' },
      ],
      tipo: 'peligro',
      boton: 'ENTENDIDO',
    });
    pitido('error');
  }
  if (cambio.bloqueado) {
    notificar({
      titulo: 'SEMANA BLOQUEADA',
      lineas: [
        { texto: 'No habrá jefe hasta que saldes tu deuda.', destacado: true },
        { texto: 'Cumple la misión de castigo y el Sistema abrirá la semana.' },
      ],
      tipo: 'peligro',
      boton: 'ENTENDIDO',
    });
    pitido('error');
    return;
  }

  notificar({
    titulo: 'HA APARECIDO UN JEFE',
    lineas: [
      { texto: `${cambio.nuevo.nombre} — rango ${cambio.nuevo.rango}`, destacado: true },
      { texto: `${cambio.nuevo.vidaMaxima} puntos de vida. Tienes hasta el domingo.` },
      { texto: 'Cada objetivo que completes le hace daño; las puertas pegan el triple.' },
    ],
    boton: 'A POR ÉL',
  });
  pitido('puerta');
}

function avisarPuerta(puerta) {
  notificar({
    titulo: 'SE HA ABIERTO UNA PUERTA',
    lineas: [
      { texto: `Puerta de rango ${puerta.rango}`, destacado: true },
      { texto: `Desafío: ${puerta.nombre} — ${puerta.objetivo} ${puerta.unidad}.` },
      { texto: `Recompensa: ${puerta.xp} XP y ${puerta.oro} de oro.` },
      { texto: 'Es opcional y se cierra sola a medianoche.' },
    ],
    boton: 'VER LA PUERTA',
  });
  pitido('puerta');
}

function avisarMisionDiaria() {
  if (estado.dia.avisado || estado.dia.completado) return;
  estado.dia.avisado = true;
  const { total, oro } = recompensaDia(estado);
  notificar({
    titulo: 'HA LLEGADO LA MISIÓN DIARIA',
    lineas: [
      { texto: 'Preparación para convertirse en un guerrero.' },
      { texto: `${estado.misiones.length} objetivos pendientes para hoy.` },
      { texto: `Recompensa: ${total} XP · ${oro} oro · 1 punto`, destacado: true },
      { texto: 'Fallar la misión conlleva penalización.' },
    ],
    boton: 'EMPEZAR',
  });
  pitido('aviso');
}

/* ---------------------------- ciclo del día ---------------------------- */

function comprobarDia() {
  const resumen = sincronizarDia(estado);
  if (!resumen) return null;

  if (!resumen.completado) {
    const lineas = [
      { texto: `Has fallado la misión del ${resumen.fecha} (${resumen.porcentaje} % completado).` },
    ];
    if (resumen.perdida > 0) lineas.push({ texto: `−${resumen.perdida} XP`, destacado: true });
    if (resumen.vidaPerdida > 0) lineas.push({ texto: `−${resumen.vidaPerdida} HP` });
    if (resumen.rachaPerdida > 0) lineas.push({ texto: `Racha rota: ${resumen.rachaPerdida} días perdidos.` });
    lineas.push({ texto: 'Ganarás la mitad de experiencia hasta que completes un día entero.' });

    notificar({ titulo: 'ZONA DE PENALIZACIÓN', lineas, tipo: 'peligro', boton: 'ACEPTO EL CASTIGO' });
    pitido('error');
  }

  return resumen;
}

/** Avisos que van detrás de la misión diaria: primero lo de hoy, luego lo demás. */
function avisarNovedades(resumen) {
  if (resumen?.puerta) avisarPuerta(resumen.puerta);
  avisarCastigo(resumen?.castigo);
  avisarSemana(resumen?.jefe ?? revisarSemana(estado));
}

/* ------------------------------ pestañas ------------------------------ */

document.querySelectorAll('.pestana').forEach((boton) => {
  boton.addEventListener('click', () => {
    document.querySelectorAll('.pestana').forEach((otro) => {
      const activo = otro === boton;
      otro.setAttribute('aria-selected', String(activo));
      document.querySelector(`#tab-${otro.dataset.tab}`).hidden = !activo;
    });
  });
});

/* ------------------------------ misiones ------------------------------ */

/**
 * Completar un objetivo cansa y golpea al jefe de la semana; deshacerlo
 * devuelve la fatiga y le cura el daño.
 */
function resolverObjetivo(id, accion) {
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return;

  const antes = misionCompleta(mision);
  accion();
  const ahora = misionCompleta(mision);
  if (ahora === antes) return;

  const signo = ahora ? 1 : -1;
  sumarFatiga(estado.jugador, FATIGA_MISION * signo);
  if (ahora) pitido('objetivo');
  avisarJefeCaido(golpear(estado, danoPorMision(estado.jugador, mision) * signo));
}

elMisiones.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const id = boton.closest('[data-id]')?.dataset.id;
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return;

  switch (boton.dataset.accion) {
    case 'mas':
      pitido('toque');
      resolverObjetivo(id, () => ajustarProgreso(estado.misiones, id, mision.paso));
      break;
    case 'menos':
      pitido('toque');
      resolverObjetivo(id, () => ajustarProgreso(estado.misiones, id, -mision.paso));
      break;
    case 'alternar':
      resolverObjetivo(id, () => fijarProgreso(estado.misiones, id, mision.progreso >= 1 ? 0 : 1));
      break;
    case 'editar':
      abrirDialogoMision(mision);
      return;
    case 'borrar':
      if (!confirm(`¿Eliminar la misión "${mision.nombre}"?`)) return;
      eliminarMision(estado.misiones, id);
      pitido('guardar');
      break;
    default:
      return;
  }
  actualizar();
});

elMisiones.lista.addEventListener('change', (evento) => {
  const campo = evento.target.closest('input[data-accion="fijar"]');
  if (!campo) return;
  const id = campo.closest('[data-id]')?.dataset.id;
  resolverObjetivo(id, () => fijarProgreso(estado.misiones, id, Number(campo.value)));
  actualizar();
});

elMisiones.btnNueva.addEventListener('click', () => abrirDialogoMision());
elMisiones.btnCancelar.addEventListener('click', cerrarDialogoMision);

elMisiones.formMision.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const datos = leerFormularioMision();
  if (!datos.nombre) return;
  guardarMision(estado.misiones, datos);
  cerrarDialogoMision();
  pitido('guardar');
  actualizar();
});

/* ---------------------------- recompensa del día ---------------------------- */

elCicloDiario.btnCompletar.addEventListener('click', () => {
  const resultado = completarDia(estado);
  if (!resultado) return;

  const lineas = [
    { texto: `+${resultado.base} XP por los objetivos.` },
    { texto: `+${resultado.bono} XP de bonificación.` },
    { texto: `Total: ${resultado.total} XP · ${resultado.oro} oro`, destacado: true },
    { texto: `Racha: ${resultado.racha} ${resultado.racha === 1 ? 'día' : 'días'} · +1 punto de estadística.` },
  ];
  if (resultado.dobleUsado) lineas.push({ texto: 'Piedra de doble experiencia consumida.' });
  if (estado.castigo.activo) {
    lineas.push({ texto: 'Sigues en penalización: cumple el castigo para recuperar la experiencia entera.' });
  }

  notificar({ titulo: 'MISIÓN DIARIA COMPLETADA', lineas, boton: 'RECIBIR' });
  pitido('logro');

  avisarNivel(resultado);
  avisarTitulos(resultado.titulosNuevos);
  actualizar();
});

/* ------------------------------- puertas ------------------------------- */

elPuertas.contenedor.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton || !estado.puerta) return;

  if (boton.dataset.accion === 'cerrar-puerta') {
    const resultado = cerrarPuerta(estado);
    if (!resultado) return;
    notificar({
      titulo: 'PUERTA DESPEJADA',
      lineas: [
        { texto: `Puerta de rango ${resultado.rango} cerrada.` },
        { texto: `+${resultado.xp} XP · +${resultado.oro} oro`, destacado: true },
      ],
      boton: 'RECIBIR',
    });
    pitido('oro');
    avisarNivel(resultado);
    avisarTitulos(resultado.titulosNuevos);
    avisarJefeCaido(resultado.jefeCaido);
  } else if (boton.dataset.accion === 'puerta-mas') {
    pitido('toque');
    ajustarProgresoPuerta(estado.puerta, estado.puerta.paso);
  } else if (boton.dataset.accion === 'puerta-menos') {
    pitido('toque');
    ajustarProgresoPuerta(estado.puerta, -estado.puerta.paso);
  } else {
    return;
  }
  actualizar();
});

elPuertas.contenedor.addEventListener('change', (evento) => {
  const campo = evento.target.closest('input[data-accion="puerta-fijar"]');
  if (!campo) return;
  fijarProgresoPuerta(estado.puerta, Number(campo.value));
  actualizar();
});

/* --------------------------- misión de castigo --------------------------- */

elCastigo.contenedor.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  switch (boton.dataset.accion) {
    case 'aceptar-castigo':
      if (!aceptarCastigo(estado)) return;
      notificar({
        titulo: 'CASTIGO ACEPTADO',
        lineas: [
          { texto: estado.castigo.mision.nombre, destacado: true },
          { texto: 'Cúmplelo y el Sistema volverá a abrir la semana.' },
        ],
        tipo: 'peligro',
        boton: 'A CUMPLIRLO',
      });
      pitido('error');
      break;
    case 'castigo-mas':
      pitido('toque');
      ajustarProgresoCastigo(estado, estado.castigo.mision.paso);
      break;
    case 'castigo-menos':
      pitido('toque');
      ajustarProgresoCastigo(estado, -estado.castigo.mision.paso);
      break;
    case 'cumplir-castigo': {
      const saldado = cumplirCastigo(estado);
      if (!saldado) return;
      notificar({
        titulo: 'DEUDA SALDADA',
        lineas: [
          { texto: 'Has cumplido el castigo.', destacado: true },
          { texto: 'Vuelves a ganar toda la experiencia.' },
        ],
        boton: 'SEGUIR',
      });
      pitido('logro');
      avisarTitulos(revisarTitulos(estado));
      avisarSemana(revisarSemana(estado));
      break;
    }
    default:
      return;
  }
  actualizar();
});

elCastigo.contenedor.addEventListener('change', (evento) => {
  const campo = evento.target.closest('input[data-accion="castigo-fijar"]');
  if (!campo) return;
  fijarProgresoCastigo(estado, Number(campo.value));
  actualizar();
});

/* ------------------------------ plantillas ------------------------------ */

renderPlantillas();

elPlantillas.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-plantilla]');
  if (!boton) return;
  const plantilla = buscarPlantilla(boton.dataset.plantilla);
  if (!confirm(`Se sustituirán tus misiones diarias por "${plantilla.nombre}". ¿Continuar?`)) return;

  estado.misiones = misionesDePlantilla(plantilla.id);
  estado.dia.completado = false;
  notificar({
    titulo: 'MISIÓN DIARIA ACTUALIZADA',
    lineas: [
      { texto: plantilla.nombre, destacado: true },
      { texto: `${plantilla.misiones.length} objetivos nuevos para cada día.` },
    ],
  });
  pitido('guardar');
  actualizar();
});

/* --------------------------- estadísticas y títulos --------------------------- */

elJugador.stats.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-stat]');
  if (!boton) return;
  if (asignarPunto(estado.jugador, boton.dataset.stat)) {
    pitido('punto');
    actualizar();
  }
});

elTitulos.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-titulo]');
  if (!boton || boton.disabled) return;
  if (equiparTitulo(estado.jugador, boton.dataset.titulo)) {
    pitido('guardar');
    actualizar();
  }
});

/* -------------------------------- clase -------------------------------- */

renderDialogoClases();

elClases.bloque.addEventListener('click', (evento) => {
  if (evento.target.closest('#btn-clase')) abrirDialogoClase();
});

elClases.btnCancelar.addEventListener('click', cerrarDialogoClase);

elClases.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-clase]');
  if (!boton) return;
  const clase = elegirClase(estado.jugador, boton.dataset.clase);
  cerrarDialogoClase();
  if (!clase) return;

  notificar({
    titulo: 'CLASE ADQUIRIDA',
    lineas: [
      { texto: clase.nombre, destacado: true },
      { texto: clase.descripcion },
      { texto: '+3 puntos repartidos en tu estadística principal.' },
    ],
  });
  pitido('nivel');
  actualizar();
});

/* -------------------------------- tienda -------------------------------- */

elTienda.catalogo.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-comprar]');
  if (!boton) return;
  const objeto = comprar(estado, boton.dataset.comprar);
  if (!objeto) return;

  notificar({
    titulo: 'COMPRA REALIZADA',
    lineas: [
      { texto: `${objeto.icono} ${objeto.nombre}`, destacado: true },
      { texto: `−${objeto.precio} de oro. Está en tu inventario.` },
    ],
  });
  pitido('oro');
  actualizar();
});

elTienda.inventario.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-usar]');
  if (!boton) return;
  const resultado = usar(estado, boton.dataset.usar);

  if (!resultado) {
    const objeto = buscarObjeto(boton.dataset.usar);
    notificar({
      titulo: 'NO SE PUEDE USAR AHORA',
      lineas: [{ texto: `${objeto?.nombre ?? 'El objeto'} no tiene ningún efecto en este momento.` }],
      tipo: 'peligro',
      boton: 'ENTENDIDO',
    });
    pitido('error');
    return;
  }

  notificar({
    titulo: 'OBJETO USADO',
    lineas: [
      { texto: `${resultado.objeto.icono} ${resultado.objeto.nombre}`, destacado: true },
      { texto: resultado.mensaje },
    ],
  });
  pitido('guardar');
  avisarTitulos(revisarTitulos(estado));
  actualizar();
});

/* ------------------------------- ajustes ------------------------------- */

elJugador.btnNombre.addEventListener('click', () => {
  const nombre = prompt('Nombre del jugador:', estado.jugador.nombre);
  if (nombre === null) return;
  estado.jugador.nombre = nombre.trim().slice(0, 24) || 'Jugador';
  pitido('guardar');
  actualizar();
});

elAjustes.sonido.addEventListener('change', () => {
  estado.ajustes.sonido = elAjustes.sonido.checked;
  guardar(estado);
  pitido('aviso');
});

elAjustes.animaciones.addEventListener('change', () => {
  estado.ajustes.animaciones = elAjustes.animaciones.checked;
  configurarAnimaciones(estado.ajustes.animaciones);
  guardar(estado);
});

elAjustes.btnExportar.addEventListener('click', () => {
  const blob = new Blob([exportar(estado)], { type: 'application/json' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `sistema-${fechaHoy()}.json`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
});

elAjustes.btnImportar.addEventListener('click', () => elAjustes.archivoImportar.click());

elAjustes.archivoImportar.addEventListener('change', async (evento) => {
  const archivo = evento.target.files?.[0];
  if (!archivo) return;
  try {
    estado = importar(await archivo.text());
    comprobarDia();
    revisarSemana(estado);
    configurarAnimaciones(estado.ajustes.animaciones);
    actualizar();
    notificar({ titulo: 'DATOS RESTAURADOS', lineas: [{ texto: 'Tu progreso ha vuelto al Sistema.' }] });
  } catch {
    notificar({
      titulo: 'ARCHIVO NO VÁLIDO',
      lineas: [{ texto: 'No se pudo leer esa copia de seguridad.' }],
      tipo: 'peligro',
    });
  }
  evento.target.value = '';
});

elAjustes.btnReiniciar.addEventListener('click', () => {
  if (!confirm('Se borrará todo tu progreso: nivel, estadísticas, racha, oro e historial. ¿Continuar?')) return;
  borrar();
  estado = estadoInicial();
  actualizar();
  notificar({
    titulo: 'SISTEMA REINICIADO',
    lineas: [{ texto: 'Todo vuelve al nivel 1. Empieza de cero, jugador.' }],
  });
});

/* ------------------------------ temporizadores ------------------------------ */

// El reloj también detecta el cambio de día si la app se queda abierta.
setInterval(() => {
  renderReloj();
  if (estado.dia.fecha === fechaHoy()) return;
  const resumen = comprobarDia();
  if (!resumen) return;
  avisarMisionDiaria();
  avisarNovedades(resumen);
  actualizar();
}, 30000);

// Al volver a la app tras dejarla en segundo plano, revisamos la fecha.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  renderReloj();
  const resumen = comprobarDia();
  if (resumen) {
    avisarMisionDiaria();
    avisarNovedades(resumen);
  }
  actualizar();
});

/* ------------------------------ arranque ------------------------------ */

// Los navegadores bloquean el audio hasta el primer toque del usuario.
document.addEventListener('pointerdown', despertarSonido, { once: true });
document.addEventListener('keydown', despertarSonido, { once: true });

configurarAnimaciones(estado.ajustes.animaciones);
const resumenInicial = comprobarDia();
avisarTitulos(revisarTitulos(estado));
avisarMisionDiaria();
avisarNovedades(resumenInicial);
renderReloj();
actualizar();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin caché offline */ });
  });
}
