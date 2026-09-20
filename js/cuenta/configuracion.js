/* ==========================================================================
   Datos del proyecto de Supabase. Los dos valores salen de
   Supabase → Project Settings → API.

   Sí, van escritos en el repositorio y cualquiera que abra la web puede
   leerlos: están pensados para eso. La clave "anon" no da acceso a nada por
   sí sola — quien manda es la política de la base (supabase/esquema.sql), que
   solo deja ver y tocar la fila del usuario que ha iniciado sesión.

   LO QUE NUNCA VA AQUÍ es la clave "service_role", que sí se salta esas
   políticas. Esa no sale del panel de Supabase.

   Vacíos, la app funciona igual: se juega en local, sin cuentas.
   ========================================================================== */

export const URL_SUPABASE = '';
export const CLAVE_PUBLICA = '';
