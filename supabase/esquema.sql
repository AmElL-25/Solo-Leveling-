-- ==========================================================================
-- Esquema de El Sistema. Se pega tal cual en Supabase → SQL Editor → Run.
--
-- Una fila por jugador con su partida entera. La seguridad no depende de que
-- la app pida bien las cosas: la base misma impide que nadie lea o escriba una
-- fila que no sea la suya, aunque alguien se ponga a llamar la API a mano.
-- ==========================================================================

create table if not exists public.partidas (
  -- La clave es el id del usuario: una partida por cuenta, y si se borra la
  -- cuenta se lleva su partida por delante (nada de datos huérfanos).
  usuario     uuid primary key references auth.users on delete cascade,
  estado      jsonb  not null,
  -- El mismo 'actualizado' que ya usa la app (epoch ms) para decidir qué copia
  -- manda entre dos aparatos. Se guarda aparte del jsonb para poder ordenar.
  actualizado bigint not null default 0,
  modificado  timestamptz not null default now()
);

-- Sin esto, la clave pública que va en la app dejaría leer la tabla entera.
alter table public.partidas enable row level security;

drop policy if exists "leer solo la propia" on public.partidas;
create policy "leer solo la propia"
  on public.partidas for select
  using (auth.uid() = usuario);

drop policy if exists "crear solo la propia" on public.partidas;
create policy "crear solo la propia"
  on public.partidas for insert
  with check (auth.uid() = usuario);

drop policy if exists "actualizar solo la propia" on public.partidas;
create policy "actualizar solo la propia"
  on public.partidas for update
  using (auth.uid() = usuario)
  with check (auth.uid() = usuario);

drop policy if exists "borrar solo la propia" on public.partidas;
create policy "borrar solo la propia"
  on public.partidas for delete
  using (auth.uid() = usuario);

-- 'modificado' lo pone el servidor, no el cliente: así una fecha falsa enviada
-- desde fuera no puede alterar el orden real de los guardados.
create or replace function public.marcar_modificado()
returns trigger language plpgsql as $$
begin
  new.modificado := now();
  return new;
end $$;

drop trigger if exists partidas_modificado on public.partidas;
create trigger partidas_modificado
  before insert or update on public.partidas
  for each row execute function public.marcar_modificado();

-- ==========================================================================
-- Nombres de jugador (añadido después de la tabla de partidas).
-- ==========================================================================

create table if not exists public.perfiles (
  usuario uuid primary key references auth.users on delete cascade,
  nick    text not null,
  creado  timestamptz not null default now(),
  constraint nick_con_formato check (nick ~ '^[A-Za-z0-9_-]{3,20}$')
);

create unique index if not exists perfiles_nick_unico on public.perfiles (lower(nick));

alter table public.perfiles enable row level security;

-- Nadie lee esta tabla desde fuera: eso es lo que impide sacar los correos
-- de los jugadores probando nombres. Solo la función 'entrar-con-nick', que
-- corre dentro de Supabase, la consulta con la clave de servicio.
drop policy if exists "leer solo el propio" on public.perfiles;
create policy "leer solo el propio" on public.perfiles for select
  using (auth.uid() = usuario);

drop policy if exists "cambiar solo el propio" on public.perfiles;
create policy "cambiar solo el propio" on public.perfiles for update
  using (auth.uid() = usuario) with check (auth.uid() = usuario);

-- El nick se reserva en el mismo acto del registro: viene en los datos que
-- manda la app y este disparador crea el perfil. Si ya estaba cogido, el
-- índice único hace fallar el alta entera.
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'nick' then
    insert into public.perfiles (usuario, nick)
    values (new.id, new.raw_user_meta_data->>'nick');
  end if;
  return new;
end $$;

drop trigger if exists crear_perfil_al_registrarse on auth.users;
create trigger crear_perfil_al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Saber si un nombre está libre sí se puede consultar sin sesión: devuelve un
-- sí o un no, nunca un correo.
create or replace function public.nick_libre(consulta text)
returns boolean language sql security definer
set search_path = ''
as $$
  select not exists (select 1 from public.perfiles where lower(nick) = lower(consulta));
$$;

grant execute on function public.nick_libre(text) to anon, authenticated;
