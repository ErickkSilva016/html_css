const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAuth } = require("../middleware/auth");

// GET /api/cart.php
router.get("/cart.php", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT ci.id, ci.product_id AS productId, ci.tamanho AS size, ci.cor AS color, ci.quantidade AS qty,
           p.nome, p.preco, p.preco_promocional
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  const items = rows.map(r => {
    const imagem = db.prepare("SELECT url FROM product_images WHERE product_id = ? ORDER BY ordem LIMIT 1").get(r.productId);
    return {
      id: r.id,
      productId: r.productId,
      nome: r.nome,
      imagem: imagem?.url || "",
      preco: r.preco_promocional && r.preco_promocional < r.preco ? r.preco_promocional : r.preco,
      size: r.size,
      color: r.color,
      qty: r.qty
    };
  });
  res.json(items);
});

// POST /api/cart/add.php  { productId, size, color, qty }
router.post("/cart/add.php", requireAuth, (req, res) => {
  const { productId, size, color, qty = 1 } = req.body;

  const existing = db.prepare(`
    SELECT id, quantidade FROM cart_items WHERE user_id = ? AND product_id = ? AND tamanho IS ? AND cor IS ?
  `).get(req.user.id, productId, size || null, color || null);

  if (existing) {
    db.prepare("UPDATE cart_items SET quantidade = quantidade + ? WHERE id = ?").run(qty, existing.id);
  } else {
    db.prepare(`
      INSERT INTO cart_items (user_id, product_id, tamanho, cor, quantidade) VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, productId, size || null, color || null, qty);
  }
  res.json({ success: true });
});

// PUT /api/cart/update.php  { id, qty }
router.put("/cart/update.php", requireAuth, (req, res) => {
  const { id, qty } = req.body;
  db.prepare("UPDATE cart_items SET quantidade = ? WHERE id = ? AND user_id = ?").run(Math.max(1, qty), id, req.user.id);
  res.json({ success: true });
});

// DELETE /api/cart/remove.php  { id }
router.delete("/cart/remove.php", requireAuth, (req, res) => {
  const { id } = req.body;
  db.prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?").run(id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
