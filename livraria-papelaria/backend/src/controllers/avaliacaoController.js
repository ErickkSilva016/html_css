// Deixar uma avaliação no produto
exports.criarAvaliacao = async (req, res) => {
  try {
    const { produto_id, comentario, nota, foi_comprado } = req.body;
    // usuario_id vem do token (req.user), nunca do body: mesma lógica do diário.
    const usuario_id = req.user.id;

    const { data, error } = await req.supabase
      .from('avaliacoes')
      .insert([
        {
          produto_id,
          usuario_id,
          comentario,
          nota,
          foi_comprado: foi_comprado || false, // Separa compradores de não compradores
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Avaliação enviada com sucesso!', avaliacao: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar avaliações de um produto
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
