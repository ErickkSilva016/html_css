const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "troque-este-segredo-em-producao";

// Extrai e valida o token "Bearer xxx" do header Authorization.
// Se válido, popula req.user = { id, email, is_admin }.
function getUserFromRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Bloqueia a rota se não houver usuário autenticado.
function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Não autenticado. Faça login novamente." });
  }
  req.user = user;
  next();
}

// Bloqueia a rota se o usuário autenticado não for admin.
function requireAdmin(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Não autenticado." });
  }
  if (!user.is_admin) {
    return res.status(403).json({ success: false, message: "Acesso restrito ao administrador." });
  }
  req.user = user;
  next();
}

// Não bloqueia a rota, mas popula req.user se houver token válido
// (usado em rotas que funcionam para visitante e para logado, ex: favoritos).
function optionalAuth(req, res, next) {
  req.user = getUserFromRequest(req);
  next();
}

module.exports = { JWT_SECRET, requireAuth, requireAdmin, optionalAuth, getUserFromRequest };
