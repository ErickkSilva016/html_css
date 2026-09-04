const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

// GET /api/reviews.php?product_id=&nota=&verificada=&sort=
router.get("/reviews.php", (req, res) => {
  const { product_id, nota, verificada, sort } = req.query;
  if (!product_id) return res.status(400).json({ success: false, message: "product_id é obrigatório." });

  let sql = "SELECT * FROM reviews WHERE product_id = ?";
  const params = [product_id];

  if (nota) { sql += " AND nota = ?"; params.push(Number(nota)); }
  if (verificada === "1" || verificada === "true") { sql += " AND verificada = 1"; }

  sql += sort === "antigas" ? " ORDER BY criado_em ASC"
       : sort === "maior-nota" ? " ORDER BY nota DESC"
       : sort === "menor-nota" ? " ORDER BY nota ASC"
       : " ORDER BY criado_em DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({
    id: r.id,
    nome: r.nome_cliente,
    nota: r.nota,
    comentario: r.comentario,
    tamanho: r.tamanho,
    verificada: !!r.verificada,
    data: r.criado_em
  })));
});

// POST /api/reviews/create.php  { productId, nota, comentario, tamanho }
router.post("/reviews/create.php", requireAuth, (req, res) => {
  const { productId, nota, comentario, tamanho } = req.body;
  if (!productId || !nota) {
    return res.status(400).json({ success: false, message: "productId e nota são obrigatórios." });
  }

  const user = db.prepare("SELECT nome FROM users WHERE id = ?").get(req.user.id);

  // "Compra verificada" = o usuário já tem algum pedido contendo esse produto
  const comprou = db.prepare(`
    SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ? AND oi.product_id = ? LIMIT 1
  `).get(req.user.id, productId);

  const info = db.prepare(`
    INSERT INTO reviews (product_id, user_id, nome_cliente, nota, comentario, tamanho, verificada)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(productId, req.user.id, user.nome, nota, comentario || null, tamanho || null, comprou ? 1 : 0);

  // Atualiza a média e o contador de avaliações do produto
  const agg = db.prepare("SELECT AVG(nota) AS media, COUNT(*) AS total FROM reviews WHERE product_id = ?").get(productId);
  db.prepare("UPDATE products SET avaliacao = ?, num_avaliacoes = ? WHERE id = ?").run(
    Math.round(agg.media * 10) / 10, agg.total, productId
  );

  res.status(201).json({ success: true, id: info.lastInsertRowid });
});

module.exports = router;
