-- Tabla de facturas
create table if not exists facturas (
    id bigint generated always as identity primary key,
    cliente_id bigint references clientes(id) on delete set null,
    fecha date default current_date,
    total numeric(12,2) not null default 0,
    estado text default 'pendiente' check (estado in ('pendiente','pagada')),
    notas text,
    user_id uuid references auth.users(id) on delete set null,
    created_by_email text,
    created_at timestamp with time zone default now()
);

-- Items de cada factura
create table if not exists factura_items (
    id bigint generated always as identity primary key,
    factura_id bigint references facturas(id) on delete cascade,
    tarea_id bigint references tareas(id) on delete set null,
    descripcion text,
    precio numeric(12,2) not null default 0
);

-- RLS compartido
alter table facturas enable row level security;
alter table factura_items enable row level security;

drop policy if exists "shared facturas" on facturas;
create policy "shared facturas" on facturas
    for all to authenticated using (true) with check (true);

drop policy if exists "shared factura_items" on factura_items;
create policy "shared factura_items" on factura_items
    for all to authenticated using (true) with check (true);

-- Trigger para user_id y email del creador
create or replace function set_factura_creator()
returns trigger as $$
begin
  if new.user_id is null then new.user_id = auth.uid(); end if;
  if new.created_by_email is null then new.created_by_email = (select email from auth.users where id = auth.uid()); end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists facturas_set_creator on facturas;
create trigger facturas_set_creator
  before insert on facturas
  for each row execute function set_factura_creator();
