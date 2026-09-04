// Enviar mensagem (Chat Geral, Canal VIP ou Chat de um Pedido)
exports.enviarMensagem = async (req, res) => {
  try {
    const { conteudo, tipo_chat, pedido_id } = req.body;
    // usuario_id vem do token (req.user), nunca do body.
    const usuario_id = req.user.id;
    const canal = tipo_chat || 'geral';

    if (!conteudo || !String(conteudo).trim()) return res.status(400).json({ error: 'A mensagem não pode ficar vazia.' });

    // Notícias VIP: só a dona/admin coloca informação nesse canal.
    if (canal === 'vip_noticias' && !['dona', 'admin'].includes(req.profile.tipo_usuario)) {
      return res.status(403).json({ error: 'Apenas a dona pode enviar notícias no canal VIP!' });
    }

    // Chat de pedido: é aqui que o funcionário conversa com quem pediu o
    // produto, pra entender a necessidade do cliente. Só participam o
    // dono do pedido e a equipe (funcionário/dona/admin).
    if (canal === 'pedido') {
      if (!pedido_id) return res.status(400).json({ error: 'Informe o pedido_id para conversar sobre um pedido.' });
      const staff = ['funcionario', 'dona', 'admin'].includes(req.profile.tipo_usuario);
      if (!staff) {
        const { data: pedido, error: pedidoError } = await req.supabase.from('pedidos').select('id, usuario_id').eq('id', pedido_id).single();
        if (pedidoError || !pedido || pedido.usuario_id !== usuario_id) {
          return res.status(403).json({ error: 'Você só pode conversar sobre os seus próprios pedidos.' });
        }
      }
    }

    const payload = { usuario_id, conteudo: String(conteudo).trim(), tipo_chat: canal };
    if (canal === 'pedido') payload.pedido_id = pedido_id;

    const { data, error } = await req.supabase
      .from('mensagens')
      .insert([payload])
      .select();

    if (error) throw error;

    return res.status(201).json({ message: 'Mensagem enviada!', mensagem: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Listar mensagens de um canal ('geral', 'vip_noticias' ou 'pedido')
exports.listarMensagens = async (req, res) => {
  try {
    const { tipo_chat } = req.params;
    const { pedido_id } = req.query;

    if (tipo_chat === 'pedido') {
      if (!pedido_id) return res.status(400).json({ error: 'Informe ?pedido_id= para ver a conversa do pedido.' });
      const staff = req.profile && ['funcionario', 'dona', 'admin'].includes(req.profile.tipo_usuario);
      if (!staff) {
        if (!req.user) return res.status(401).json({ error: 'Autenticação necessária.' });
        const { data: pedido, error: pedidoError } = await req.supabase.from('pedidos').select('id, usuario_id').eq('id', pedido_id).single();
        if (pedidoError || !pedido || pedido.usuario_id !== req.user.id) {
          return res.status(403).json({ error: 'Você só pode ver a conversa dos seus próprios pedidos.' });
        }
      }
    }

    let query = req.supabase
      .from('mensagens')
      .select('*, profiles(nome, tipo_usuario)')
      .eq('tipo_chat', tipo_chat)
      .order('created_at', { ascending: true });
    if (tipo_chat === 'pedido') query = query.eq('pedido_id', pedido_id);

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Moderação do chat livre e do canal VIP: apagar mensagem. Só dona/admin
// (o funcionário não tem essa permissão no briefing da cliente — ele só
// adiciona promoção e conversa sobre pedidos).
exports.removerMensagem = async (req, res) => {
  try {
    const { error } = await req.supabase.from('mensagens').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.status(200).json({ message: 'Mensagem removida com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
