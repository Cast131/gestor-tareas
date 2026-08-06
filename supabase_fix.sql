-- 1. Borrar policies inseguras para anon
drop policy if exists "Permitir todo al anon" on tareas;
drop policy if exists "Permitir todo al anon" on clientes;

-- 2. Borrar policies antiguas de aislamiento si quedaron
drop policy if exists "own tareas" on tareas;
drop policy if exists "own clientes" on clientes;

-- 3. Crear policies compartidas en ambas tablas
drop policy if exists "shared tareas" on tareas;
create policy "shared tareas" on tareas
    for all
    to authenticated
    using (true)
    with check (true);

drop policy if exists "shared clientes" on clientes;
create policy "shared clientes" on clientes
    for all
    to authenticated
    using (true)
    with check (true);

-- 4. Verificar columnas de tracking
alter table tareas add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table tareas add column if not exists created_by_email text;

-- 5. Trigger para asignar user_id y email al insertar
create or replace function set_tarea_creator()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  if new.created_by_email is null then
    new.created_by_email := (select email from auth.users where id = auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tareas_set_creator on tareas;
create trigger tareas_set_creator
  before insert on tareas
  for each row execute function set_tarea_creator();

-- 6. Rellenar email en tareas existentes que tengan user_id
update tareas t
set created_by_email = u.email
from auth.users u
where t.user_id = u.id and t.created_by_email is null;
