const supabase = require('../config/supabase');
const supabaseAdmin = supabase.supabaseAdmin;

function ownerOnly(req, res) {
  if (!['dona', 'admin'].includes(req.profile.tipo_usuario)) {
    res.status(403).json({ error: 'Apenas a dona ou administradora pode executar esta operação.' });
    return false;
  }
  return true;
}

exports.dashboard = async (req, res) => {
  try {
    const tables = ['produtos', 'mensagens', 'avaliacoes'];
    const counts = await Promise.all(tables.map(async table => {
      const { count, error } = await req.supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }));
    const result = { produtos: counts[0], mensagens: counts[1], avaliacoes: counts[2] };
    if (['dona', 'admin'].includes(req.profile.tipo_usuario)) {
      const { data: products, error } = await req.supabase.from('produtos').select('estoque');
      if (error) throw error;
      result.sem_estoque = products.filter(item => Number(item.estoque) === 0).length;
      result.estoque_baixo = products.filter(item => Number(item.estoque) > 0 && Number(item.estoque) <= 5).length;
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.listarProdutos = async (req, res) => {
  const fields = ['dona', 'admin'].includes(req.profile.tipo_usuario) ? '*' : 'id, titulo, descricao, preco, categoria, genero, amostra_primeira_pagina, is_combo, imagem, promocao, preco_antigo';
  const { data, error } = await req.supabase.from('produtos').select(fields).order('titulo');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
};

exports.atualizarEstoque = async (req, res) => {
  if (!ownerOnly(req, res)) return;
  const estoque = Number(req.body.estoque);
  if (!Number.isInteger(estoque) || estoque < 0) return res.status(400).json({ error: 'O estoque deve ser um número inteiro maior ou igual a zero.' });
  const { data, error } = await req.supabase.from('produtos').update({ estoque }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Estoque atualizado com sucesso!', produto: data });
};

exports.listarFuncionarios = async (req, res) => {
  if (!ownerOnly(req, res)) return;
  const { data, error } = await req.supabase.from('profiles').select('id, nome, email, tipo_usuario, plano_vip').in('tipo_usuario', ['funcionario', 'dona', 'admin']).order('nome');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
};

exports.criarFuncionario = async (req, res) => {
  if (!ownerOnly(req, res)) return;
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não está configurada no backend.' });
  const { email, password, nome, tipo_usuario = 'funcionario' } = req.body;
  if (!email || !password || !nome || !['funcionario', 'dona', 'admin'].includes(tipo_usuario)) return res.status(400).json({ error: 'Informe email, senha, nome e uma permissão válida.' });
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
    if (authError) throw authError;
    const { data, error } = await supabaseAdmin.from('profiles').insert([{ id: authData.user.id, email, nome, tipo_usuario, plano_vip: 'nenhum' }]).select().single();
    if (error) throw error;
    return res.status(201).json({ message: 'Funcionário criado com sucesso!', funcionario: data });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.alterarPermissao = async (req, res) => {
  if (!ownerOnly(req, res)) return;
  if (req.params.id === req.user.id) return res.status(403).json({ error: 'Você não pode alterar a própria permissão.' });
  const { tipo_usuario } = req.body;
  if (!['cliente', 'funcionario', 'dona', 'admin'].includes(tipo_usuario)) return res.status(400).json({ error: 'Permissão inválida.' });
  const { data, error } = await req.supabase.from('profiles').update({ tipo_usuario }).eq('id', req.params.id).select('id, nome, email, tipo_usuario').single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Permissão atualizada com sucesso!', usuario: data });
};

exports.removerFuncionario = async (req, res) => {
  if (!ownerOnly(req, res)) return;
  if (req.params.id === req.user.id) return res.status(403).json({ error: 'Você não pode remover a própria conta.' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não está configurada no backend.' });
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: 'Funcionário removido com sucesso!' });
};

exports.enviarNoticiaVip = async (req, res) => {
  if (!ownerOnly(req, res)) return;
  const { conteudo } = req.body;
  if (!conteudo || !String(conteudo).trim()) return res.status(400).json({ error: 'A mensagem não pode ficar vazia.' });
  const { data, error } = await req.supabase.from('mensagens').insert([{ usuario_id: req.user.id, conteudo: String(conteudo).trim(), tipo_chat: 'vip_noticias' }]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: 'Notícia VIP enviada!', mensagem: data });
};