/* ==========================================================================
   Sincronización entre dispositivos. Guarda y devuelve el estado completo
   del jugador en Redis (Upstash), protegido por un token personal.

   Variables de entorno necesarias (se configuran en Vercel, nunca en el
   repositorio):
     SYNC_TOKEN                 el token que también pegas en AJUSTES
     UPSTASH_REDIS_REST_URL     de la integración de Upstash en Vercel
     UPSTASH_REDIS_REST_TOKEN   idem
   ========================================================================== */

import { createHash, timingSafeEqual } from 'node:crypto';

const CLAVE_REDIS = 'estado';
const TAMANO_MAXIMO = 1024 * 1024; // 1 MB: una partida ocupa unas decenas de KB

/* Se comparan los resúmenes y no los textos: así la comparación tarda lo
   mismo acierte o no, y no hace falta que los dos midan igual. */
const resumen = (texto) => createHash('sha256').update(String(texto)).digest();
const tokenValido = (recibido, esperado) =>
  Boolean(esperado) && timingSafeEqual(resumen(recibido), resumen(esperado));

/** Una partida del Sistema, no cualquier JSON: lo mínimo para no guardar basura. */
const esPartida = (datos) =>
  Boolean(datos) && typeof datos === 'object' && !Array.isArray(datos)
  && Boolean(datos.jugador) && typeof datos.jugador === 'object'
  && Array.isArray(datos.misiones);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tokenValido(token, process.env.SYNC_TOKEN)) {
    res.status(401).json({ error: 'token inválido' });
    return;
  }

  const base = process.env.UPSTASH_REDIS_REST_URL;
  const tokenRedis = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !tokenRedis) {
    res.status(500).json({ error: 'sincronización sin configurar en el servidor' });
    return;
  }
  const cabecerasRedis = { Authorization: `Bearer ${tokenRedis}` };

  try {
    if (req.method === 'GET') {
      const respuesta = await fetch(`${base}/get/${CLAVE_REDIS}`, { headers: cabecerasRedis });
      if (!respuesta.ok) {
        res.status(502).json({ error: 'no se pudo leer el estado guardado' });
        return;
      }
      const { result } = await respuesta.json();
      res.status(200).json({ estado: result ? JSON.parse(result) : null });
      return;
    }

    if (req.method === 'PUT') {
      // Vercel ya parsea el JSON; si llega como texto, se parsea aquí.
      const datos = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!esPartida(datos)) {
        res.status(400).json({ error: 'el cuerpo no es una partida válida' });
        return;
      }
      const cuerpo = JSON.stringify(datos);
      if (cuerpo.length > TAMANO_MAXIMO) {
        res.status(413).json({ error: 'estado demasiado grande' });
        return;
      }
      const respuesta = await fetch(`${base}/set/${CLAVE_REDIS}`, {
        method: 'POST',
        headers: cabecerasRedis,
        body: cuerpo,
      });
      if (!respuesta.ok) {
        res.status(502).json({ error: 'no se pudo guardar el estado' });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'método no soportado' });
  } catch (error) {
    // JSON roto (en la petición o en Redis) o Upstash inalcanzable.
    const malFormado = error instanceof SyntaxError;
    res.status(malFormado ? 400 : 502).json({
      error: malFormado ? 'JSON no válido' : 'no se pudo contactar con el almacén',
    });
  }
}
