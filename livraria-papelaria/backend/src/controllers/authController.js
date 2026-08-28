const supabase = require('../config/supabase');
const supabaseAdmin = supabase.supabaseAdmin;

// Cadastro de novos usuários
exports.cadastrar = async (req, res) => {
  try {
    const { email, password, nome, plano_vip } = req.body;

    if (!email || !password || !nome) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
    }

    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não configurada; cadastro não pode criar profiles com RLS ativo.');
      return res.status(500).json({ error: 'Cadastro temporariamente indisponível: configuração administrativa ausente.' });
    }

    // 1. Criar usuário no Supabase Auth com a operação administrativa do servidor
    // (isso precisa da service role porque ainda não existe usuário/sessão para autenticar)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 2. Criar o perfil do usuário na tabela 'profiles'
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          nome,
          tipo_usuario: 'cliente',
          plano_vip: plano_vip || 'nenhum',         // 'nenhum', 'basico', 'medio', 'avancado'
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    // 3. Já autentica o usuário recém-criado, para que o front-end receba uma
    // sessão (access_token) e consiga fazer operações que exigem login
    // (diário, avaliações, chat) logo após o cadastro, respeitando a RLS.
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      console.error('Usuário cadastrado, mas login automático falhou:', sessionError.message);
    }

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      user: authData.user,
      perfil: profile || null,
      session: sessionData?.session || null,
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
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

    const { data, error } = await req.supabase
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
