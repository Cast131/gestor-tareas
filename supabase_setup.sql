-- 1. Borrar todos los datos existentes
truncate table tareas restart identity cascade;
truncate table clientes restart identity cascade;

-- 2. Agregar columna user_id
alter table tareas add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table clientes add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 3. Hacer user_id obligatorio
alter table tareas alter column user_id set not null;
alter table clientes alter column user_id set not null;

-- 4. Activar RLS
alter table tareas enable row level security;
alter table clientes enable row level security;

-- 5. Policies: cada usuario solo accede a sus datos
drop policy if exists "own clientes" on clientes;
create policy "own clientes" on clientes
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "own tareas" on tareas;
create policy "own tareas" on tareas
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 6. Trigger para auto-asignar user_id al insertar
create or replace function set_user_id()
returns trigger as $$
begin
  new.user_id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tareas_set_user on tareas;
create trigger tareas_set_user
  before insert on tareas
  for each row execute function set_user_id();

drop trigger if exists clientes_set_user on clientes;
create trigger clientes_set_user
  before insert on clientes
  for each row execute function set_user_id();
