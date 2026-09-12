-- Migracao incremental #4: permitir "remover" produtos que já foram
-- vendidos, sem quebrar o histórico de pedidos.
--
-- Hoje, apagar um produto que já apareceu em algum pedido falha com:
-- "violates foreign key constraint pedido_itens_produto_id_fkey"
-- Isso é o Postgres corretamente impedindo que a gente apague um produto
-- e deixe pedidos antigos com uma referência quebrada.
--
-- A solução (não destrutiva) é dar ao produto um campo "disponivel": ao
-- invés de apagar a linha do banco quando ela tem pedidos vinculados, o
-- backend marca disponivel = false. O produto some da loja (frontend
-- público passa a listar só disponivel = true) mas continua existindo
-- no banco, então pedidos antigos continuam funcionando normalmente.
--
-- Produtos sem nenhum pedido vinculado continuam podendo ser apagados de
-- verdade, sem alteração nesse comportamento.

alter table public.produtos
  add column if not exists disponivel boolean not null default true;

-- Nenhuma linha existente é apagada ou alterada além de receber o valor
-- padrão (disponivel = true), então todos os produtos já cadastrados
-- continuam aparecendo normalmente na loja depois desta migration.
