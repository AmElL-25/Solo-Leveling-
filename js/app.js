/* ==========================================================================
   Arranque y cableado: carga el estado, escucha al jugador y vuelve a pintar.
   ========================================================================== */

import {
  STATS, cargar, guardar, borrar, estadoInicial, exportar, importar, idNuevo, fechaHoy,
} from './estado.js';
import {
  sincronizarDia, completarDia, ajustarProgreso, fijarProgreso,
  asignarPunto, recompensaDia, xpNecesaria,
} from './sistema.js';
import { render, renderReloj, notificar, sonar, el } from './ui.js';

let estado = cargar();

const $ = (selector) => document.querySelector(selector);

function actualizar() {
  guardar(estado);
  render(estado);
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
  const { total } = recompensaDia(estado);
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
      $(`#tab-${otro.dataset.tab}`).hidden = !activo;
    });
  });
});

/* ------------------------------ misiones ------------------------------ */

el.misiones.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const id = boton.closest('[data-id]')?.dataset.id;
  const mision = estado.misiones.find((m) => m.id === id);
  if (!mision) return;

  switch (boton.dataset.accion) {
    case 'mas':
      ajustarProgreso(estado, id, mision.paso);
      break;
    case 'menos':
      ajustarProgreso(estado, id, -mision.paso);
      break;
    case 'alternar':
      fijarProgreso(estado, id, mision.progreso >= 1 ? 0 : 1);
      break;
    case 'editar':
      abrirDialogo(mision);
      return;
    case 'borrar':
      if (!confirm(`¿Eliminar la misión "${mision.nombre}"?`)) return;
      estado.misiones = estado.misiones.filter((m) => m.id !== id);
      break;
    default:
      return;
  }
  actualizar();
});

el.misiones.addEventListener('change', (evento) => {
  const campo = evento.target.closest('input[data-accion="fijar"]');
  if (!campo) return;
  const id = campo.closest('[data-id]')?.dataset.id;
  fijarProgreso(estado, id, Number(campo.value));
  actualizar();
});

$('#btn-completar').addEventListener('click', () => {
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

const dlg = $('#dlg-mision');
const campos = {
  id: $('#campo-id'),
  nombre: $('#campo-nombre'),
  tipo: $('#campo-tipo'),
  objetivo: $('#campo-objetivo'),
  unidad: $('#campo-unidad'),
  paso: $('#campo-paso'),
  xp: $('#campo-xp'),
  stat: $('#campo-stat'),
};

campos.stat.innerHTML = STATS.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join('');

function alternarCamposContador() {
  $('#campos-contador').hidden = campos.tipo.value === 'checkbox';
}
campos.tipo.addEventListener('change', alternarCamposContador);

function abrirDialogo(mision = null) {
  $('#dlg-titulo').textContent = mision ? 'EDITAR MISIÓN' : 'NUEVA MISIÓN';
  campos.id.value = mision?.id ?? '';
  campos.nombre.value = mision?.nombre ?? '';
  campos.tipo.value = mision?.tipo ?? 'contador';
  campos.objetivo.value = mision?.objetivo ?? 100;
  campos.unidad.value = mision?.unidad ?? 'reps';
  campos.paso.value = mision?.paso ?? 10;
  campos.xp.value = mision?.xp ?? 40;
  campos.stat.value = mision?.stat ?? 'fuerza';
  alternarCamposContador();
  dlg.showModal();
}

$('#btn-nueva').addEventListener('click', () => abrirDialogo());
$('#btn-cancelar-mision').addEventListener('click', () => dlg.close());

$('#form-mision').addEventListener('submit', (evento) => {
  evento.preventDefault();

  const nombre = campos.nombre.value.trim();
  if (!nombre) return;

  const esContador = campos.tipo.value === 'contador';
  const datos = {
    nombre,
    tipo: esContador ? 'contador' : 'checkbox',
    objetivo: esContador ? Math.max(0.5, Number(campos.objetivo.value) || 1) : 1,
    unidad: esContador ? campos.unidad.value.trim() : '',
    paso: esContador ? Math.max(0.5, Number(campos.paso.value) || 1) : 1,
    xp: Math.min(999, Math.max(1, Math.round(Number(campos.xp.value) || 20))),
    stat: campos.stat.value,
  };

  const existente = estado.misiones.find((m) => m.id === campos.id.value);
  if (existente) {
    Object.assign(existente, datos);
    existente.progreso = Math.min(existente.progreso, existente.objetivo);
  } else {
    estado.misiones.push({ id: idNuevo(), progreso: 0, ...datos });
  }

  dlg.close();
  actualizar();
});

/* ------------------------------ estadísticas ------------------------------ */

el.stats.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-stat]');
  if (!boton) return;
  if (asignarPunto(estado, boton.dataset.stat)) {
    pitido('nivel');
    actualizar();
  }
});

/* ------------------------------ ajustes ------------------------------ */

$('#btn-nombre').addEventListener('click', () => {
  const nombre = prompt('Nombre del jugador:', estado.jugador.nombre);
  if (nombre === null) return;
  estado.jugador.nombre = nombre.trim().slice(0, 24) || 'Jugador';
  actualizar();
});

el.sonido.addEventListener('change', () => {
  estado.ajustes.sonido = el.sonido.checked;
  guardar(estado);
  pitido('aviso');
});

$('#btn-exportar').addEventListener('click', () => {
  const blob = new Blob([exportar(estado)], { type: 'application/json' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `sistema-${fechaHoy()}.json`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
});

$('#btn-importar').addEventListener('click', () => $('#archivo-importar').click());

$('#archivo-importar').addEventListener('change', async (evento) => {
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

$('#btn-reiniciar').addEventListener('click', () => {
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
