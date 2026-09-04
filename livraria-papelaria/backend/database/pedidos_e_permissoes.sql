-- Migracao incremental #2: pedidos, itens de combo e permissoes mais
-- restritas para o cargo "funcionario". Execute depois de admin_permissions.sql
-- no SQL Editor do Supabase. Nao remove tabelas nem dados existentes.

-- =========================================================================
-- 1) PEDIDOS: agora existe um registro real de "quem pediu o que", que
--    faltava no sistema (o checkout so existia no carrinho local do front).
--    Isso viabiliza: (a) o chat "funcionario <-> quem pediu o produto",
--    (b) o campo foi_comprado das avaliacoes deixar de ser autodeclarado.
-- =========================================================================
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente','preparando','enviado','entregue','cancelado')),
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id),
  quantidade integer not null default 1 check (quantidade > 0),
  preco_unitario numeric not null default 0,
  personalizacao jsonb
);

create index if not exists pedidos_usuario_idx on public.pedidos (usuario_id, created_at desc);
create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);
create index if not exists pedido_itens_produto_idx on public.pedido_itens (produto_id);

alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

drop policy if exists pedidos_select on public.pedidos;
create policy pedidos_select on public.pedidos
for select to authenticated
using (usuario_id = auth.uid() or public.current_user_role() in ('funcionario','dona','admin'));

drop policy if exists pedidos_insert_owner on public.pedidos;
create policy pedidos_insert_owner on public.pedidos
for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists pedidos_update_staff on public.pedidos;
create policy pedidos_update_staff on public.pedidos
for update to authenticated
using (public.current_user_role() in ('dona','admin'))
with check (public.current_user_role() in ('dona','admin'));

drop policy if exists pedido_itens_select on public.pedido_itens;
create policy pedido_itens_select on public.pedido_itens
for select to authenticated
using (
  public.current_user_role() in ('funcionario','dona','admin')
  or exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid())
);

drop policy if exists pedido_itens_insert_owner on public.pedido_itens;
create policy pedido_itens_insert_owner on public.pedido_itens
for insert to authenticated
with check (exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid()));

-- =========================================================================
-- 2) COMBO_ITENS: define quais produtos compoem um kit/combo (ex: livro +
--    marcador + post-it + caneta), mantendo cada item comprável separado.
--    So a dona/admin mexe na composicao do combo (isso e estrutura de
--    produto, nao "promocao").
-- =========================================================================
create table if not exists public.combo_itens (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.produtos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id),
  quantidade integer not null default 1 check (quantidade > 0),
  unique (combo_id, produto_id)
);

alter table public.combo_itens enable row level security;

drop policy if exists combo_itens_select_public on public.combo_itens;
create policy combo_itens_select_public on public.combo_itens
for select to anon, authenticated using (true);

drop policy if exists combo_itens_write_owner on public.combo_itens;
create policy combo_itens_write_owner on public.combo_itens
for all to authenticated
using (public.current_user_role() in ('dona','admin'))
with check (public.current_user_role() in ('dona','admin'));

-- =========================================================================
-- 3) PERMISSOES DE PRODUTOS: reduz o funcionario a "so promocao", como a
--    cliente pediu. Antes ele podia criar/editar/apagar produto inteiro;
--    agora so dona/admin podem. O funcionario continua podendo mudar
--    apenas os campos de promocao via um trigger que bloqueia qualquer
--    outra alteracao (RLS de UPDATE nao consegue restringir por coluna
--    sozinha, entao o trigger cobre essa parte).
-- =========================================================================
drop policy if exists produtos_insert_staff on public.produtos;
create policy produtos_insert_owner on public.produtos
for insert to authenticated
with check (public.current_user_role() in ('dona','admin'));

drop policy if exists produtos_update_staff on public.produtos;
create policy produtos_update_staff on public.produtos
for update to authenticated
using (public.current_user_role() in ('funcionario','dona','admin'))
with check (public.current_user_role() in ('funcionario','dona','admin'));

drop policy if exists produtos_delete_staff on public.produtos;
create policy produtos_delete_owner on public.produtos
for delete to authenticated
using (public.current_user_role() in ('dona','admin'));

create or replace function public.prevent_staff_full_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'funcionario' then
    if new.estoque is distinct from old.estoque then
      raise exception 'Funcionarios nao podem alterar estoque';
    end if;
    if new.titulo is distinct from old.titulo
      or new.descricao is distinct from old.descricao
      or new.preco is distinct from old.preco
      or new.categoria is distinct from old.categoria
      or new.genero is distinct from old.genero
      or new.is_combo is distinct from old.is_combo
      or new.imagem is distinct from old.imagem
      or new.amostra_primeira_pagina is distinct from old.amostra_primeira_pagina then
      raise exception 'Funcionarios so podem alterar promocao e preco_antigo';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_product_stock on public.produtos;
drop trigger if exists protect_product_full_edit on public.produtos;
create trigger protect_product_full_edit
before update on public.produtos
for each row execute function public.prevent_staff_full_edit();

-- =========================================================================
-- 4) CHAT DE PEDIDO: funcionario conversa com quem pediu o produto para
--    entender a necessidade do cliente. Reaproveita a tabela "mensagens"
--    com tipo_chat = 'pedido' + pedido_id.
-- =========================================================================
alter table public.mensagens add column if not exists pedido_id uuid references public.pedidos(id) on delete cascade;

drop policy if exists mensagens_select_authenticated on public.mensagens;
create policy mensagens_select_authenticated on public.mensagens
for select to anon, authenticated
using (
  tipo_chat = 'geral'
  or (tipo_chat = 'vip_noticias' and auth.role() = 'authenticated')
  or (tipo_chat = 'pedido' and (
    public.current_user_role() in ('funcionario','dona','admin')
    or exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid())
  ))
);

drop policy if exists mensagens_insert_pedido on public.mensagens;
create policy mensagens_insert_pedido on public.mensagens
for insert to authenticated
with check (
  tipo_chat = 'pedido' and usuario_id = auth.uid() and pedido_id is not null and (
    public.current_user_role() in ('funcionario','dona','admin')
    or exists (select 1 from public.pedidos p where p.id = pedido_id and p.usuario_id = auth.uid())
  )
);

-- Moderacao do chat livre e do chat de avaliacoes: so dona/admin apagam
-- (o funcionario nao tem essa permissao no briefing da cliente).
drop policy if exists mensagens_delete_owner on public.mensagens;
create policy mensagens_delete_owner on public.mensagens
for delete to authenticated
using (public.current_user_role() in ('dona','admin'));

alter table public.avaliacoes enable row level security;
drop policy if exists avaliacoes_select_public on public.avaliacoes;
create policy avaliacoes_select_public on public.avaliacoes
for select to anon, authenticated using (true);

drop policy if exists avaliacoes_insert_owner on public.avaliacoes;
create policy avaliacoes_insert_owner on public.avaliacoes
for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists avaliacoes_delete_owner on public.avaliacoes;
create policy avaliacoes_delete_owner on public.avaliacoes
for delete to authenticated
using (public.current_user_role() in ('dona','admin'));

-- =========================================================================
-- 5) DIARIO DE LEITURA: alem de privado/publico, agora da pra publicar so
--    alguns trechos especificos do diario (privacidade = 'parcial').
-- =========================================================================
alter table public.diario_leitura add column if not exists trechos jsonb not null default '[]'::jsonb;
-- formato de "trechos": [{ "texto": "...", "publico": true|false }, ...]

alter table public.diario_leitura enable row level security;
drop policy if exists diario_select on public.diario_leitura;
create policy diario_select on public.diario_leitura
for select to anon, authenticated
using (usuario_id = auth.uid() or privacidade in ('publico','parcial'));

drop policy if exists diario_insert_owner on public.diario_leitura;
create policy diario_insert_owner on public.diario_leitura
for insert to authenticated
with check (usuario_id = auth.uid());

drop policy if exists diario_update_owner on public.diario_leitura;
create policy diario_update_owner on public.diario_leitura
for update to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());
