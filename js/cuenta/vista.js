/* ==========================================================================
   Feature: cuenta — referencias del DOM y pintado del diálogo de acceso.
   Qué hacer con cada botón lo decide app.js, la raíz de composición.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

export const elCuenta = {
  dialogo: $('#dlg-cuenta'),
  titulo: $('#cuenta-titulo'),
  ayuda: $('#cuenta-ayuda'),
  nick: $('#cuenta-nick'),
  campoNick: $('#campo-nick'),
  campoEmail: $('#campo-email'),
  email: $('#cuenta-email'),
  clave: $('#cuenta-clave'),
  aviso: $('#cuenta-aviso'),
  btnEnviar: $('#btn-cuenta-enviar'),
  btnCambiar: $('#btn-cuenta-cambiar'),
  btnOlvide: $('#btn-cuenta-olvide'),
  btnCerrar: $('#btn-cuenta-cerrar'),
  btnSin: $('#btn-cuenta-sin'),
  // En ⚙ Configuración
  explica: $('#cuenta-explica'),
  correo: $('#cuenta-correo'),
  estado: $('#cuenta-estado'),
  btnAbrir: $('#btn-abrir-cuenta'),
  btnSalir: $('#btn-cerrar-sesion'),
};

/* El mismo diálogo sirve para entrar y para registrarse: cambian los textos,
   no la estructura. Así no hay dos formularios que mantener en paralelo. */
export function pintarModo(registrando) {
  elCuenta.titulo.textContent = registrando ? 'CREAR CUENTA' : 'ENTRAR';
  elCuenta.ayuda.textContent = registrando
    ? 'Elige tu nombre de jugador. El correo solo se usa para confirmar la cuenta y recuperarla.'
    : 'Tu partida te sigue a cualquier aparato donde entres.';
  elCuenta.btnEnviar.textContent = registrando ? 'CREAR CUENTA' : 'ENTRAR';
  elCuenta.btnCambiar.textContent = registrando
    ? 'YA TENGO CUENTA, ENTRAR'
    : 'NO TENGO CUENTA, CREAR UNA';
  // Al registrarse hacen falta los dos; al entrar basta el nombre, y el mismo
  // campo acepta el correo para las cuentas antiguas que aún no tienen nick.
  elCuenta.campoEmail.hidden = !registrando;
  elCuenta.campoNick.firstChild.textContent = registrando ? 'Nombre de jugador' : 'Nombre o correo';
  elCuenta.nick.placeholder = registrando ? '3 a 20 caracteres' : 'tu nombre de jugador';
  // Recuperar la contraseña solo tiene sentido si ya existe.
  elCuenta.btnOlvide.hidden = registrando;
  elCuenta.clave.autocomplete = registrando ? 'new-password' : 'current-password';
  elCuenta.aviso.textContent = '';
}

export function avisar(texto, esError = true) {
  elCuenta.aviso.textContent = texto;
  elCuenta.aviso.style.color = texto && esError ? 'var(--malo, #ff6b78)' : '';
}

/* 'bienvenida' es la primera apertura en un aparato nuevo: entonces no hay a
   dónde volver, así que en vez de VOLVER se ofrece jugar sin cuenta. */
export function abrirCuenta(registrando = false, bienvenida = false) {
  pintarModo(registrando);
  elCuenta.btnCerrar.hidden = bienvenida;
  elCuenta.btnSin.hidden = !bienvenida;
  elCuenta.dialogo.showModal();
  elCuenta.nick.focus();
}

export const cerrarCuenta = () => elCuenta.dialogo.close();

export function ocupado(si) {
  for (const b of [elCuenta.btnEnviar, elCuenta.btnCambiar, elCuenta.btnOlvide]) b.disabled = si;
}

/** La sección de ⚙ Configuración: o invita a entrar, o dice quién eres. */
export function renderCuenta(sesion, hayCuentas) {
  elCuenta.btnAbrir.hidden = Boolean(sesion) || !hayCuentas;
  elCuenta.btnSalir.hidden = !sesion;
  elCuenta.correo.hidden = !sesion;
  // Por el nombre de jugador, no por el correo: es su identidad en el juego.
  if (sesion) elCuenta.correo.textContent = `Jugando como ${sesion.nick || sesion.correo}`;
  if (!hayCuentas) {
    elCuenta.explica.textContent = 'Las cuentas todavía no están configuradas en este despliegue. '
      + 'La app funciona igual: tu partida vive en este aparato.';
  }
}
