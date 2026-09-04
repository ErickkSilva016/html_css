// Deixar uma avaliação no produto
exports.criarAvaliacao = async (req, res) => {
  try {
    const { produto_id, comentario, nota } = req.body;
    // usuario_id vem do token (req.user), nunca do body.
    const usuario_id = req.user.id;

    // foi_comprado não é mais confiado do cliente: verificamos se existe
    // pedido entregue desse usuário com esse produto. Assim a separação
    // "quem comprou" vs "quem não comprou" é real, não autodeclarada.
    const { data: pedidoItem, error: pedidoError } = await req.supabase
      .from('pedido_itens')
      .select('id, pedidos!inner(usuario_id, status)')
      .eq('produto_id', produto_id)
      .eq('pedidos.usuario_id', usuario_id)
      .eq('pedidos.status', 'entregue')
      .limit(1)
      .maybeSingle();
    if (pedidoError) throw pedidoError;
    const foi_comprado = Boolean(pedidoItem);

    const { data, error } = await req.supabase
      .from('avaliacoes')
      .insert([
        {
          produto_id,
          usuario_id,
          comentario,
          nota,
          foi_comprado,
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Avaliação enviada com sucesso!', avaliacao: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar avaliações de um produto (já separáveis por foi_comprado no front)
exports.listarAvaliacoesDoProduto = async (req, res) => {
  try {
    const { produto_id } = req.params;

    const { data, error } = await req.supabase
      .from('avaliacoes')
      .select('*, profiles(nome)')
      .eq('produto_id', produto_id);

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Moderação: apagar avaliação. Só dona/admin (mesmo critério do chat).
exports.removerAvaliacao = async (req, res) => {
  try {
    const { error } = await req.supabase.from('avaliacoes').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ message: 'Avaliação removida com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
