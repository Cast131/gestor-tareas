-- 1. Agregar columna user_id y created_by_email
alter table tareas add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table tareas add column if not exists created_by_email text;

-- 2. Trigger: asigna user_id y email del creador al insertar
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

-- 3. (Opcional) Rellenar email de tareas existentes si tienen user_id
update tareas t
set created_by_email = u.email
from auth.users u
where t.user_id = u.id and t.created_by_email is null;
