-- Migracao incremental para o painel administrativo Gutenberg.
-- Execute no SQL Editor do projeto Supabase. Nao remove tabelas nem dados.

alter table public.profiles add column if not exists email text;
alter table public.produtos add column if not exists imagem text;
alter table public.produtos add column if not exists promocao boolean not null default false;
alter table public.produtos add column if not exists preco_antigo numeric;
alter table public.produtos add column if not exists estoque integer not null default 0;

create index if not exists produtos_estoque_idx on public.produtos (estoque);
create index if not exists profiles_tipo_usuario_idx on public.profiles (tipo_usuario);
create index if not exists mensagens_tipo_chat_idx on public.mensagens (tipo_chat, created_at);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tipo_usuario from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.produtos enable row level security;
alter table public.mensagens enable row level security;

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.current_user_role() in ('dona', 'admin'));

drop policy if exists profiles_update_owner on public.profiles;
create policy profiles_update_owner on public.profiles
for update to authenticated
using (public.current_user_role() in ('dona', 'admin'))
with check (public.current_user_role() in ('dona', 'admin'));

drop policy if exists produtos_select_public on public.produtos;
create policy produtos_select_public on public.produtos
for select to anon, authenticated using (true);

drop policy if exists produtos_insert_staff on public.produtos;
create policy produtos_insert_staff on public.produtos
for insert to authenticated
with check (public.current_user_role() in ('funcionario', 'dona', 'admin'));

drop policy if exists produtos_update_staff on public.produtos;
create policy produtos_update_staff on public.produtos
for update to authenticated
using (public.current_user_role() in ('funcionario', 'dona', 'admin'))
with check (public.current_user_role() in ('funcionario', 'dona', 'admin'));

drop policy if exists produtos_delete_staff on public.produtos;
create policy produtos_delete_staff on public.produtos
for delete to authenticated
using (public.current_user_role() in ('funcionario', 'dona', 'admin'));

create or replace function public.prevent_staff_stock_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'funcionario' and new.estoque is distinct from old.estoque then
    raise exception 'Funcionarios nao podem alterar estoque';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_product_stock on public.produtos;
create trigger protect_product_stock
before update on public.produtos
for each row execute function public.prevent_staff_stock_change();

drop policy if exists mensagens_select_authenticated on public.mensagens;
create policy mensagens_select_authenticated on public.mensagens
for select to anon, authenticated using (tipo_chat = 'geral' or auth.role() = 'authenticated');

drop policy if exists mensagens_insert_general on public.mensagens;
create policy mensagens_insert_general on public.mensagens
for insert to authenticated
with check (tipo_chat = 'geral' and usuario_id = auth.uid());

drop policy if exists mensagens_insert_vip_admin on public.mensagens;
create policy mensagens_insert_vip_admin on public.mensagens
for insert to authenticated
with check (tipo_chat = 'vip_noticias' and usuario_id = auth.uid() and public.current_user_role() in ('dona', 'admin'));
