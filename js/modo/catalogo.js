/* ==========================================================================
   Feature: modo — la misma app con dos caras.

   SISTEMA: la estética del anime, ventanas modales y vocabulario de cazador.
   SALES:   la misma app vestida para el área de ventas.

   Aquí solo vive el diccionario: las reglas del juego no cambian de un modo a
   otro, cambia cómo se llama cada cosa en pantalla.
   ========================================================================== */

export const MODOS = ['sistema', 'sales'];
export const MODO_INICIAL = 'sistema';

export const TERMINOS = {
  /* --------------------------------- cabecera --------------------------------- */
  app:            { sistema: 'EL SISTEMA', sales: 'SALES' },
  lema:           { sistema: 'Solo el que cumple, asciende.', sales: 'Actividad, resultados y equipo.' },
  cambiarModo:    { sistema: 'MODO SALES', sales: 'MODO SISTEMA' },

  /* --------------------------------- pestañas --------------------------------- */
  tabMision:      { sistema: 'MISIÓN', sales: 'OBJETIVOS' },
  tabEstado:      { sistema: 'ESTADO', sales: 'FICHA' },
  tabCuadro:      { sistema: 'CUADRO', sales: 'CUADRO' },
  tabTienda:      { sistema: 'TIENDA', sales: 'CANJE' },
  configuracion:  { sistema: 'CONFIGURACIÓN', sales: 'CONFIGURACIÓN' },
  volver:         { sistema: 'VOLVER', sales: 'VOLVER' },
  objetivosLista: { sistema: 'MISIONES DIARIAS', sales: 'OBJETIVOS DIARIOS' },

  /* ------------------------------- misión diaria ------------------------------- */
  misionDiaria:   { sistema: 'MISIÓN DIARIA', sales: 'OBJETIVOS DEL DÍA' },
  subtitulo:      { sistema: 'Preparación para convertirse en un guerrero', sales: 'Actividad comprometida para hoy' },
  avisoPendiente: {
    sistema: 'ADVERTENCIA: si no completas la misión diaria recibirás el castigo correspondiente.',
    sales: 'Si no cumples los objetivos del día se activa el plan de recuperación.',
  },
  reclamar:       { sistema: 'RECLAMAR RECOMPENSA', sales: 'CERRAR EL DÍA' },
  reclamado:      { sistema: 'MISIÓN DIARIA COMPLETADA', sales: 'DÍA CERRADO' },
  nuevaMision:    { sistema: '＋ NUEVA MISIÓN', sales: '＋ NUEVO OBJETIVO' },
  dlgNueva:       { sistema: 'NUEVA MISIÓN', sales: 'NUEVO OBJETIVO' },
  dlgEditar:      { sistema: 'EDITAR MISIÓN', sales: 'EDITAR OBJETIVO' },

  /* ---------------------------------- castigo ---------------------------------- */
  castigo:        { sistema: 'MISIÓN DE CASTIGO', sales: 'PLAN DE RECUPERACIÓN' },
  castigoInsignia:{ sistema: 'DEUDA', sales: 'PENDIENTE' },
  castigoBanda:   { sistema: '⚠ ZONA DE PENALIZACIÓN', sales: '⚠ PLAN DE RECUPERACIÓN ACTIVO' },
  castigoAceptar: { sistema: 'ACEPTO EL CASTIGO', sales: 'ASUMO EL PLAN' },
  castigoSaldar:  { sistema: 'SALDAR LA DEUDA', sales: 'CERRAR EL PLAN' },
  castigoPorDia:  { sistema: 'Fallaste la misión diaria.', sales: 'No cumpliste los objetivos del día.' },
  castigoPorJefe: { sistema: 'Dejaste escapar al jefe de la semana.', sales: 'No alcanzaste el objetivo de la semana.' },

  /* ----------------------------------- jefe ----------------------------------- */
  jefe:           { sistema: 'JEFE DE LA SEMANA', sales: 'OBJETIVO DE LA SEMANA' },
  jefeVivo:       {
    sistema: 'Cada objetivo que completas le hace daño. Cierra puertas para pegar más fuerte.',
    sales: 'Cada objetivo cumplido suma al avance de la semana. Las oportunidades suman el triple.',
  },
  jefeCaido:      { sistema: 'Derrotado. El lunes aparecerá otro.', sales: 'Objetivo alcanzado. El lunes empieza otro.' },
  jefeSinJefe:    { sistema: 'Ningún jefe a la vista. El próximo lunes aparecerá uno.', sales: 'Sin objetivo abierto. El próximo lunes se fija uno.' },
  jefeBloqueado:  {
    sistema: 'El Sistema no abrirá la semana hasta que saldes tu deuda. Cumple la misión de castigo y aparecerá un jefe.',
    sales: 'No se abre una semana nueva con un plan de recuperación pendiente. Ciérralo y se fijará el objetivo.',
  },
  jefePlazo:      { sistema: 'de plazo', sales: 'de plazo' },

  /* ---------------------------------- puerta ---------------------------------- */
  puerta:         { sistema: 'PUERTA', sales: 'OPORTUNIDAD' },
  puertaAbierta:  {
    sistema: 'Desafío opcional: no penaliza si lo dejas pasar, pero la recompensa se pierde a medianoche.',
    sales: 'Trabajo extra opcional: no penaliza, pero la recompensa caduca a medianoche.',
  },
  puertaCerrada:  { sistema: 'Has despejado esta puerta.', sales: 'Oportunidad aprovechada.' },
  puertaSinPuerta:{ sistema: 'Hoy no se ha abierto ninguna puerta. Mañana será otro día.', sales: 'Hoy no hay oportunidad extra. Mañana será otro día.' },
  cerrarPuerta:   { sistema: 'CERRAR LA PUERTA', sales: 'REGISTRAR LA OPORTUNIDAD' },
  puertaLista:    { sistema: 'PUERTA CERRADA', sales: 'OPORTUNIDAD REGISTRADA' },
  notiPuertaHecha:{ sistema: 'PUERTA DESPEJADA', sales: 'OPORTUNIDAD APROVECHADA' },

  /* ---------------------------------- ficha ---------------------------------- */
  estado:         { sistema: 'ESTADO', sales: 'FICHA' },
  estadisticas:   { sistema: 'ESTADÍSTICAS', sales: 'COMPETENCIAS' },
  clase:          { sistema: 'CLASE', sales: 'PERFIL' },
  clasePendiente: { sistema: 'ELEGIR CLASE', sales: 'ELEGIR PERFIL' },
  dlgClase:       { sistema: 'CAMBIO DE CLASE', sales: 'ELECCIÓN DE PERFIL' },
  titulos:        { sistema: 'TÍTULOS', sales: 'RECONOCIMIENTOS' },
  historial:      { sistema: 'HISTORIAL', sales: 'HISTORIAL' },
  oro:            { sistema: 'ORO', sales: 'CRÉDITOS' },
  oroMinuscula:   { sistema: 'oro', sales: 'créditos' },
  xp:             { sistema: 'XP', sales: 'PTS' },
  poder:          { sistema: 'PODER', sales: 'ÍNDICE' },
  fatiga:         { sistema: 'FATIGA', sales: 'CARGA' },
  sinClase:       { sistema: 'Sin clase', sales: 'Sin perfil' },

  /* Rótulos de la ficha: llevan los dos puntos incluidos. */
  fichaOro:       { sistema: 'ORO:', sales: 'CRÉDITOS:' },
  fichaPoder:     { sistema: 'PODER:', sales: 'ÍNDICE:' },
  fichaFatiga:    { sistema: 'FATIGA:', sales: 'CARGA:' },
  fichaClase:     { sistema: 'CLASE:', sales: 'PERFIL:' },
  fichaTitulo:    { sistema: 'TÍTULO:', sales: 'RECONOCIMIENTO:' },
  sinTitulo:      { sistema: 'Sin título', sales: 'Sin reconocimiento' },

  /* ---------------------------------- tienda ---------------------------------- */
  tienda:         { sistema: 'TIENDA DEL SISTEMA', sales: 'CANJE DE CRÉDITOS' },
  tiendaAyuda:    {
    sistema: 'El oro se gana completando misiones diarias y cerrando puertas.',
    sales: 'Los créditos se ganan cerrando el día y registrando oportunidades.',
  },
  inventario:     { sistema: 'INVENTARIO', sales: 'DISPONIBLES' },

  /* --------------------------------- notificaciones --------------------------------- */
  notiCabecera:   { sistema: 'NOTIFICACIÓN', sales: 'AVISO' },
  notiDiaria:     { sistema: 'HA LLEGADO LA MISIÓN DIARIA', sales: 'OBJETIVOS DEL DÍA' },
  notiNivel:      { sistema: '¡HAS SUBIDO DE NIVEL!', sales: 'NUEVO NIVEL' },
  notiCastigo:    { sistema: 'ZONA DE PENALIZACIÓN', sales: 'PLAN DE RECUPERACIÓN' },
  notiCastigoNuevo:{ sistema: 'CASTIGO ASIGNADO', sales: 'PLAN ASIGNADO' },
  notiCastigoOk:  { sistema: 'CASTIGO ACEPTADO', sales: 'PLAN ASUMIDO' },
  notiDeuda:      { sistema: 'DEUDA SALDADA', sales: 'PLAN COMPLETADO' },
  notiPuerta:     { sistema: 'SE HA ABIERTO UNA PUERTA', sales: 'NUEVA OPORTUNIDAD' },
  notiJefeNuevo:  { sistema: 'HA APARECIDO UN JEFE', sales: 'OBJETIVO DE LA SEMANA FIJADO' },
  notiJefeCaido:  { sistema: 'JEFE DERROTADO', sales: 'OBJETIVO ALCANZADO' },
  notiJefeHuido:  { sistema: 'EL JEFE HA ESCAPADO', sales: 'OBJETIVO NO ALCANZADO' },
  notiSemana:     { sistema: 'SEMANA BLOQUEADA', sales: 'SEMANA EN PAUSA' },
  notiTitulo:     { sistema: 'TÍTULO DESBLOQUEADO', sales: 'RECONOCIMIENTO OBTENIDO' },
  notiClase:      { sistema: 'CLASE ADQUIRIDA', sales: 'PERFIL DEFINIDO' },
  notiCompra:     { sistema: 'COMPRA REALIZADA', sales: 'CANJE REALIZADO' },
  notiObjeto:     { sistema: 'OBJETO USADO', sales: 'BENEFICIO APLICADO' },
  notiReinicio:   { sistema: 'SISTEMA REINICIADO', sales: 'DATOS REINICIADOS' },

  /* ---------------------------------- ajustes ---------------------------------- */
  ajustes:        { sistema: 'AJUSTES', sales: 'AJUSTES' },
  ajusteSonido:   { sistema: 'Sonido del Sistema', sales: 'Sonido de avisos' },
  misionesAjustes:{ sistema: 'PLANTILLAS', sales: 'PLANTILLAS' },
};

/** La palabra de una clave en el modo pedido. */
export function termino(clave, modo = MODO_INICIAL) {
  const entrada = TERMINOS[clave];
  if (!entrada) return clave;
  return entrada[modo] ?? entrada[MODO_INICIAL];
}
