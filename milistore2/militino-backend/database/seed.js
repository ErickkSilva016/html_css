/* ============================================================
   SEED — popula o banco com os produtos de demonstração
   (os mesmos que já existiam no MOCK_PRODUCTS do script.js),
   um usuário admin e um cliente de teste.

   Rodar com: npm run seed
   (pode ser executado várias vezes: ele limpa e repopula as tabelas)
============================================================ */

const bcrypt = require("bcryptjs");
const db = require("./db");

// Paleta de cores da loja (nome -> hex). Inclui as cores pedidas pelo
// cliente (Branco creme, Dourado, Marrom claro, Cinza escuro) além das
// cores já usadas nos produtos de demonstração.
const COLOR_HEX = {
  "Preto": "#232323",
  "Branco": "#F5F3EE",
  "Branco creme": "#F3EBDD",
  "Marrom": "#7B5A3E",
  "Marrom claro": "#A9835F",
  "Bege": "#D9C7A8",
  "Azul": "#3A5A78",
  "Vinho": "#6E2A32",
  "Verde": "#4C6B4F",
  "Rosa": "#D8A6AE",
  "Cinza": "#8C8C86",
  "Cinza escuro": "#4A4A46",
  "Dourado": "#C6A15B"
};

const PRODUCTS = [
  {
    nome: "Camiseta Premium Essential", categoria: "camiseta", publico: "masculino",
    estilo: "basico", preco: 129.90, precoPromocional: 99.90,
    cores: ["Preto", "Branco", "Marrom"],
    tamanhos: [{ t: "P", estoque: 12 }, { t: "M", estoque: 14 }, { t: "G", estoque: 6 }, { t: "GG", estoque: 2, baixo: true }],
    estoque: 34, tecido: "Algodão Premium", composicao: "100% algodão", modelagem: "Regular Fit",
    lavagem: "Lavagem delicada até 30°C", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1622445275576-721325763afe?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.8, numAvaliacoes: 214
  },
  {
    nome: "Vestido Midi Elegance", categoria: "vestido", publico: "feminino",
    estilo: "elegante", preco: 289.90, precoPromocional: null,
    cores: ["Vinho", "Preto", "Bege"],
    tamanhos: [{ t: "PP", estoque: 2, baixo: true }, { t: "P", estoque: 6 }, { t: "M", estoque: 7 }, { t: "G", estoque: 3 }],
    estoque: 18, tecido: "Crepe premium", composicao: "95% poliéster, 5% elastano", modelagem: "Caimento fluido",
    lavagem: "Lavar à mão, água fria", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.9, numAvaliacoes: 132
  },
  {
    nome: "Calça Alfaiataria Slim", categoria: "calca", publico: "masculino",
    estilo: "social", preco: 249.90, precoPromocional: 199.90,
    cores: ["Preto", "Cinza escuro", "Azul"],
    tamanhos: [{ t: "P", estoque: 10 }, { t: "M", estoque: 15 }, { t: "G", estoque: 10 }, { t: "GG", estoque: 6 }],
    estoque: 41, tecido: "Oxford stretch", composicao: "68% poliéster, 30% viscose, 2% elastano", modelagem: "Slim Fit",
    lavagem: "Lavagem à máquina, ciclo delicado", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1602293589930-45821b90e414?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.6, numAvaliacoes: 98
  },
  {
    nome: "Jaqueta Corta-Vento Urban", categoria: "jaqueta", publico: "masculino",
    estilo: "streetwear", preco: 349.90, precoPromocional: 279.90,
    cores: ["Preto", "Verde", "Azul"],
    tamanhos: [{ t: "M", estoque: 5 }, { t: "G", estoque: 5 }, { t: "GG", estoque: 2, baixo: true }],
    estoque: 12, tecido: "Nylon impermeável", composicao: "100% nylon", modelagem: "Oversized",
    lavagem: "Lavagem à máquina, água fria", origem: "Importado",
    imagens: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512327202127-e3ef1a5b3f9c?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.7, numAvaliacoes: 76
  },
  {
    nome: "Saia Plissada Chic", categoria: "saia", publico: "feminino",
    estilo: "elegante", preco: 159.90, precoPromocional: null,
    cores: ["Bege", "Preto", "Rosa"],
    tamanhos: [{ t: "PP", estoque: 8 }, { t: "P", estoque: 10 }, { t: "M", estoque: 9 }],
    estoque: 27, tecido: "Tricoline plissada", composicao: "100% poliéster", modelagem: "Cintura alta",
    lavagem: "Lavagem delicada até 30°C", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a13d19?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583496661268-d8d6f7e0b8b6?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.5, numAvaliacoes: 61
  },
  {
    nome: "Moletom Oversized Comfort", categoria: "moletom", publico: "feminino",
    estilo: "streetwear", preco: 219.90, precoPromocional: 179.90,
    cores: ["Cinza escuro", "Bege", "Preto"],
    tamanhos: [{ t: "P", estoque: 3, baixo: true }, { t: "M", estoque: 12 }, { t: "G", estoque: 9 }, { t: "GG", estoque: 6 }],
    estoque: 30, tecido: "Moletom flanelado", composicao: "80% algodão, 20% poliéster", modelagem: "Oversized",
    lavagem: "Lavagem à máquina, água fria", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509866762874-a4d5e4fb61b6?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.8, numAvaliacoes: 189
  },
  {
    nome: "Tênis Runner Comfort", categoria: "tenis", publico: "masculino",
    estilo: "esportivo", preco: 399.90, precoPromocional: 329.90,
    cores: ["Branco", "Preto", "Azul"],
    tamanhos: [{ t: "38", estoque: 4 }, { t: "39", estoque: 5 }, { t: "40", estoque: 6 }, { t: "41", estoque: 4 }, { t: "42", estoque: 2 }, { t: "43", estoque: 1, baixo: true }],
    estoque: 22, tecido: "Cabedal em mesh respirável", composicao: "Solado em EVA", modelagem: "Numeração padrão BR",
    lavagem: "Limpar com pano úmido", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.7, numAvaliacoes: 302
  },
  {
    nome: "Sapato Social Couro Legítimo", categoria: "sapato", publico: "masculino",
    estilo: "social", preco: 459.90, precoPromocional: null,
    cores: ["Preto", "Marrom claro"],
    tamanhos: [{ t: "39", estoque: 1, baixo: true }, { t: "40", estoque: 4 }, { t: "41", estoque: 4 }, { t: "42", estoque: 4 }, { t: "43", estoque: 2 }],
    estoque: 15, tecido: "Couro legítimo", composicao: "Forro em couro", modelagem: "Numeração padrão BR",
    lavagem: "Higienizar com produto específico para couro", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.9, numAvaliacoes: 54
  },
  {
    nome: "Conjunto Infantil Aventura", categoria: "moletom", publico: "infantil",
    estilo: "infantil", preco: 129.90, precoPromocional: 104.90,
    cores: ["Azul", "Verde"],
    tamanhos: [{ t: "PP", estoque: 8 }, { t: "P", estoque: 9 }, { t: "M", estoque: 7 }],
    estoque: 24, tecido: "Algodão macio", composicao: "100% algodão", modelagem: "Regular",
    lavagem: "Lavagem à máquina, água fria", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519457851761-4930deb62b25?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503457574465-fee2aa6c85d3?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.9, numAvaliacoes: 41
  },
  {
    nome: "Vestido Infantil Florido", categoria: "vestido", publico: "infantil",
    estilo: "infantil", preco: 99.90, precoPromocional: null,
    cores: ["Rosa", "Branco creme"],
    tamanhos: [{ t: "PP", estoque: 2, baixo: true }, { t: "P", estoque: 9 }, { t: "M", estoque: 8 }],
    estoque: 19, tecido: "Tricoline estampada", composicao: "100% algodão", modelagem: "Regular",
    lavagem: "Lavagem à máquina, água fria", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503919005314-30d93d07d823?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.6, numAvaliacoes: 33
  },
  {
    nome: "Bolsa Tote Couro Sintético", categoria: "acessorio", publico: "feminino",
    estilo: "elegante", preco: 189.90, precoPromocional: 149.90,
    cores: ["Preto", "Marrom claro", "Bege"],
    tamanhos: [{ t: "Único", estoque: 28 }],
    estoque: 28, tecido: "Couro sintético premium", composicao: "Sintético", modelagem: "Alça de ombro",
    lavagem: "Limpar com pano seco", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.8, numAvaliacoes: 87
  },
  {
    nome: "Boné Aba Curva Signature", categoria: "acessorio", publico: "masculino",
    estilo: "casual", preco: 89.90, precoPromocional: null,
    cores: ["Preto", "Bege", "Dourado"],
    tamanhos: [{ t: "Único", estoque: 45 }],
    estoque: 45, tecido: "Sarja", composicao: "100% algodão", modelagem: "Ajustável",
    lavagem: "Limpar com pano úmido", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.4, numAvaliacoes: 29
  },
  {
    nome: "Camisa Social Slim Line", categoria: "camisa", publico: "masculino",
    estilo: "social", preco: 179.90, precoPromocional: 149.90,
    cores: ["Branco", "Azul"],
    tamanhos: [{ t: "P", estoque: 8 }, { t: "M", estoque: 12 }, { t: "G", estoque: 9 }, { t: "GG", estoque: 4 }],
    estoque: 33, tecido: "Tricoline fio 100", composicao: "100% algodão", modelagem: "Slim Fit",
    lavagem: "Lavagem à máquina, água fria", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.7, numAvaliacoes: 68
  },
  {
    nome: "Short Moletom Street", categoria: "short", publico: "masculino",
    estilo: "streetwear", preco: 109.90, precoPromocional: null,
    cores: ["Cinza escuro", "Preto"],
    tamanhos: [{ t: "P", estoque: 10 }, { t: "M", estoque: 12 }, { t: "G", estoque: 9 }, { t: "GG", estoque: 6 }],
    estoque: 37, tecido: "Moletom", composicao: "80% algodão, 20% poliéster", modelagem: "Regular",
    lavagem: "Lavagem à máquina, água fria", origem: "Brasil",
    imagens: [
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618453292459-53164a1af3fc?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=900&auto=format&fit=crop"
    ],
    avaliacao: 4.3, numAvaliacoes: 22
  }
];

function run() {
  console.log("Limpando tabelas...");
  db.exec(`
    DELETE FROM reviews;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM favorites;
    DELETE FROM product_sizes;
    DELETE FROM product_colors;
    DELETE FROM product_images;
    DELETE FROM products;
    DELETE FROM addresses;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN
      ('reviews','order_items','orders','cart_items','favorites',
       'product_sizes','product_colors','product_images','products','addresses','users');
  `);

  console.log("Inserindo produtos...");
  const insertProduct = db.prepare(`
    INSERT INTO products
      (nome, categoria, publico, estilo, preco, preco_promocional, tecido, composicao,
       modelagem, lavagem, origem, estoque, avaliacao, num_avaliacoes)
    VALUES (@nome, @categoria, @publico, @estilo, @preco, @precoPromocional, @tecido, @composicao,
       @modelagem, @lavagem, @origem, @estoque, @avaliacao, @numAvaliacoes)
  `);
  const insertImage = db.prepare(`INSERT INTO product_images (product_id, url, ordem) VALUES (?, ?, ?)`);
  const insertColor = db.prepare(`INSERT INTO product_colors (product_id, nome, hex) VALUES (?, ?, ?)`);
  const insertSize = db.prepare(`INSERT INTO product_sizes (product_id, tamanho, estoque, estoque_baixo) VALUES (?, ?, ?, ?)`);

  const insertAll = db.transaction((products) => {
    for (const p of products) {
      const info = insertProduct.run({
        nome: p.nome, categoria: p.categoria, publico: p.publico, estilo: p.estilo,
        preco: p.preco, precoPromocional: p.precoPromocional, tecido: p.tecido,
        composicao: p.composicao, modelagem: p.modelagem, lavagem: p.lavagem,
        origem: p.origem, estoque: p.estoque, avaliacao: p.avaliacao, numAvaliacoes: p.numAvaliacoes
      });
      const productId = info.lastInsertRowid;
      p.imagens.forEach((url, i) => insertImage.run(productId, url, i));
      p.cores.forEach((nome) => insertColor.run(productId, nome, COLOR_HEX[nome] || "#CCCCCC"));
      p.tamanhos.forEach((s) => insertSize.run(productId, s.t, s.estoque, s.baixo ? 1 : 0));
    }
  });
  insertAll(PRODUCTS);

  console.log("Criando usuários padrão...");
  const insertUser = db.prepare(`
    INSERT INTO users (nome, email, senha_hash, cpf, telefone, nascimento, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync("admin123", 10);
  insertUser.run("Administrador MILISTORE", "admin@milistore.com.br", adminHash, null, null, null, 1);

  const clienteHash = bcrypt.hashSync("123456", 10);
  insertUser.run("Cliente Teste", "cliente@teste.com", clienteHash, null, "(11) 90000-0000", "1998-05-20", 0);

  console.log("Inserindo avaliações de exemplo...");
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, nome_cliente, nota, comentario, tamanho, verificada)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const nomes = ["Camila S.", "Rafael M.", "Juliana P.", "Bruno A.", "Fernanda L.", "Diego R.", "Larissa T.", "André C."];
  const comentarios = [
    "Peça de excelente qualidade, chegou rápido e o caimento ficou perfeito.",
    "Gostei bastante, mas o tamanho veio um pouco maior do que eu esperava.",
    "Superou minhas expectativas, tecido macio e cor idêntica à foto.",
    "Bom custo-benefício, recomendo para o dia a dia.",
    "Já é a terceira peça que compro da marca, sempre impecável.",
    "Achei o acabamento muito bom, voltarei a comprar com certeza.",
    "Entrega rápida e produto muito bem embalado.",
    "Ficou ótimo, exatamente como nas fotos do site."
  ];
  const allProducts = db.prepare("SELECT id FROM products").all();
  const sizesByProduct = db.prepare("SELECT tamanho FROM product_sizes WHERE product_id = ?");

  const insertReviews = db.transaction(() => {
    allProducts.forEach((prod, pIdx) => {
      const sizes = sizesByProduct.all(prod.id).map(r => r.tamanho);
      const qtd = 3 + (prod.id % 4);
      for (let i = 0; i < qtd; i++) {
        const nota = Math.max(3, Math.min(5, 5 - (i % 2)));
        insertReview.run(
          prod.id,
          nomes[(prod.id + i) % nomes.length],
          nota,
          comentarios[(prod.id + i) % comentarios.length],
          sizes[i % sizes.length] || null,
          i % 3 !== 0 ? 1 : 0
        );
      }
    });
  });
  insertReviews();

  console.log("✅ Seed concluído!");
  console.log("   Admin  -> admin@milistore.com.br / admin123");
  console.log("   Cliente-> cliente@teste.com / 123456");
}

run();
