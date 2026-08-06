-- 1. Borrar las policies anteriores
drop policy if exists "own clientes" on clientes;
drop policy if exists "own tareas" on tareas;

-- 2. Crear policies compartidas: cualquier usuario autenticado puede todo
create policy "shared clientes" on clientes
    for all
    to authenticated
    using (true)
    with check (true);

create policy "shared tareas" on tareas
    for all
    to authenticated
    using (true)
    with check (true);

-- 3. Quitar los triggers de asignacion automatica de user_id
--    (ya no necesitamos asignar dueno, los datos son de todos)
drop trigger if exists tareas_set_user on tareas;
drop trigger if exists clientes_set_user on clientes;

-- 4. La columna user_id puede seguir existiendo o la puedes borrar:
alter table tareas drop column if exists user_id;
alter table clientes drop column if exists user_id;
