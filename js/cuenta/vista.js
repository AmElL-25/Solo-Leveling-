/* ==========================================================================
   Feature: cuenta — referencias del DOM y pintado del diálogo de acceso.
   Qué hacer con cada botón lo decide app.js, la raíz de composición.
   ========================================================================== */

const $ = (selector) => document.querySelector(selector);

export const elCuenta = {
  dialogo: $('#dlg-cuenta'),
  titulo: $('#cuenta-titulo'),
  ayuda: $('#cuenta-ayuda'),
  email: $('#cuenta-email'),
  clave: $('#cuenta-clave'),
  aviso: $('#cuenta-aviso'),
  btnEnviar: $('#btn-cuenta-enviar'),
  btnCambiar: $('#btn-cuenta-cambiar'),
  btnOlvide: $('#btn-cuenta-olvide'),
  btnCerrar: $('#btn-cuenta-cerrar'),
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
    ? 'Con una cuenta tu partida deja de vivir solo en este aparato.'
    : 'Tu partida te sigue a cualquier aparato donde entres.';
  elCuenta.btnEnviar.textContent = registrando ? 'CREAR CUENTA' : 'ENTRAR';
  elCuenta.btnCambiar.textContent = registrando
    ? 'YA TENGO CUENTA, ENTRAR'
    : 'NO TENGO CUENTA, CREAR UNA';
  // Recuperar la contraseña solo tiene sentido si ya existe.
  elCuenta.btnOlvide.hidden = registrando;
  elCuenta.clave.autocomplete = registrando ? 'new-password' : 'current-password';
  elCuenta.aviso.textContent = '';
}

export function avisar(texto, esError = true) {
  elCuenta.aviso.textContent = texto;
  elCuenta.aviso.style.color = texto && esError ? 'var(--malo, #ff6b78)' : '';
}

export function abrirCuenta(registrando = false) {
  pintarModo(registrando);
  elCuenta.dialogo.showModal();
  elCuenta.email.focus();
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
  if (sesion) elCuenta.correo.textContent = `Sesión de ${sesion.correo}`;
  if (!hayCuentas) {
    elCuenta.explica.textContent = 'Las cuentas todavía no están configuradas en este despliegue. '
      + 'La app funciona igual: tu partida vive en este aparato.';
  }
}
