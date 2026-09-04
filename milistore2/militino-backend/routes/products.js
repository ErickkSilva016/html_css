const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireAdmin } = require("../middleware/auth");

// Monta o objeto "produto completo" (com imagens, cores e tamanhos)
// no MESMO formato que o front-end (MOCK_PRODUCTS) já espera.
function fullProduct(row) {
  const imagens = db.prepare("SELECT url FROM product_images WHERE product_id = ? ORDER BY ordem").all(row.id).map(r => r.url);
  const cores = db.prepare("SELECT nome, hex FROM product_colors WHERE product_id = ?").all(row.id);
  const tamanhosRows = db.prepare("SELECT tamanho, estoque, estoque_baixo FROM product_sizes WHERE product_id = ?").all(row.id);

  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    publico: row.publico,
    estilo: row.estilo,
    preco: row.preco,
    precoPromocional: row.preco_promocional,
    cor: cores.map(c => c.nome),
    coresDetalhe: cores, // [{ nome, hex }] — útil pro admin e pros swatches
    tamanhos: tamanhosRows.map(t => t.tamanho),
    estoqueBaixoTamanhos: tamanhosRows.filter(t => t.estoque_baixo).map(t => t.tamanho),
    estoquePorTamanho: tamanhosRows.reduce((acc, t) => { acc[t.tamanho] = t.estoque; return acc; }, {}),
    estoque: row.estoque,
    tecido: row.tecido,
    composicao: row.composicao,
    modelagem: row.modelagem,
    lavagem: row.lavagem,
    origem: row.origem,
    imagens,
    avaliacao: row.avaliacao,
    numAvaliacoes: row.num_avaliacoes,
    ativo: !!row.ativo
  };
}

// GET /api/products.php  (lista com filtros via query string)
router.get("/products.php", (req, res) => {
  const { publico, categoria, estilo, busca, precoMin, precoMax, ofertas } = req.query;

  let sql = "SELECT * FROM products WHERE ativo = 1";
  const params = [];

  if (publico) { sql += " AND publico = ?"; params.push(publico); }
  if (categoria) { sql += " AND categoria = ?"; params.push(categoria); }
  if (estilo) { sql += " AND estilo = ?"; params.push(estilo); }
  if (busca) { sql += " AND nome LIKE ?"; params.push(`%${busca}%`); }
  if (precoMin) { sql += " AND COALESCE(preco_promocional, preco) >= ?"; params.push(Number(precoMin)); }
  if (precoMax) { sql += " AND COALESCE(preco_promocional, preco) <= ?"; params.push(Number(precoMax)); }
  if (ofertas === "1" || ofertas === "true") { sql += " AND preco_promocional IS NOT NULL"; }

  const rows = db.prepare(sql).all(...params);
  let produtos = rows.map(fullProduct);

  // Filtros de tamanho e cor são feitos em memória (dependem de tabelas relacionadas)
  if (req.query.tamanho) {
    const tamanhos = [].concat(req.query.tamanho);
    produtos = produtos.filter(p => p.tamanhos.some(t => tamanhos.includes(t)));
  }
  if (req.query.cor) {
    const cores = [].concat(req.query.cor);
    produtos = produtos.filter(p => p.cor.some(c => cores.includes(c)));
  }

  res.json(produtos);
});

// GET /api/product.php?id=
router.get("/product.php", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.query.id);
  if (!row) return res.status(404).json({ success: false, message: "Produto não encontrado." });
  res.json(fullProduct(row));
});

// POST /api/products/create.php  (admin)
router.post("/products/create.php", requireAdmin, (req, res) => {
  const p = req.body;
  if (!p.nome || !p.categoria || !p.publico || p.preco == null) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios: nome, categoria, publico, preco." });
  }

  const info = db.prepare(`
    INSERT INTO products (nome, categoria, publico, estilo, preco, preco_promocional, tecido,
      composicao, modelagem, lavagem, origem, estoque, avaliacao, num_avaliacoes)
    VALUES (@nome, @categoria, @publico, @estilo, @preco, @precoPromocional, @tecido,
      @composicao, @modelagem, @lavagem, @origem, @estoque, 0, 0)
  `).run({
    nome: p.nome, categoria: p.categoria, publico: p.publico, estilo: p.estilo || null,
    preco: p.preco, precoPromocional: p.precoPromocional || null, tecido: p.tecido || null,
    composicao: p.composicao || null, modelagem: p.modelagem || null, lavagem: p.lavagem || null,
    origem: p.origem || null, estoque: p.estoque || 0
  });

  const productId = info.lastInsertRowid;

  (p.imagens || []).forEach((url, i) => {
    db.prepare("INSERT INTO product_images (product_id, url, ordem) VALUES (?, ?, ?)").run(productId, url, i);
  });
  (p.cor || []).forEach((nome) => {
    db.prepare("INSERT INTO product_colors (product_id, nome, hex) VALUES (?, ?, ?)").run(productId, nome, p.coresHex?.[nome] || "#CCCCCC");
  });
  (p.tamanhos || []).forEach((t) => {
    // aceita tanto ["P","M"] quanto [{tamanho:"P", estoque:10}]
    const tamanho = typeof t === "string" ? t : t.tamanho;
    const estoque = typeof t === "string" ? 0 : (t.estoque || 0);
    db.prepare("INSERT INTO product_sizes (product_id, tamanho, estoque, estoque_baixo) VALUES (?, ?, ?, ?)")
      .run(productId, tamanho, estoque, estoque > 0 && estoque <= 3 ? 1 : 0);
  });

  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(productId);
  res.status(201).json({ success: true, product: fullProduct(row) });
});

// PUT /api/products/update.php?id=  (admin)
router.put("/products/update.php", requireAdmin, (req, res) => {
  const id = req.query.id;
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  const p = { ...existing, ...req.body };
  db.prepare(`
    UPDATE products SET nome=?, categoria=?, publico=?, estilo=?, preco=?, preco_promocional=?,
      tecido=?, composicao=?, modelagem=?, lavagem=?, origem=?, estoque=?, ativo=?
    WHERE id=?
  `).run(
    p.nome, p.categoria, p.publico, p.estilo, p.preco, p.precoPromocional ?? p.preco_promocional ?? null,
    p.tecido, p.composicao, p.modelagem, p.lavagem, p.origem, p.estoque ?? existing.estoque,
    p.ativo === undefined ? existing.ativo : (p.ativo ? 1 : 0), id
  );

  // Se vierem imagens/cores/tamanhos novos, substitui os antigos por completo
  if (req.body.imagens) {
    db.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
    req.body.imagens.forEach((url, i) => {
      db.prepare("INSERT INTO product_images (product_id, url, ordem) VALUES (?, ?, ?)").run(id, url, i);
    });
  }
  if (req.body.cor) {
    db.prepare("DELETE FROM product_colors WHERE product_id = ?").run(id);
    req.body.cor.forEach((nome) => {
      db.prepare("INSERT INTO product_colors (product_id, nome, hex) VALUES (?, ?, ?)").run(id, nome, req.body.coresHex?.[nome] || "#CCCCCC");
    });
  }
  if (req.body.tamanhos) {
    db.prepare("DELETE FROM product_sizes WHERE product_id = ?").run(id);
    req.body.tamanhos.forEach((t) => {
      const tamanho = typeof t === "string" ? t : t.tamanho;
      const estoque = typeof t === "string" ? 0 : (t.estoque || 0);
      db.prepare("INSERT INTO product_sizes (product_id, tamanho, estoque, estoque_baixo) VALUES (?, ?, ?, ?)")
        .run(id, tamanho, estoque, estoque > 0 && estoque <= 3 ? 1 : 0);
    });
  }

  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  res.json({ success: true, product: fullProduct(row) });
});

// DELETE /api/products/delete.php?id=  (admin)
router.delete("/products/delete.php", requireAdmin, (req, res) => {
  const id = req.query.id;
  const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
  if (info.changes === 0) return res.status(404).json({ success: false, message: "Produto não encontrado." });
  res.json({ success: true });
});

// ---- VENDA CASADA / RECOMENDAÇÕES ----
// GET /api/products/recommendations.php?id=  -> peças parecidas (mesma categoria/estilo, cores próximas)
router.get("/products/recommendations.php", (req, res) => {
  const base = db.prepare("SELECT * FROM products WHERE id = ?").get(req.query.id);
  if (!base) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  const rows = db.prepare(`
    SELECT * FROM products
    WHERE id != ? AND ativo = 1 AND (categoria = ? OR estilo = ? OR publico = ?)
    ORDER BY (categoria = ?) DESC, (estilo = ?) DESC
    LIMIT 6
  `).all(base.id, base.categoria, base.estilo, base.publico, base.categoria, base.estilo);

  res.json(rows.map(fullProduct));
});

module.exports = router;
