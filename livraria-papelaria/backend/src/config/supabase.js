const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client "anônimo": usado para operações públicas (sem usuário logado).
// Como ele não carrega nenhum JWT de usuário, toda policy de RLS que
// dependa de auth.uid() vai enxergar auth.uid() = null aqui.
const supabase = createClient(supabaseUrl, supabaseKey);

// Client "admin": ignora RLS (usa a service role key). Só deve ser usado
// para operações administrativas do próprio backend (ex: criar usuário no
// Auth durante o cadastro), nunca para ações feitas "em nome" do usuário.
const supabaseAdmin = supabaseServiceRoleKey
	? createClient(supabaseUrl, supabaseServiceRoleKey, {
			auth: { autoRefreshToken: false, persistSession: false },
		})
	: null;

// Cria um client Supabase "como o usuário": ele injeta o access_token do
// usuário em todas as chamadas ao PostgREST, então auth.uid() dentro das
// policies de RLS passa a corresponder ao usuário autenticado, e
// insert/update/select passam a respeitar as regras normalmente
// (sem precisar desligar RLS nem usar a service role key).
function criarClientDoUsuario(accessToken) {
	return createClient(supabaseUrl, supabaseKey, {
		global: { headers: { Authorization: `Bearer ${accessToken}` } },
		auth: { autoRefreshToken: false, persistSession: false },
	});
}

module.exports = supabase;
module.exports.supabaseAdmin = supabaseAdmin;
module.exports.criarClientDoUsuario = criarClientDoUsuario;
