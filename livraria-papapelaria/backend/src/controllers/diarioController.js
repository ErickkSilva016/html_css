// Criar uma nova anotação no diário
// trechos (opcional): [{ texto, publico: true|false }] — usado quando
// privacidade = 'parcial', pra escolher exatamente o que fica público.
exports.criarAnotacao = async (req, res) => {
  try {
    const { livro_titulo, data_inicio, data_fim, anotacoes, privacidade, trechos } = req.body;
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
          trechos: Array.isArray(trechos) ? trechos.map(t => ({ texto: String(t.texto || ''), publico: Boolean(t.publico) })) : [],
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Anotação criada com sucesso!', diario: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Editar uma anotação (inclusive mudar a visibilidade ou os trechos).
exports.editarAnotacao = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['livro_titulo', 'data_inicio', 'data_fim', 'anotacoes', 'privacidade', 'trechos'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && value !== undefined));
    if (updates.trechos) updates.trechos = updates.trechos.map(t => ({ texto: String(t.texto || ''), publico: Boolean(t.publico) }));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo válido foi informado.' });

    // RLS garante que só o dono da anotação consegue de fato atualizar.
    const { data, error } = await req.supabase.from('diario_leitura').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.status(200).json({ message: 'Anotação atualizada com sucesso!', diario: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar o diário de um usuário específico (o próprio usuário vê tudo;
// qualquer outra pessoa só vê o que é público/parcial — a RLS filtra as
// linhas, e aqui a gente ainda esconde os trechos privados de quem for
// 'parcial' e não for o dono).
exports.listarDiarioDoUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.params;

    const { data, error } = await req.supabase
      .from('diario_leitura')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const souDono = req.user && req.user.id === usuario_id;
    const resultado = souDono ? data : data.map(filtrarTrechosPublicos);

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar todas as anotações públicas/parciais da comunidade (sempre
// escondendo os trechos privados de quem escolheu 'parcial').
exports.listarDiariosPublicos = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('diario_leitura')
      .select('*, profiles(nome)')
      .in('privacidade', ['publico', 'parcial'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data.map(filtrarTrechosPublicos));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Se a anotação é 'parcial', só devolve os trechos marcados como públicos
// (e não o texto livre de "anotacoes", que continua privado nesse caso).
function filtrarTrechosPublicos(entrada) {
  if (entrada.privacidade === 'parcial') {
    return {
      ...entrada,
      anotacoes: null,
      trechos: (entrada.trechos || []).filter(t => t.publico),
    };
  }
  return entrada;
}
