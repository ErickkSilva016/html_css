const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");

function validaCPF(cpf) {
  if (!cpf) return true; // CPF é opcional neste projeto de demonstração
  cpf = String(cpf).replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nome: user.nome, is_admin: !!user.is_admin },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register.php
router.post("/auth/register.php", (req, res) => {
  const { nome, email, senha, cpf, telefone, nascimento, endereco } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ success: false, message: "Nome, e-mail e senha são obrigatórios." });
  }
  if (senha.length < 6) {
    return res.status(400).json({ success: false, message: "A senha deve ter pelo menos 6 caracteres." });
  }
  if (cpf && !validaCPF(cpf)) {
    return res.status(400).json({ success: false, message: "CPF inválido." });
  }

  const jaExiste = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (jaExiste) {
    return res.status(409).json({ success: false, message: "Já existe uma conta com esse e-mail." });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);
  const info = db.prepare(`
    INSERT INTO users (nome, email, senha_hash, cpf, telefone, nascimento, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(nome, email, senhaHash, cpf || null, telefone || null, nascimento || null);

  if (endereco && (endereco.rua || endereco.cep)) {
    db.prepare(`
      INSERT INTO addresses (user_id, cep, rua, numero, complemento, bairro, cidade, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(info.lastInsertRowid, endereco.cep, endereco.rua, endereco.numero, endereco.complemento, endereco.bairro, endereco.cidade, endereco.estado);
  }

  const user = { id: info.lastInsertRowid, nome, email, is_admin: 0 };
  const token = signToken(user);
  res.status(201).json({ success: true, token, user: { id: user.id, nome, email } });
});

// POST /api/auth/login.php
router.post("/auth/login.php", (req, res) => {
  const { email, password, senha } = req.body;
  const pwd = password || senha; // aceita os dois nomes de campo

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(pwd || "", user.senha_hash)) {
    return res.status(401).json({ success: false, message: "E-mail ou senha inválidos." });
  }

  const token = signToken(user);
  res.json({
    success: true,
    token,
    user: { id: user.id, nome: user.nome, email: user.email, is_admin: !!user.is_admin }
  });
});

// POST /api/auth/logout.php
// Com JWT não há sessão no servidor para destruir; o front-end apenas
// descarta o token guardado. Mantemos a rota por compatibilidade.
router.post("/auth/logout.php", (req, res) => {
  res.json({ success: true });
});

// GET /api/auth/me.php  (dados do usuário logado, útil pra restaurar a sessão)
router.get("/auth/me.php", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, nome, email, cpf, telefone, nascimento, is_admin FROM users WHERE id = ?").get(req.user.id);
  const endereco = db.prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1").get(req.user.id);
  res.json({ success: true, user: { ...user, is_admin: !!user.is_admin, endereco: endereco || null } });
});

module.exports = router;
