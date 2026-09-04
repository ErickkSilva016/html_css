const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");
const { generateFakePixCode } = require("../utils/pix");

// POST /api/orders/create.php
// body: { itens: [{productId, nome, imagem, preco, size, color, qty}], subtotal, desconto, frete, total, metodoPagamento, endereco }
router.post("/orders/create.php", requireAuth, (req, res) => {
  const { itens = [], subtotal = 0, desconto = 0, frete = 0, total = 0, metodoPagamento = "pix", endereco = null } = req.body;

  if (!itens.length) {
    return res.status(400).json({ success: false, message: "O carrinho está vazio." });
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, subtotal, frete, desconto, total, metodo_pagamento, status, endereco_entrega)
    VALUES (?, ?, ?, ?, ?, ?, 'aguardando', ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, nome, imagem, preco, tamanho, cor, quantidade)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const criarPedido = db.transaction(() => {
    const info = insertOrder.run(
      req.user.id, subtotal, frete, desconto, total, metodoPagamento,
      endereco ? JSON.stringify(endereco) : null
    );
    const orderId = info.lastInsertRowid;

    itens.forEach(item => {
      insertItem.run(orderId, item.productId, item.nome, item.imagem || null, item.preco, item.size || null, item.color || null, item.qty);
    });

    // Esvazia o carrinho do usuário após o pedido
    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);

    let pixCodigo = null, pixExpiraEm = null;
    if (metodoPagamento === "pix") {
      pixCodigo = generateFakePixCode(orderId, total);
      pixExpiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      db.prepare("UPDATE orders SET pix_codigo = ?, pix_expira_em = ? WHERE id = ?").run(pixCodigo, pixExpiraEm, orderId);
    }

    return { orderId, pixCodigo, pixExpiraEm };
  });

  const { orderId, pixCodigo, pixExpiraEm } = criarPedido();

  res.status(201).json({
    success: true,
    id: orderId,
    pix: metodoPagamento === "pix" ? { codigo: pixCodigo, expiraEm: pixExpiraEm } : null
  });
});

// GET /api/orders.php  (pedidos do usuário logado)
router.get("/orders.php", requireAuth, (req, res) => {
  const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC").all(req.user.id);
  const withItems = orders.map(o => ({
    ...o,
    itens: db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(o.id)
  }));
  res.json(withItems);
});

// GET /api/orders/status.php?id=  (consultar status/pagamento de um pedido específico)
router.get("/orders/status.php", requireAuth, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(req.query.id, req.user.id);
  if (!order) return res.status(404).json({ success: false, message: "Pedido não encontrado." });
  res.json(order);
});

module.exports = router;
