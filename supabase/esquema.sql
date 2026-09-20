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
