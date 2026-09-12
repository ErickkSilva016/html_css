// Pedidos: faltava um registro real de "quem pediu o que". Isso viabiliza
// (a) o funcionário conversar com quem pediu o produto, e (b) o campo
// foi_comprado das avaliações deixar de ser autodeclarado pelo cliente.

// Formas de pagamento aceitas na nova etapa de pagamento (fictícia, sem
// gateway real). Mantido em array pra validar sem depender só do check
// constraint do banco.
const FORMAS_PAGAMENTO_VALIDAS = ['debito', 'credito', 'pix'];

// Cliente cria um pedido a partir do carrinho.
// body: { itens: [{ produto_id, quantidade, personalizacao? }], forma_pagamento? }
exports.criarPedido = async (req, res) => {
  try {
    const usuario_id = req.user.id; // nunca confia no body pra isso
    const itensBody = Array.isArray(req.body.itens) ? req.body.itens : [];
    if (!itensBody.length) return res.status(400).json({ error: 'O pedido precisa ter ao menos um item.' });

    // Forma de pagamento é opcional (compatibilidade com fluxos antigos),
    // mas se vier, precisa ser um dos valores aceitos.
    const { forma_pagamento } = req.body;
    if (forma_pagamento !== undefined && forma_pagamento !== null && !FORMAS_PAGAMENTO_VALIDAS.includes(forma_pagamento)) {
      return res.status(400).json({ error: 'Forma de pagamento inválida. Use "debito", "credito" ou "pix".' });
    }

    const produtoIds = [...new Set(itensBody.map(item => item.produto_id).filter(Boolean))];
    const { data: produtos, error: produtosError } = await req.supabase
      .from('produtos')
      .select('id, preco')
      .in('id', produtoIds);
    if (produtosError) throw produtosError;

    const precoPorId = Object.fromEntries(produtos.map(p => [p.id, Number(p.preco) || 0]));
    const itensValidos = itensBody.filter(item => item.produto_id && precoPorId[item.produto_id] !== undefined);
    if (!itensValidos.length) return res.status(400).json({ error: 'Nenhum item do pedido corresponde a um produto válido.' });

    const total = itensValidos.reduce((soma, item) => soma + precoPorId[item.produto_id] * Number(item.quantidade || 1), 0);

    const novoPedido = { usuario_id, total };
    if (forma_pagamento) novoPedido.forma_pagamento = forma_pagamento;

    const { data: pedido, error: pedidoError } = await req.supabase
      .from('pedidos')
      .insert([novoPedido])
      .select()
      .single();
    if (pedidoError) throw pedidoError;

    const linhas = itensValidos.map(item => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: Number(item.quantidade || 1),
      preco_unitario: precoPorId[item.produto_id],
      personalizacao: item.personalizacao || null,
    }));
    const { error: itensError } = await req.supabase.from('pedido_itens').insert(linhas);
    if (itensError) throw itensError;

    return res.status(201).json({ message: 'Pedido criado com sucesso!', pedido: { ...pedido, itens: linhas } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Cliente vê os próprios pedidos.
exports.listarMeusPedidos = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('pedidos')
      .select('*, pedido_itens(*, produtos(titulo, imagem))')
      .eq('usuario_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Funcionário/dona/admin veem todos os pedidos — é assim que o
// funcionário sabe quem pediu o quê pra poder conversar sobre o pedido.
exports.listarPedidos = async (req, res) => {
  try {
    const { status } = req.query;
    let query = req.supabase
      .from('pedidos')
      .select('*, profiles(nome, email), pedido_itens(*, produtos(titulo))')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Atualizar status do pedido: só dona/admin (ver pedidoRoutes.js).
exports.atualizarStatusPedido = async (req, res) => {
  try {
    const { status } = req.body;
    const validos = ['pendente', 'preparando', 'enviado', 'entregue', 'cancelado'];
    if (!validos.includes(status)) return res.status(400).json({ error: 'Status inválido.' });

    const { data, error } = await req.supabase
      .from('pedidos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ message: 'Status do pedido atualizado!', pedido: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
