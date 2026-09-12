-- Migracao incremental #3: forma de pagamento do pedido (debito/credito/pix).
-- Execute no SQL Editor do Supabase depois de admin_permissions.sql e
-- pedidos_e_permissoes.sql. Nao remove tabelas nem dados existentes.
--
-- O pagamento continua ficticio (sem gateway real). Este campo apenas
-- registra qual opcao o cliente escolheu na nova etapa de pagamento do
-- checkout, para a dona/funcionario verem no pedido.

alter table public.pedidos
  add column if not exists forma_pagamento text
  check (forma_pagamento is null or forma_pagamento in ('debito', 'credito', 'pix'));

-- Pedidos antigos ficam com forma_pagamento = null e continuam funcionando
-- normalmente; nenhuma linha existente e alterada por este comando.
