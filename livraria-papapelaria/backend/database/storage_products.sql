-- Execute no SQL Editor do Supabase quando quiser preparar o armazenamento de capas/imagens.
-- O backend também tenta criar este bucket automaticamente com a service role.
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = excluded.public;
