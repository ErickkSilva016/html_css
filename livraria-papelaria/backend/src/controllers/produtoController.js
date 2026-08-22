const supabase = require('../config/supabase');

// Listar todos os produtos (pode filtrar por categoria: livro ou papelaria)
exports.listarProdutos = async (req, res) => {
  try {
    const { categoria } = req.query; // Permite filtrar com ?categoria=livro ou ?categoria=papelaria
    let query = supabase.from('produtos').select('*');

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
    const { data, error } = await supabase
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

// Criar produto ou combo (Ações do Admin/Dona/Funcionário)
exports.criarProduto = async (req, res) => {
  try {
    const { titulo, descricao, preco, categoria, genero, amostra_primeira_pagina, estoque, is_combo } = req.body;

    const { data, error } = await supabase
      .from('produtos')
      .insert([{ titulo, descricao, preco, categoria, genero, amostra_primeira_pagina, estoque, is_combo }])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Produto criado com sucesso!', produto: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};