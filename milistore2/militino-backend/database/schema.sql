-- ============================================================
-- MILISTORE — SCHEMA DO BANCO DE DADOS (SQLite)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- USUÁRIOS ----------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  senha_hash    TEXT NOT NULL,
  cpf           TEXT UNIQUE,
  telefone      TEXT,
  nascimento    TEXT,
  is_admin      INTEGER NOT NULL DEFAULT 0,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- ENDEREÇOS ----------
CREATE TABLE IF NOT EXISTS addresses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cep           TEXT,
  rua           TEXT,
  numero        TEXT,
  complemento   TEXT,
  bairro        TEXT,
  cidade        TEXT,
  estado        TEXT
);

-- ---------- PRODUTOS ----------
CREATE TABLE IF NOT EXISTS products (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nome                TEXT NOT NULL,
  categoria           TEXT NOT NULL,          -- camiseta, camisa, calca, short, saia, vestido, jaqueta, moletom, tenis, sapato, acessorio
  publico             TEXT NOT NULL,          -- feminino, masculino, infantil
  estilo              TEXT,                   -- casual, social, esportivo, streetwear, basico, elegante, infantil
  preco               REAL NOT NULL,
  preco_promocional   REAL,
  tecido              TEXT,
  composicao          TEXT,
  modelagem           TEXT,
  lavagem             TEXT,
  origem              TEXT,
  estoque             INTEGER NOT NULL DEFAULT 0,
  avaliacao           REAL NOT NULL DEFAULT 0,
  num_avaliacoes      INTEGER NOT NULL DEFAULT 0,
  ativo               INTEGER NOT NULL DEFAULT 1,
  criado_em           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- IMAGENS DO PRODUTO (vários ângulos) ----------
CREATE TABLE IF NOT EXISTS product_images (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  ordem       INTEGER NOT NULL DEFAULT 0
);

-- ---------- CORES DO PRODUTO ----------
CREATE TABLE IF NOT EXISTS product_colors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,       -- ex: "Dourado"
  hex         TEXT                 -- ex: "#C6A15B"
);

-- ---------- TAMANHOS / ESTOQUE POR VARIAÇÃO ----------
CREATE TABLE IF NOT EXISTS product_sizes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id        INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tamanho           TEXT NOT NULL,      -- PP, P, M, G, GG ou numeração de calçado
  estoque           INTEGER NOT NULL DEFAULT 0,
  estoque_baixo     INTEGER NOT NULL DEFAULT 0  -- 1 = exibir aviso de "últimas unidades"
);

-- ---------- FAVORITOS ----------
CREATE TABLE IF NOT EXISTS favorites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

-- ---------- CARRINHO ----------
CREATE TABLE IF NOT EXISTS cart_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tamanho     TEXT,
  cor         TEXT,
  quantidade  INTEGER NOT NULL DEFAULT 1,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- PEDIDOS ----------
CREATE TABLE IF NOT EXISTS orders (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subtotal            REAL NOT NULL,
  frete               REAL NOT NULL DEFAULT 0,
  desconto            REAL NOT NULL DEFAULT 0,
  total               REAL NOT NULL,
  metodo_pagamento    TEXT NOT NULL,     -- pix, credito, debito, boleto
  status              TEXT NOT NULL DEFAULT 'aguardando', -- aguardando, pago, separacao, enviado, entregue, cancelado
  endereco_entrega    TEXT,              -- JSON serializado
  pix_codigo          TEXT,
  pix_expira_em       TEXT,
  criado_em           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- ITENS DO PEDIDO ----------
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  nome        TEXT NOT NULL,
  imagem      TEXT,
  preco       REAL NOT NULL,
  tamanho     TEXT,
  cor         TEXT,
  quantidade  INTEGER NOT NULL DEFAULT 1
);

-- ---------- AVALIAÇÕES ----------
CREATE TABLE IF NOT EXISTS reviews (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nome_cliente TEXT NOT NULL,
  nota         INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT,
  tamanho      TEXT,
  verificada   INTEGER NOT NULL DEFAULT 0,   -- 1 = compra verificada
  criado_em    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_publico ON products(publico);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
