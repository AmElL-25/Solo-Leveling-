/* ==========================================================================
   Feature: ajustes — referencias del DOM para preferencias y copias de
   seguridad. Qué hacer con cada acción (exportar, restaurar, reiniciar) lo
   decide app.js, la raíz de composición: aquí solo vive el pintado.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

export const elAjustes = {
  sonido: $('#ajuste-sonido'),
  animaciones: $('#ajuste-animaciones'),
  verPeso: $('#ajuste-ver-peso'),
  horario: $('#ajuste-horario'),
  desde: $('#ajuste-desde'),
  hasta: $('#ajuste-hasta'),
  dias: $('#ajuste-dias'),
  ascenso: $('#ajuste-ascenso'),
  cuotaObjetivo: $('#ajuste-cuota'),
  cuotaMoneda: $('#ajuste-moneda'),
  btnExportar: $('#btn-exportar'),
  btnImportar: $('#btn-importar'),
  archivoImportar: $('#archivo-importar'),
  btnReiniciar: $('#btn-reiniciar'),
  tokenSync: $('#ajuste-token-sync'),
  btnGuardarToken: $('#btn-guardar-token'),
  estadoSync: $('#estado-sync'),
  // Bienvenida de un aparato nuevo: el mismo token, pedido al abrir.
  syncToken: $('#sync-token'),
  syncEstado: $('#sync-estado'),
  btnSyncConectar: $('#btn-sync-conectar'),
  btnSyncOmitir: $('#btn-sync-omitir'),
};

const dlgSync = $('#dlg-sync');

export function abrirBienvenidaSync() {
  elAjustes.syncEstado.textContent = '';
  elAjustes.syncToken.value = '';
  // Sin salida por Escape: las dos opciones están a la vista y hay que elegir
  // una, para no dejar el aparato a medias sin querer.
  dlgSync.addEventListener('cancel', (evento) => evento.preventDefault());
  dlgSync.showModal();
}

export const cerrarBienvenidaSync = () => dlgSync.close();

const DIAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export function renderAjustes(estado) {
  const { ajustes } = estado;
  elAjustes.sonido.checked = ajustes.sonido;
  elAjustes.animaciones.checked = ajustes.animaciones;
  elAjustes.verPeso.checked = ajustes.verPeso;
  elAjustes.horario.checked = ajustes.horario.activo;
  if (document.activeElement !== elAjustes.desde) elAjustes.desde.value = ajustes.horario.desde;
  if (document.activeElement !== elAjustes.hasta) elAjustes.hasta.value = ajustes.horario.hasta;
  elAjustes.dias.innerHTML = DIAS.map((letra, indice) => `
    <button class="dia-semana ${ajustes.horario.dias.includes(indice) ? 'dia-semana--activo' : ''}"
            type="button" data-dia="${indice}" aria-pressed="${ajustes.horario.dias.includes(indice)}">
      ${letra}
    </button>`).join('');
  // Solo se reescriben si el jugador no los está editando en ese momento.
  if (document.activeElement !== elAjustes.ascenso) {
    elAjustes.ascenso.value = estado.incursion?.fecha ?? '';
  }
  if (document.activeElement !== elAjustes.cuotaObjetivo) {
    elAjustes.cuotaObjetivo.value = estado.cuota.objetivo || '';
  }
  if (document.activeElement !== elAjustes.cuotaMoneda) {
    elAjustes.cuotaMoneda.value = estado.cuota.moneda;
  }
}
