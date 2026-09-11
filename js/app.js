/* ==========================================================================
   Raíz de composición: carga el progreso, cablea los eventos de cada
   feature y vuelve a pintar. No contiene reglas del juego ni pintado
   propio; solo conecta lo que ya define cada feature.
   ========================================================================== */

import { cargar, guardar, borrar, estadoInicial, exportar, importar } from './progreso.js';
import { fechaHoy } from './nucleo/fecha.js';
import { notificar, sonar, configurarAnimaciones, configurarAvisos } from './notificaciones/notificaciones.js';
import { despertarSonido } from './sonido/sintetizador.js';

import {
  STATS, xpNecesaria, asignarPunto, sumarFatiga, FATIGA_MISION,
} from './jugador/reglas.js';
import { elJugador, renderVentanaEstado, renderStats } from './jugador/vista.js';

import {
  ajustarProgreso, fijarProgreso, guardarMision, eliminarMision, misionCompleta,
} from './misiones/reglas.js';
import { otorgarXp } from './jugador/reglas.js';
import { AREAS, diarias, obligatorias, delArea } from './misiones/reglas.js';
import {
  elMisiones, renderMisiones, renderListaObjetivos,
  abrirDialogoMision, cerrarDialogoMision, leerFormularioMision,
} from './misiones/vista.js';

import {
  elConfiguracion, abrirConfiguracion, cerrarConfiguracion, configuracionAbierta,
} from './configuracion/vista.js';

import {
  sincronizarDia, completarDia, recompensaDia, recompensaSemanal, umbralDe,
} from './ciclo-diario/reglas.js';
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
import {
  crearIncursion, fijarFecha, golpearIncursion, revisarIncursion,
  xpDiariaProfesional,
} from './incursion/reglas.js';
import { elIncursion, renderIncursion } from './incursion/vista.js';
import { registrarPeso, ultimoPeso } from './medidas/reglas.js';
import { renderPeso } from './medidas/vista.js';

import { revisarTitulos, equiparTitulo } from './titulos/reglas.js';
import { elTitulos, renderTitulos } from './titulos/vista.js';

import { elegirClase, puedeCambiarClase, NIVEL_CAMBIO_CLASE } from './clases/reglas.js';
import {
  elClases, renderClase, renderDialogoClases, abrirDialogoClase, cerrarDialogoClase,
} from './clases/vista.js';

import { comprar, usar, buscarObjeto } from './tienda/reglas.js';
import { elTienda, renderTienda } from './tienda/vista.js';

import { renderCuadro } from './negocio/vista.js';
import { normalizarCuota } from './negocio/reglas.js';

import { renderHistorial } from './historial/vista.js';
import { elAjustes, renderAjustes } from './ajustes/vista.js';
import { sonidoActivo, textoAnimado } from './ajustes/reglas.js';

import { modoEfectivo, forzar, normalizarHorario } from './modo/reglas.js';
import { aplicarModo, elModo, t } from './modo/vista.js';

let estado = cargar();
let modo = modoEfectivo(estado.ajustes);

/* El interruptor de la cabecera no cambia solo las palabras: decide qué
   carril estás mirando. SALES es el oficio; el Sistema, cuerpo y cabeza. */
const carril = () => (modo === 'sales' ? 'profesional' : 'personal');

/** Deja el modo, el sonido y el tipo de aviso en su sitio. */
function sincronizarModo() {
  modo = modoEfectivo(estado.ajustes);
  aplicarModo(modo);
  configurarAnimaciones(textoAnimado(estado.ajustes, modo));
  configurarAvisos({ discreto: modo === 'sales' });
}

function render() {
  // El modo se fija antes de pintar: las vistas piden sus palabras al pintarse.
  sincronizarModo();
  const area = carril();
  renderVentanaEstado(estado.jugador, area);
  renderStats(estado.jugador);
  renderMisiones(estado.misiones, area);
  renderListaObjetivos(estado.misiones);
  renderAvisoDiario(estado, area);
  renderCastigo(estado.castigo);
  renderPuerta(estado.puerta);
  // El jefe y la puerta son del carril personal: en el profesional no pintan
  // nada hasta que llegue su propia incursión.
  document.querySelector('#retos-sistema').hidden = area !== 'personal';
  elIncursion.seccion.hidden = area !== 'profesional';
  renderJefe(estado.jefe, estado.castigo.activo);
  renderIncursion(estado.incursion);
  renderPeso(estado, estado.ajustes.verPeso);
  renderTitulos(estado.jugador);
  renderClase(estado.jugador);
  renderTienda(estado);
  renderCuadro(estado);
  renderHistorial(estado);
  renderAjustes(estado);
}

function actualizar() {
  guardar(estado);
  render();
}

function pitido(tipo) {
  sonar(tipo, sonidoActivo(estado.ajustes, modo));
}

/* ------------------------- avisos compartidos ------------------------- */

function avisarTitulos(titulos) {
  for (const titulo of titulos) {
    notificar({
      titulo: t('notiTitulo'),
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
    titulo: t('notiNivel'),
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
      titulo: t('dlgClase'),
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
    titulo: t('notiJefeCaido'),
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
    titulo: t('notiCastigoNuevo'),
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
      titulo: t('notiJefeHuido'),
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
      titulo: t('notiSemana'),
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
    titulo: t('notiJefeNuevo'),
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
    titulo: t('notiPuerta'),
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
  // completado es un objeto por carril: preguntar por él a secas sería
  // siempre cierto y el aviso no saldría nunca.
  const cerrado = AREAS.every((a) => estado.dia.completado[a]);
  if (estado.dia.avisado || cerrado) return;
  estado.dia.avisado = true;
  // Se anuncia el carril que se está mirando, no la suma de los dos: contar
  // trece objetivos cuando en pantalla hay cinco no ayuda a nadie.
  const area = carril();
  const { total, oro } = recompensaDia(estado, area);
  const pendientes = diarias(obligatorias(delArea(estado.misiones, area))).length;
  notificar({
    titulo: t('notiDiaria'),
    lineas: [
      { texto: t('subtitulo') },
      { texto: `${pendientes} objetivos para hoy en este carril.` },
      { texto: `Recompensa: ${total} ${t('xp')} · ${oro} ${t('oroMinuscula')} · 1 punto`, destacado: true },
      { texto: `El día cuenta a partir del ${Math.round(umbralDe(estado) * 100)} %.` },
    ],
    boton: 'EMPEZAR',
  });
  pitido('aviso');
}

/* ---------------------------- ciclo del día ---------------------------- */

const NOMBRE_CARRIL = { personal: 'EL SISTEMA', profesional: 'SALES' };

function comprobarDia() {
  const resumen = sincronizarDia(estado);
  if (!resumen) return null;

  // Un aviso por carril fallado: no es lo mismo dejar de entrenar que dejar
  // de escuchar a los clientes, y el balance de cada uno se lee aparte.
  for (const balance of resumen.balances) {
    if (balance.cumplido || !balance.rachaPerdida && !balance.perdida && !balance.castigo) continue;

    const lineas = [
      { texto: `${NOMBRE_CARRIL[balance.area]} — ${resumen.fecha}: ${balance.porcentaje} % cumplido.` },
    ];
    if (balance.perdida > 0) lineas.push({ texto: `−${balance.perdida} XP`, destacado: true });
    if (balance.vidaPerdida > 0) lineas.push({ texto: `−${balance.vidaPerdida} HP` });
    if (balance.rachaPerdida > 0) {
      lineas.push({ texto: `Racha rota: ${balance.rachaPerdida} días perdidos.` });
    }
    lineas.push({
      texto: balance.castigo
        ? 'Ganarás la mitad de experiencia hasta que saldes el castigo.'
        : 'Sin castigo: no llegaste, pero tampoco te quedaste parado.',
    });

    notificar({
      titulo: t('notiCastigo'),
      lineas,
      tipo: 'peligro',
      boton: balance.castigo ? 'ACEPTO EL CASTIGO' : 'ENTENDIDO',
    });
    pitido('error');
  }

  return resumen;
}

/** Avisos que van detrás de la misión diaria: primero lo de hoy, luego lo demás. */
function avisarObjetivos(cambios) {
  if (!cambios?.length) return;
  notificar({
    titulo: t('notiObjetivos'),
    lineas: cambios.slice(0, 5).map((c) => ({
      texto: `${c.nombre}: ${c.antes} → ${c.ahora} ${c.unidad}`.trim(),
      destacado: c.sentido === 'sube',
    })),
    boton: 'ENTENDIDO',
  });
  pitido('nivel');
}

function avisarNovedades(resumen) {
  avisarObjetivos(resumen?.objetivos);
  avisarPlazo(revisarIncursion(estado));
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
  // Solo lo personal le pega al jefe de la semana; lo profesional tiene lo suyo.
  if (mision.area === 'personal') {
    avisarJefeCaido(golpear(estado, danoPorMision(estado.jugador, mision) * signo));
  }

  // Los cupos de la semana no esperan al cierre del día: se cobran al
  // cerrarlos, que es cuando de verdad has hecho el esfuerzo.
  if (mision.periodo === 'semana' && ahora) cobrarCupoSemanal(mision);
}

function cobrarCupoSemanal(mision) {
  const { xp, oro } = recompensaSemanal(estado, mision);
  const nivelPrevio = estado.jugador.nivel;
  const niveles = otorgarXp(estado.jugador, xp);
  estado.jugador.oro += oro;

  notificar({
    titulo: t('notiCupo'),
    lineas: [
      { texto: mision.nombre, destacado: true },
      { texto: `Cupo de la semana cerrado. +${xp} ${t('xp')} · +${oro} ${t('oroMinuscula')}` },
    ],
    boton: 'RECIBIR',
  });
  pitido('logro');
  avisarNivel({ niveles, nivelPrevio, nivel: estado.jugador.nivel });
  if (mision.area === 'profesional') avisarIncursion(golpearIncursion(estado, mision.xp));
}

function avisarIncursion(caida) {
  if (!caida) return;
  notificar({
    titulo: t('notiIncursion'),
    lineas: [
      { texto: caida.nombre, destacado: true },
      { texto: `Llegas listo con ${caida.dias} ${caida.dias === 1 ? 'día' : 'días'} de margen.` },
      { texto: 'La fecha sigue siendo la que es; el que ya no es el mismo eres tú.' },
    ],
    boton: 'RECIBIR',
  });
  pitido('jefe');
}

function avisarPlazo(balance) {
  if (!balance) return;
  notificar({
    titulo: t('notiPlazo'),
    lineas: [
      { texto: `${balance.nombre} — ${balance.fecha}`, destacado: true },
      { texto: `Llegaste al ${balance.porcentaje} % de la preparación.` },
      { texto: 'Sin castigo: esta fecha no la decide el Sistema.' },
    ],
    boton: 'ENTENDIDO',
  });
  pitido('aviso');
}

/* Los cupos de la semana se pintan en su propia lista, así que los mismos
   controles tienen que escucharse en las dos. */
const listasDeMisiones = [elMisiones.lista, elMisiones.semanales];

/**
 * Hay misiones que además de marcarse piden un dato. El pesaje pide el peso:
 * se guarda, pero no se enseña — en la ficha solo sale la tendencia.
 * Devuelve false si se canceló, para no marcar la misión.
 */
function pedirMedida(mision) {
  if (mision.medida !== 'peso') return true;

  const previo = ultimoPeso(estado.medidas);
  const puesto = prompt('Peso de hoy en kilos:', previo ? String(previo.kg) : '');
  if (puesto === null) return false;

  const kg = Number(String(puesto).replace(',', '.'));
  if (!registrarPeso(estado, kg)) {
    notificar({
      titulo: 'PESO NO VÁLIDO',
      lineas: [{ texto: 'Escribe el peso en kilos, por ejemplo 98.4.' }],
      tipo: 'peligro',
    });
    return false;
  }
  return true;
}

const alPulsarMision = (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const id = boton.closest('[data-id]')?.dataset.id;
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return;

  switch (boton.dataset.accion) {
    case 'mas':
      if (!pedirMedida(mision)) return;
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
    default:
      return;
  }
  actualizar();
};

const alCambiarMision = (evento) => {
  const campo = evento.target.closest('input[data-accion="fijar"]');
  if (!campo) return;
  const id = campo.closest('[data-id]')?.dataset.id;
  resolverObjetivo(id, () => fijarProgreso(estado.misiones, id, Number(campo.value)));
  actualizar();
};

for (const lista of listasDeMisiones) {
  lista.addEventListener('click', alPulsarMision);
  lista.addEventListener('change', alCambiarMision);
}

// Un toque para saltar al otro carril sin pasar por el interruptor.
elMisiones.otroCarril.addEventListener('click', () => {
  elModo.boton.click();
});

/* ---------------------------- configuración ---------------------------- */

elConfiguracion.abrir.addEventListener('click', () => {
  abrirConfiguracion();
  pitido('guardar');
});
elConfiguracion.cerrar.addEventListener('click', cerrarConfiguracion);

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && configuracionAbierta()) cerrarConfiguracion();
});

// Crear, editar y borrar objetivos vive aquí, no en la pantalla del día.
elConfiguracion.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;
  const id = boton.closest('[data-id]')?.dataset.id;
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return;

  if (boton.dataset.accion === 'editar') {
    abrirDialogoMision(mision);
    return;
  }
  if (boton.dataset.accion === 'borrar') {
    if (!confirm(`¿Eliminar "${mision.nombre}"?`)) return;
    eliminarMision(estado.misiones, id);
    pitido('guardar');
    actualizar();
  }
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
  const resultado = completarDia(estado, carril());
  if (!resultado) return;

  // Un día profesional cerrado avanza la preparación del ascenso. Se usa la
  // experiencia limpia, sin bonificaciones: así cumplir cada día de aquí a la
  // fecha deja la incursión justo en cero.
  if (resultado.area === 'profesional') {
    avisarIncursion(golpearIncursion(estado, xpDiariaProfesional(estado.misiones)));
  }

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

  notificar({ titulo: t('reclamado'), lineas, boton: 'RECIBIR' });
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
      titulo: t('notiPuertaHecha'),
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
        titulo: t('notiCastigoOk'),
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
        titulo: t('notiDeuda'),
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
  estado.dia.completado = { personal: false, profesional: false };
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
    titulo: t('notiClase'),
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
    titulo: t('notiCompra'),
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
    titulo: t('notiObjeto'),
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
  configurarAnimaciones(textoAnimado(estado.ajustes, modo));
  guardar(estado);
});

elModo.boton.addEventListener('click', () => {
  const otro = modo === 'sales' ? 'sistema' : 'sales';
  estado.ajustes.modo = otro;
  estado.ajustes.forzado = forzar(estado.ajustes, otro);
  actualizar();
  pitido('guardar');
});

elAjustes.horario.addEventListener('change', () => {
  estado.ajustes.horario = normalizarHorario({
    ...estado.ajustes.horario,
    activo: elAjustes.horario.checked,
  });
  estado.ajustes.forzado = null; // al cambiar la regla, manda el horario
  actualizar();
  pitido('guardar');
});

for (const campo of [elAjustes.desde, elAjustes.hasta]) {
  campo.addEventListener('change', () => {
    estado.ajustes.horario = normalizarHorario({
      ...estado.ajustes.horario,
      desde: elAjustes.desde.value,
      hasta: elAjustes.hasta.value,
    });
    estado.ajustes.forzado = null;
    actualizar();
  });
}

elAjustes.dias.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-dia]');
  if (!boton) return;
  const dia = Number(boton.dataset.dia);
  const dias = estado.ajustes.horario.dias.includes(dia)
    ? estado.ajustes.horario.dias.filter((d) => d !== dia)
    : [...estado.ajustes.horario.dias, dia];
  estado.ajustes.horario = normalizarHorario({ ...estado.ajustes.horario, dias });
  estado.ajustes.forzado = null;
  actualizar();
});

/* La cuota se guarda mientras se escribe: no hay botón que se pueda olvidar. */
for (const campo of [elAjustes.cuotaObjetivo, elAjustes.cuotaMoneda]) {
  campo.addEventListener('change', () => {
    estado.cuota = normalizarCuota({
      ...estado.cuota,
      objetivo: Number(elAjustes.cuotaObjetivo.value) || 0,
      moneda: elAjustes.cuotaMoneda.value.trim() || estado.cuota.moneda,
    });
    pitido('guardar');
    actualizar();
  });
}

elAjustes.verPeso.addEventListener('change', () => {
  estado.ajustes.verPeso = elAjustes.verPeso.checked;
  actualizar();
  pitido('guardar');
});

elAjustes.ascenso.addEventListener('change', () => {
  if (!fijarFecha(estado, elAjustes.ascenso.value)) return;
  notificar({
    titulo: t('incursion'),
    lineas: [
      { texto: `El ascenso queda fijado para el ${estado.incursion.fecha}.`, destacado: true },
      { texto: 'La incursión mide lo que hagas de aquí a ese día.' },
    ],
  });
  pitido('guardar');
  actualizar();
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
    titulo: t('notiReinicio'),
    lineas: [{ texto: 'Todo vuelve al nivel 1. Empieza de cero, jugador.' }],
  });
});

/* ------------------------------ temporizadores ------------------------------ */

// El reloj también detecta el cambio de día si la app se queda abierta.
setInterval(() => {
  renderReloj();
  // El horario puede haber cambiado de tramo mientras la app estaba abierta.
  if (modoEfectivo(estado.ajustes) !== modo) actualizar();
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

sincronizarModo();
// La primera vez se abre la incursión sola, a dos meses vista. La fecha se
// cambia en la configuración en cuanto se sepa la de verdad.
if (!estado.incursion) estado.incursion = crearIncursion(estado);
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
