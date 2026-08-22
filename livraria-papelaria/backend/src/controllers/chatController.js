const supabase = require('../config/supabase');

// Enviar mensagem (Chat Geral ou Canal VIP)
exports.enviarMensagem = async (req, res) => {
  try {
    const { usuario_id, conteudo, tipo_chat } = req.body;

    // Se for notícias VIP, verifica se o usuário é a Dona
    if (tipo_chat === 'vip_noticias') {
      const { data: perfil } = await supabase
        .from('profiles')
        .select('tipo_usuario')
        .eq('id', usuario_id)
        .single();

      if (!perfil || perfil.tipo_usuario !== 'dona') {
        return res.status(403).json({ error: 'Apenas a dona pode enviar notícias no canal VIP!' });
      }
    }

    const { data, error } = await supabase
      .from('mensagens')
      .insert([{ usuario_id, conteudo, tipo_chat: tipo_chat || 'geral' }])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Mensagem enviada!', mensagem: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar mensagens por canal ('geral' ou 'vip_noticias')
exports.listarMensagens = async (req, res) => {
  try {
    const { tipo_chat } = req.params;

    const { data, error } = await supabase
      .from('mensagens')
      .select('*, profiles(nome, tipo_usuario)')
      .eq('tipo_chat', tipo_chat)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};