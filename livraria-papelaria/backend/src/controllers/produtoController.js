// Listar todos os produtos (pode filtrar por categoria: livro ou papelaria)
exports.listarProdutos = async (req, res) => {
  try {
    const { categoria } = req.query; // Permite filtrar com ?categoria=livro ou ?categoria=papelaria
    let query = req.supabase.from('produtos').select('*');

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Buscar um único produto pelo ID (com a amostra da 1ª página)
exports.buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await req.supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Produto não encontrado' });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Criar produto ou combo. Funcionários não controlam o estoque.
exports.criarProduto = async (req, res) => {
  try {
    const { titulo, descricao, preco, categoria, genero, amostra_primeira_pagina, is_combo, imagem, promocao, preco_antigo } = req.body;
    const isOwner = ['dona', 'admin'].includes(req.profile.tipo_usuario);
    const produto = { titulo, descricao, preco, categoria, genero, amostra_primeira_pagina, is_combo, imagem, promocao, preco_antigo };
    if (isOwner) produto.estoque = Number(req.body.estoque || 0);

    const { data, error } = await req.supabase
      .from('produtos')
      .insert([produto])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Produto criado com sucesso!', produto: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.editarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['titulo', 'descricao', 'preco', 'categoria', 'genero', 'amostra_primeira_pagina', 'is_combo', 'imagem', 'promocao', 'preco_antigo'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => allowedFields.includes(key) && value !== undefined));
    if (['dona', 'admin'].includes(req.profile.tipo_usuario) && req.body.estoque !== undefined) {
      updates.estoque = Number(req.body.estoque);
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo válido foi informado.' });

    const { data, error } = await req.supabase.from('produtos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json({ message: 'Produto atualizado com sucesso!', produto: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.removerProduto = async (req, res) => {
  try {
    const { error } = await req.supabase.from('produtos').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ message: 'Produto removido com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
