/* ==========================================================================
   Raíz de composición: carga el progreso, cablea los eventos de cada
   feature y vuelve a pintar. No contiene reglas del juego ni pintado
   propio; solo conecta lo que ya define cada feature.
   ========================================================================== */

import { cargar, guardar, borrar, estadoInicial, exportar, importar } from './progreso.js';
import { fechaHoy } from './nucleo/fecha.js';
import { notificar, sonar } from './notificaciones/notificaciones.js';

import { xpNecesaria, asignarPunto } from './jugador/reglas.js';
import { elJugador, renderVentanaEstado, renderStats } from './jugador/vista.js';

import { ajustarProgreso, fijarProgreso, guardarMision, eliminarMision } from './misiones/reglas.js';
import {
  elMisiones, renderMisiones, abrirDialogoMision, cerrarDialogoMision, leerFormularioMision,
} from './misiones/vista.js';

import { sincronizarDia, completarDia, recompensaDia } from './ciclo-diario/reglas.js';
import { elCicloDiario, renderReloj, renderAvisoDiario } from './ciclo-diario/vista.js';

import { renderHistorial } from './historial/vista.js';
import { elAjustes, renderAjustes } from './ajustes/vista.js';

let estado = cargar();

function render() {
  renderVentanaEstado(estado.jugador);
  renderStats(estado.jugador);
  renderMisiones(estado.misiones);
  renderAvisoDiario(estado);
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

/* ---------------------------- ciclo del día ---------------------------- */

function comprobarDia() {
  const resumen = sincronizarDia(estado);
  if (!resumen) return false;

  if (!resumen.completado) {
    const lineas = [
      { texto: `Has fallado la misión del ${resumen.fecha} (${resumen.porcentaje} % completado).` },
    ];
    if (resumen.perdida > 0) lineas.push({ texto: `−${resumen.perdida} XP`, destacado: true });
    if (resumen.rachaPerdida > 0) lineas.push({ texto: `Racha rota: ${resumen.rachaPerdida} días perdidos.` });
    lineas.push({ texto: 'El nivel alcanzado no se pierde. Levántate y vuelve a empezar.' });

    notificar({ titulo: 'ZONA DE PENALIZACIÓN', lineas, tipo: 'peligro', boton: 'ACEPTO EL CASTIGO' });
    pitido('error');
  }
  return true;
}

function avisarMisionDiaria() {
  if (estado.dia.avisado || estado.dia.completado) return;
  estado.dia.avisado = true;
  const { total } = recompensaDia(estado.misiones);
  notificar({
    titulo: 'HA LLEGADO LA MISIÓN DIARIA',
    lineas: [
      { texto: `${estado.misiones.length} objetivos pendientes para hoy.` },
      { texto: `Recompensa: ${total} XP + 1 punto`, destacado: true },
      { texto: 'Fallar la misión conlleva penalización.' },
    ],
    boton: 'EMPEZAR',
  });
  pitido('aviso');
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

elMisiones.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const id = boton.closest('[data-id]')?.dataset.id;
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return;

  switch (boton.dataset.accion) {
    case 'mas':
      ajustarProgreso(estado.misiones, id, mision.paso);
      break;
    case 'menos':
      ajustarProgreso(estado.misiones, id, -mision.paso);
      break;
    case 'alternar':
      fijarProgreso(estado.misiones, id, mision.progreso >= 1 ? 0 : 1);
      break;
    case 'editar':
      abrirDialogoMision(mision);
      return;
    case 'borrar':
      if (!confirm(`¿Eliminar la misión "${mision.nombre}"?`)) return;
      eliminarMision(estado.misiones, id);
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
  fijarProgreso(estado.misiones, id, Number(campo.value));
  actualizar();
});

elCicloDiario.btnCompletar.addEventListener('click', () => {
  const resultado = completarDia(estado);
  if (!resultado) return;

  const lineas = [
    { texto: `+${resultado.base} XP por los objetivos.` },
    { texto: `+${resultado.bono} XP de bonificación.` },
    { texto: `Total: ${resultado.total} XP`, destacado: true },
    { texto: `Racha: ${resultado.racha} ${resultado.racha === 1 ? 'día' : 'días'} · +1 punto de estadística.` },
  ];
  notificar({ titulo: 'MISIÓN DIARIA COMPLETADA', lineas, boton: 'RECIBIR' });
  pitido('aviso');

  if (resultado.niveles > 0) {
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
  }

  actualizar();
});

/* ------------------------- alta y edición de misiones ------------------------- */

elMisiones.btnNueva.addEventListener('click', () => abrirDialogoMision());
elMisiones.btnCancelar.addEventListener('click', () => cerrarDialogoMision());

elMisiones.formMision.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const datos = leerFormularioMision();
  if (!datos.nombre) return;

  guardarMision(estado.misiones, datos);
  cerrarDialogoMision();
  actualizar();
});

/* ------------------------------ estadísticas ------------------------------ */

elJugador.stats.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-stat]');
  if (!boton) return;
  if (asignarPunto(estado.jugador, boton.dataset.stat)) {
    pitido('nivel');
    actualizar();
  }
});

/* ------------------------------ ajustes ------------------------------ */

elJugador.btnNombre.addEventListener('click', () => {
  const nombre = prompt('Nombre del jugador:', estado.jugador.nombre);
  if (nombre === null) return;
  estado.jugador.nombre = nombre.trim().slice(0, 24) || 'Jugador';
  actualizar();
});

elAjustes.sonido.addEventListener('change', () => {
  estado.ajustes.sonido = elAjustes.sonido.checked;
  guardar(estado);
  pitido('aviso');
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
  if (!confirm('Se borrará todo tu progreso: nivel, estadísticas, racha e historial. ¿Continuar?')) return;
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
  if (estado.dia.fecha !== fechaHoy() && comprobarDia()) {
    avisarMisionDiaria();
    actualizar();
  }
}, 30000);

// Al volver a la app tras dejarla en segundo plano, revisamos la fecha.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  renderReloj();
  if (comprobarDia()) avisarMisionDiaria();
  actualizar();
});

/* ------------------------------ arranque ------------------------------ */

comprobarDia();
avisarMisionDiaria();
renderReloj();
actualizar();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sin caché offline */ });
  });
}
