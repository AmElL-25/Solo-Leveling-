/* ==========================================================================
   Sincronización entre dispositivos. Guarda y devuelve el estado completo
   del jugador en Redis (Upstash), protegido por un token personal.

   Variables de entorno necesarias (se configuran en Vercel, nunca en el
   repositorio):
     SYNC_TOKEN                 el token que también pegas en AJUSTES
     UPSTASH_REDIS_REST_URL     de la integración de Upstash en Vercel
     UPSTASH_REDIS_REST_TOKEN   idem
   ========================================================================== */

const CLAVE_REDIS = 'estado';

export default async function handler(req, res) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!process.env.SYNC_TOKEN || token !== process.env.SYNC_TOKEN) {
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
    const respuesta = await fetch(`${base}/set/${CLAVE_REDIS}`, {
      method: 'POST',
      headers: cabecerasRedis,
      body: JSON.stringify(req.body),
    });
    if (!respuesta.ok) {
      res.status(502).json({ error: 'no se pudo guardar el estado' });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'método no soportado' });
}
