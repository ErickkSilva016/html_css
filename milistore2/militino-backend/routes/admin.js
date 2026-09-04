const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAdmin } = require("../middleware/auth");

// GET /api/admin/dashboard.php
router.get("/admin/dashboard.php", requireAdmin, (req, res) => {
  const totalProdutos = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  const totalClientes = db.prepare("SELECT COUNT(*) AS n FROM users WHERE is_admin = 0").get().n;
  const totalPedidos = db.prepare("SELECT COUNT(*) AS n FROM orders").get().n;
  const receita = db.prepare("SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE status != 'cancelado'").get().s;

  res.json({ totalProdutos, totalPedidos, totalClientes, receita });
});

// GET /api/admin/orders.php  (todos os pedidos, com dados do cliente)
router.get("/admin/orders.php", requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT o.id, o.total, o.metodo_pagamento AS pagamento, o.status, o.criado_em AS data,
           u.nome AS cliente
    FROM orders o JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `).all();
  res.json(rows);
});

// PUT /api/admin/orders/status.php?id=  { status }
router.put("/admin/orders/status.php", requireAdmin, (req, res) => {
  const { status } = req.body;
  const validos = ["aguardando", "pago", "separacao", "enviado", "entregue", "cancelado"];
  if (!validos.includes(status)) {
    return res.status(400).json({ success: false, message: `Status inválido. Use um de: ${validos.join(", ")}` });
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.query.id);
  res.json({ success: true });
});

// GET /api/admin/customers.php
router.get("/admin/customers.php", requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.nome, u.email, u.criado_em AS cadastro,
           COUNT(o.id) AS pedidos, COALESCE(SUM(o.total), 0) AS total
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelado'
    WHERE u.is_admin = 0
    GROUP BY u.id
    ORDER BY u.id DESC
  `).all();
  res.json(rows);
});

module.exports = router;
