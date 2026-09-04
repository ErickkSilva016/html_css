const supabase = require('../config/supabase');
const { criarClientDoUsuario } = supabase;

function getBearerToken(req) {

  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function identificarUsuario(req, res, next) {
  const accessToken = getBearerToken(req);

  req.user = null;
  req.supabase = supabase;

  if (!accessToken) return next();

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) return next();

    req.user = data.user;
    req.supabase = criarClientDoUsuario(accessToken);

    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('id, nome, email, tipo_usuario, plano_vip')
      .eq('id', data.user.id)
      .single();

    if (profileError) return res.status(403).json({ error: 'Perfil de usuário não encontrado.' });
    req.profile = profile;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

function exigirAutenticacao(req, res, next) {
  if (!req.user || !req.profile) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  next();
}

function exigirPermissao(...roles) {
  return [exigirAutenticacao, (req, res, next) => {
    const role = String(req.profile?.tipo_usuario || '').toLowerCase();
    if (!roles.includes(role)) {
      return res.status(403).json({ error: 'Você não possui permissão para esta operação.' });
    }
    next();
  }];
}

module.exports = { identificarUsuario, exigirAutenticacao, exigirPermissao };