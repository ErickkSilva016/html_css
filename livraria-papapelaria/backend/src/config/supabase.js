const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// O processo pode ser iniciado pela raiz do projeto, por um painel de deploy
// ou diretamente dentro de backend. Por isso o .env é resolvido pelo local
// deste ficheiro, e não pelo process.cwd().
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Mantém compatibilidade com variáveis injetadas pelo ambiente de produção.
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY precisam estar configuradas no backend.');
}

// Client anônimo: usado para operações públicas e autenticação do cliente.
const supabase = createClient(supabaseUrl, supabaseKey);

// Client administrativo: ignora RLS e só deve ser usado no servidor para
// criar utilizadores e gerir imagens no Storage.
const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Client Supabase que executa consultas como o utilizador autenticado.
function criarClientDoUsuario(accessToken) {
  return createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
module.exports.criarClientDoUsuario = criarClientDoUsuario;
