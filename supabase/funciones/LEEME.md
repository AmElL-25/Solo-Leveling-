# Función `entrar-con-nick`

Vive desplegada en Supabase (Edge Functions), no se sirve desde la web.

Traduce *nombre de jugador → sesión* sin que el correo de nadie salga al
navegador: recibe nick y contraseña, busca a quién pertenece ese nombre usando
la clave de servicio (que solo existe dentro de Supabase) y deja que Supabase
valide la contraseña. Un nombre inexistente y una contraseña equivocada
devuelven el mismo error, así que no se puede averiguar qué jugadores hay
probando nombres.

Su código se edita y se despliega desde el panel de Supabase, o con la CLI:

    supabase functions deploy entrar-con-nick --no-verify-jwt

El `--no-verify-jwt` es necesario y deliberado: esta función *es* el inicio de
sesión, así que la llama quien todavía no tiene ninguna.
