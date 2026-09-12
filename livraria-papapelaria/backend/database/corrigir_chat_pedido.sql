-- Corrige o bug real do envio de mensagens do pedido.
--
-- Causa raiz: a tabela public.mensagens já existia (de antes das migrations
-- admin_permissions.sql / pedidos_e_permissoes.sql) com um CHECK CONSTRAINT
-- em tipo_chat que só permitia 'geral' e 'vip_noticias'. Quando o chat de
-- pedido foi adicionado, pedidos_e_permissoes.sql criou as políticas de RLS
-- para tipo_chat = 'pedido', mas NUNCA atualizou esse check constraint
-- antigo. Resultado: todo INSERT com tipo_chat = 'pedido' passava pela
-- validação da API e pela RLS, e só então era rejeitado pelo Postgres com
-- "new row for relation mensagens violates check constraint ...".
--
-- Isso explica exatamente o sintoma relatado: o cliente/funcionário chega
-- até a área de mensagens, digita e clica em enviar, mas a mensagem nunca é
-- salva quando o chat é de um pedido (chat geral e VIP continuavam
-- funcionando normalmente, porque já estavam na lista antiga do check).
--
-- Este script é seguro para rodar mais de uma vez e não apaga nenhuma
-- mensagem existente — ele só substitui a regra de validação da coluna.

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.mensagens'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tipo_chat%';

  if constraint_name is not null then
    execute format('alter table public.mensagens drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.mensagens
  add constraint mensagens_tipo_chat_check
  check (tipo_chat in ('geral', 'vip_noticias', 'pedido'));
