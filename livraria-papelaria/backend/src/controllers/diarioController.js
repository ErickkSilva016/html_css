// Criar uma nova anotação no diário
exports.criarAnotacao = async (req, res) => {
  try {
    const { livro_titulo, data_inicio, data_fim, anotacoes, privacidade } = req.body;
    // usuario_id vem do token (req.user), nunca do body: assim bate com
    // auth.uid() usado pela policy de RLS e ninguém consegue criar
    // anotação em nome de outra pessoa.
    const usuario_id = req.user.id;

    const { data, error } = await req.supabase
      .from('diario_leitura')
      .insert([
        {
          usuario_id,
          livro_titulo,
          data_inicio,
          data_fim,
          anotacoes,
          privacidade: privacidade || 'privado', // 'privado', 'publico', 'parcial'
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Anotação criada com sucesso!', diario: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar o diário de um usuário específico (Apenas o próprio usuário ou anotações públicas)
exports.listarDiarioDoUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await req.supabase
      .from('diario_leitura')
      .select('*')
      .eq('usuario_id', usuario_id);

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar todas as anotações públicas da comunidade
exports.listarDiariosPublicos = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('diario_leitura')
      .select('*, profiles(nome)')
      .in('privacidade', ['publico', 'parcial']);

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
