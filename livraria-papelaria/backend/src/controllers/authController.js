const supabase = require('../config/supabase');

// Cadastro de novos usuários
exports.cadastrar = async (req, res) => {
  try {
    const { email, password, nome, tipo_usuario, plano_vip } = req.body;

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // 2. Criar o perfil do usuário na tabela 'profiles'
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          nome,
          tipo_usuario: tipo_usuario || 'cliente', // 'cliente', 'funcionario', 'dona'
          plano_vip: plano_vip || 'nenhum',         // 'nenhum', 'basico', 'medio', 'avancado'
        },
      ]);

    if (profileError) throw profileError;

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: authData.user,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Login de usuários
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Buscar o perfil completo (para saber se é dono, funcionário ou vip)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      session: data.session,
      perfil: profile,
    });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

// Buscar perfil do usuário logado
exports.obterPerfil = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(404).json({ error: 'Perfil não encontrado' });
  }
};