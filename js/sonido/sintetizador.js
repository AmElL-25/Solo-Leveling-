/* ==========================================================================
   Feature: sonido del Sistema. Sintetiza los avisos al vuelo con la Web Audio
   API: no hay archivos de audio, así que la app sigue pesando lo mismo y no
   usa material de nadie.

   El timbre imita las campanas cristalinas de las ventanas del anime: cada
   nota es una fundamental con dos armónicos por encima, ataque instantáneo y
   caída larga, filtrada en agudos para que no chille en el móvil.
   ========================================================================== */

let audio = null;

/** Una nota de campana: fundamental + armónicos, con caída exponencial. */
function campana(destino, { frecuencia, inicio, duracion, volumen, armonicos }) {
  for (const [multiplo, peso] of armonicos) {
    const osc = audio.createOscillator();
    const vol = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frecuencia * multiplo, inicio);

    const pico = Math.max(0.0002, volumen * peso);
    vol.gain.setValueAtTime(0.0001, inicio);
    vol.gain.exponentialRampToValueAtTime(pico, inicio + 0.008);
    vol.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);

    osc.connect(vol).connect(destino);
    osc.start(inicio);
    osc.stop(inicio + duracion + 0.02);
  }
}

const CAMPANA = [[1, 1], [2, 0.32], [3, 0.12], [4.2, 0.06]];
const METAL   = [[1, 1], [2.7, 0.4], [5.1, 0.18]];
const GRAVE   = [[1, 1], [1.5, 0.3], [2, 0.15]];

/* Cada aviso es una secuencia de notas: [frecuencia, retardo, duración, volumen]. */
const SECUENCIAS = {
  // Ventana del Sistema: el "ding" de dos notas.
  aviso:    { armonicos: CAMPANA, notas: [[1318, 0, 0.9, 0.09], [1975, 0.1, 1.2, 0.075]] },
  // Subida de nivel: arpegio ascendente que se queda sonando.
  nivel:    { armonicos: CAMPANA, notas: [[659, 0, 0.7, 0.08], [988, 0.09, 0.8, 0.08], [1318, 0.18, 1, 0.085], [1975, 0.27, 1.8, 0.09]] },
  // Logro: título, clase o deuda saldada.
  logro:    { armonicos: CAMPANA, notas: [[880, 0, 0.7, 0.08], [1318, 0.1, 0.9, 0.08], [1760, 0.2, 1.6, 0.085]] },
  // Oro: dos golpes metálicos cortos.
  oro:      { armonicos: METAL,   notas: [[1046, 0, 0.35, 0.07], [1568, 0.06, 0.45, 0.06]] },
  // Puerta: intervalo abierto, algo inquietante.
  puerta:   { armonicos: CAMPANA, notas: [[523, 0, 0.9, 0.075], [740, 0.12, 1.1, 0.07], [1046, 0.24, 1.4, 0.06]] },
  // Jefe derrotado: golpe grave y brillo encima.
  jefe:     { armonicos: GRAVE,   notas: [[196, 0, 1.2, 0.1], [392, 0.05, 1, 0.07], [784, 0.16, 1.4, 0.06]] },
  // Castigo y errores: dos notas graves que chocan.
  error:    { armonicos: GRAVE,   notas: [[233, 0, 1, 0.09], [220, 0.02, 1.2, 0.08], [147, 0.14, 1.4, 0.07]] },
  // Guardar una edición o cambiar un ajuste.
  guardar:  { armonicos: CAMPANA, notas: [[1046, 0, 0.35, 0.06], [1568, 0.05, 0.5, 0.05]] },
  // Punto de estadística repartido.
  punto:    { armonicos: CAMPANA, notas: [[1318, 0, 0.4, 0.06], [1760, 0.05, 0.6, 0.055]] },
  // Objetivo del día cumplido.
  objetivo: { armonicos: CAMPANA, notas: [[988, 0, 0.5, 0.07], [1318, 0.07, 0.8, 0.065]] },
  // Toque suave al mover un contador.
  toque:    { armonicos: METAL,   notas: [[1568, 0, 0.12, 0.028]] },
};

/**
 * Reproduce un aviso. `activo` viene de los ajustes del jugador.
 * Los navegadores bloquean el audio hasta el primer toque, así que se intenta
 * reanudar el contexto en cada llamada: la primera suele quedarse muda.
 */
export function sonar(tipo = 'aviso', activo = true) {
  if (!activo) return;
  const receta = SECUENCIAS[tipo] ?? SECUENCIAS.aviso;

  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();

    // Un filtro común quita la aspereza de los armónicos altos.
    const filtro = audio.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 5200;
    filtro.connect(audio.destination);

    const ahora = audio.currentTime + 0.01;
    for (const [frecuencia, retardo, duracion, volumen] of receta.notas) {
      campana(filtro, {
        frecuencia,
        inicio: ahora + retardo,
        duracion,
        volumen,
        armonicos: receta.armonicos,
      });
    }
  } catch { /* sin audio disponible: la app funciona igual */ }
}

/** Desbloquea el audio en el primer gesto del usuario, como exigen los navegadores. */
export function despertarSonido() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { /* nada que hacer */ }
}
