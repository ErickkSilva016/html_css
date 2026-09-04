/* ============================================================
   MILISTORE — SCRIPT.JS
   Sumário:
   1.  Configuração
   2.  Dados mockados
   3.  Estado da aplicação
   4.  Funções da API (preparadas para PHP/MySQL)
   5.  Renderização de produtos
   6.  Filtros
   7.  Busca
   8.  Carrinho
   9.  Favoritos
   10. Produto individual
   11. Avaliações
   12. Login
   13. Cadastro
   14. Guia de tamanho
   15. Checkout
   16. Administração
   17. Eventos
   18. Inicialização da aplicação
============================================================ */

/* ============================================================
   1. CONFIGURAÇÃO
============================================================ */

// URL base da futura API PHP (XAMPP). Ajuste conforme a pasta do projeto.
const API_BASE_URL = "http://localhost/milistore2/api";

// Chave-mestra: enquanto false, o site usa dados mockados + localStorage.
// Quando o backend PHP + MySQL estiver pronto, mude para true.
const USE_API = true;

// Chaves usadas no localStorage
const STORAGE_KEYS = {
  CART: "milistore_cart",
  FAVORITES: "milistore_favorites",
  USER: "milistore_user",
  ADMIN_PRODUCTS: "milistore_admin_products",
  ORDERS: "milistore_orders"
};

/* ============================================================
   2. DADOS MOCKADOS
============================================================ */

// Paletas de cor usadas nos filtros e nas variações de produto (nome -> hex)
const COLOR_MAP = {
  "Preto": "#232323",
  "Branco": "#F5F3EE",
  "Marrom": "#7B5A3E",
  "Bege": "#D9C7A8",
  "Azul": "#3A5A78",
  "Vinho": "#6E2A32",
  "Verde": "#4C6B4F",
  "Rosa": "#D8A6AE",
  "Cinza": "#8C8C86",
  "Dourado": "#C6A15B"
};

const CATEGORIES_UI = [
  { key: "feminino", label: "Feminino", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop" },
  { key: "masculino", label: "Masculino", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop" },
  { key: "infantil", label: "Infantil", img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop" },
  { key: "calcados", label: "Calçados", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop" },
  { key: "acessorios", label: "Acessórios", img: "https://images.unsplash.com/photo-1611923134239-b9be5816e23c?q=80&w=800&auto=format&fit=crop" }
];

// 12+ produtos de demonstração. Estrutura pensada para futuramente
// espelhar as tabelas `produtos`, `produto_variacoes` e `produto_imagens`.
const MOCK_PRODUCTS = [
  {
    id: 1, nome: "Camiseta Premium Essential", categoria: "camiseta", publico: "masculino",
    estilo: "basico", preco: 129.90, precoPromocional: 99.90,
    cor: ["Preto", "Branco", "Marrom"], tamanhos: ["P", "M", "G", "GG"], estoqueBaixoTamanhos: ["GG"],
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
    id: 2, nome: "Vestido Midi Elegance", categoria: "vestido", publico: "feminino",
    estilo: "elegante", preco: 289.90, precoPromocional: null,
    cor: ["Vinho", "Preto", "Bege"], tamanhos: ["PP", "P", "M", "G"], estoqueBaixoTamanhos: ["PP"],
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
    id: 3, nome: "Calça Alfaiataria Slim", categoria: "calca", publico: "masculino",
    estilo: "social", preco: 249.90, precoPromocional: 199.90,
    cor: ["Preto", "Cinza", "Azul"], tamanhos: ["P", "M", "G", "GG"], estoqueBaixoTamanhos: [],
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
    id: 4, nome: "Jaqueta Corta-Vento Urban", categoria: "jaqueta", publico: "masculino",
    estilo: "streetwear", preco: 349.90, precoPromocional: 279.90,
    cor: ["Preto", "Verde", "Azul"], tamanhos: ["M", "G", "GG"], estoqueBaixoTamanhos: ["GG"],
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
    id: 5, nome: "Saia Plissada Chic", categoria: "saia", publico: "feminino",
    estilo: "elegante", preco: 159.90, precoPromocional: null,
    cor: ["Bege", "Preto", "Rosa"], tamanhos: ["PP", "P", "M"], estoqueBaixoTamanhos: [],
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
    id: 6, nome: "Moletom Oversized Comfort", categoria: "moletom", publico: "feminino",
    estilo: "streetwear", preco: 219.90, precoPromocional: 179.90,
    cor: ["Cinza", "Bege", "Preto"], tamanhos: ["P", "M", "G", "GG"], estoqueBaixoTamanhos: ["P"],
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
    id: 7, nome: "Tênis Runner Comfort", categoria: "tenis", publico: "masculino",
    estilo: "esportivo", preco: 399.90, precoPromocional: 329.90,
    cor: ["Branco", "Preto", "Azul"], tamanhos: ["38", "39", "40", "41", "42", "43"], estoqueBaixoTamanhos: ["43"],
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
    id: 8, nome: "Sapato Social Couro Legítimo", categoria: "sapato", publico: "masculino",
    estilo: "social", preco: 459.90, precoPromocional: null,
    cor: ["Preto", "Marrom"], tamanhos: ["39", "40", "41", "42", "43"], estoqueBaixoTamanhos: ["39"],
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
    id: 9, nome: "Conjunto Infantil Aventura", categoria: "moletom", publico: "infantil",
    estilo: "infantil", preco: 129.90, precoPromocional: 104.90,
    cor: ["Azul", "Verde"], tamanhos: ["PP", "P", "M"], estoqueBaixoTamanhos: [],
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
    id: 10, nome: "Vestido Infantil Florido", categoria: "vestido", publico: "infantil",
    estilo: "infantil", preco: 99.90, precoPromocional: null,
    cor: ["Rosa", "Branco"], tamanhos: ["PP", "P", "M"], estoqueBaixoTamanhos: ["PP"],
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
    id: 11, nome: "Bolsa Tote Couro Sintético", categoria: "acessorio", publico: "feminino",
    estilo: "elegante", preco: 189.90, precoPromocional: 149.90,
    cor: ["Preto", "Marrom", "Bege"], tamanhos: ["Único"], estoqueBaixoTamanhos: [],
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
    id: 12, nome: "Boné Aba Curva Signature", categoria: "acessorio", publico: "masculino",
    estilo: "casual", preco: 89.90, precoPromocional: null,
    cor: ["Preto", "Bege", "Dourado"], tamanhos: ["Único"], estoqueBaixoTamanhos: [],
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
    id: 13, nome: "Camisa Social Slim Line", categoria: "camisa", publico: "masculino",
    estilo: "social", preco: 179.90, precoPromocional: 149.90,
    cor: ["Branco", "Azul"], tamanhos: ["P", "M", "G", "GG"], estoqueBaixoTamanhos: [],
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
    id: 14, nome: "Short Moletom Street", categoria: "short", publico: "masculino",
    estilo: "streetwear", preco: 109.90, precoPromocional: null,
    cor: ["Cinza", "Preto"], tamanhos: ["P", "M", "G", "GG"], estoqueBaixoTamanhos: [],
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

// Avaliações mockadas por produto (id do produto -> lista de avaliações)
const MOCK_REVIEWS = {};
(function seedReviews(){
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
  MOCK_PRODUCTS.forEach(p => {
    const qtd = 3 + (p.id % 4);
    const list = [];
    for (let i = 0; i < qtd; i++){
      const nota = Math.max(3, Math.min(5, Math.round(p.avaliacao) - (i % 2)));
      list.push({
        id: `${p.id}-${i}`,
        nome: nomes[(p.id + i) % nomes.length],
        nota,
        comentario: comentarios[(p.id + i) % comentarios.length],
        data: new Date(2026, (i + p.id) % 12, ((i * 5) % 27) + 1).toISOString(),
        tamanho: p.tamanhos[i % p.tamanhos.length],
        verificada: i % 3 !== 0
      });
    }
    MOCK_REVIEWS[p.id] = list;
  });
})();

// Pedidos mockados para o painel administrativo
const MOCK_ORDERS = [
  { id: "1042", cliente: "Camila Santos", data: "2026-08-28", valor: 429.80, pagamento: "PIX", status: "pago" },
  { id: "1041", cliente: "Rafael Moura", data: "2026-08-27", valor: 199.90, pagamento: "Cartão de crédito", status: "enviado" },
  { id: "1040", cliente: "Juliana Prado", data: "2026-08-25", valor: 89.90, pagamento: "Boleto", status: "aguardando" },
  { id: "1039", cliente: "Bruno Alves", data: "2026-08-24", valor: 619.70, pagamento: "Cartão de débito", status: "entregue" },
  { id: "1038", cliente: "Fernanda Lima", data: "2026-08-22", valor: 149.90, pagamento: "PIX", status: "separacao" },
  { id: "1037", cliente: "Diego Ramos", data: "2026-08-20", valor: 279.90, pagamento: "Cartão de crédito", status: "cancelado" }
];

// Clientes mockados para o painel administrativo
const MOCK_CUSTOMERS = [
  { nome: "Camila Santos", email: "camila.santos@email.com", cadastro: "2026-02-14", pedidos: 6, total: 1840.30 },
  { nome: "Rafael Moura", email: "rafael.moura@email.com", cadastro: "2026-03-02", pedidos: 3, total: 799.70 },
  { nome: "Juliana Prado", email: "juliana.prado@email.com", cadastro: "2026-01-19", pedidos: 9, total: 2410.10 },
  { nome: "Bruno Alves", email: "bruno.alves@email.com", cadastro: "2026-05-30", pedidos: 2, total: 619.70 },
  { nome: "Fernanda Lima", email: "fernanda.lima@email.com", cadastro: "2026-06-11", pedidos: 4, total: 980.40 }
];

/* ============================================================
   3. ESTADO DA APLICAÇÃO
============================================================ */

const state = {
  currentView: "home",
  products: loadAdminProducts() || [...MOCK_PRODUCTS], // catálogo ativo (mock + itens do admin)
  cart: loadCart(),
  favorites: loadFavorites(),
  user: loadUser(),
  isAdmin: false,
  adminSection: "dashboard",
  editingProductId: null,

  filters: {
    publico: new Set(),
    categoria: new Set(),
    tamanho: new Set(),
    cor: new Set(),
    estilo: new Set(),
    precoMin: null,
    precoMax: null,
    busca: "",
    ofertas: false
  },
  sort: "relevancia",

  currentProduct: null,   // produto sendo visualizado
  selectedSize: null,
  selectedColor: null,
  selectedQty: 1,
  activeImageIndex: 0,

  reviewsFilter: "todas",
  reviewsSort: "recentes"
};

/* ============================================================
   4. FUNÇÕES DA API (preparadas para PHP + MySQL)
============================================================ */

// Função genérica de requisição. Usada por todas as funções abaixo
// quando USE_API === true.
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
}

// ---- PRODUTOS -> GET /products.php | GET /product.php?id= | POST /products/create.php
//                  PUT /products/update.php?id= | DELETE /products/delete.php?id=
async function getProducts(params = {}) {
  if (!USE_API) return [...state.products];
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/products.php?${query}`);
}
async function getProductById(id) {
  if (!USE_API) return state.products.find(p => p.id === Number(id));
  return apiRequest(`/product.php?id=${id}`);
}
async function createProduct(product) {
  if (!USE_API) return { ...product, id: Date.now() };
  return apiRequest(`/products/create.php`, { method: "POST", body: JSON.stringify(product) });
}
async function updateProduct(id, product) {
  if (!USE_API) return { ...product, id };
  return apiRequest(`/products/update.php?id=${id}`, { method: "PUT", body: JSON.stringify(product) });
}
async function deleteProduct(id) {
  if (!USE_API) return { success: true };
  return apiRequest(`/products/delete.php?id=${id}`, { method: "DELETE" });
}

// ---- AUTENTICAÇÃO -> POST /auth/login.php | /auth/register.php | /auth/logout.php
// O PHP deverá usar password_hash()/password_verify(), PDO com prepared
// statements e sessões PHP (session_start()) para controlar o login real.
async function loginUser(credentials) {
  if (!USE_API) return { success: true, user: { nome: credentials.email.split("@")[0], email: credentials.email } };
  return apiRequest(`/auth/login.php`, { method: "POST", body: JSON.stringify(credentials) });
}
async function registerUser(user) {
  if (!USE_API) return { success: true, user };
  return apiRequest(`/auth/register.php`, { method: "POST", body: JSON.stringify(user) });
}
async function logoutUser() {
  if (!USE_API) return { success: true };
  return apiRequest(`/auth/logout.php`, { method: "POST" });
}

// ---- FAVORITOS -> GET /favorites.php | POST /favorites/add.php | DELETE /favorites/remove.php
async function getFavorites() {
  if (!USE_API) return [...state.favorites];
  return apiRequest(`/favorites.php`);
}
async function addFavorite(productId) {
  if (!USE_API) return { success: true };
  return apiRequest(`/favorites/add.php`, { method: "POST", body: JSON.stringify({ productId }) });
}
async function removeFavorite(productId) {
  if (!USE_API) return { success: true };
  return apiRequest(`/favorites/remove.php`, { method: "DELETE", body: JSON.stringify({ productId }) });
}

// ---- CARRINHO -> GET /cart.php | POST /cart/add.php | PUT /cart/update.php | DELETE /cart/remove.php
async function getCart() {
  if (!USE_API) return [...state.cart];
  return apiRequest(`/cart.php`);
}
async function addToCartApi(item) {
  if (!USE_API) return { success: true };
  return apiRequest(`/cart/add.php`, { method: "POST", body: JSON.stringify(item) });
}
async function removeFromCartApi(id) {
  if (!USE_API) return { success: true };
  return apiRequest(`/cart/remove.php`, { method: "DELETE", body: JSON.stringify({ id }) });
}

// ---- PEDIDOS -> POST /orders/create.php | GET /orders.php
async function createOrder(order) {
  if (!USE_API) return { success: true, id: Date.now() };
  return apiRequest(`/orders/create.php`, { method: "POST", body: JSON.stringify(order) });
}
async function getOrders() {
  if (!USE_API) return [...MOCK_ORDERS];
  return apiRequest(`/orders.php`);
}

// ---- AVALIAÇÕES -> GET /reviews.php?product_id= | POST /reviews/create.php
async function getReviews(productId) {
  if (!USE_API) return MOCK_REVIEWS[productId] || [];
  return apiRequest(`/reviews.php?product_id=${productId}`);
}
async function createReview(review) {
  if (!USE_API) return { success: true, review };
  return apiRequest(`/reviews/create.php`, { method: "POST", body: JSON.stringify(review) });
}

// ---- ADMIN -> GET /admin/dashboard.php | /admin/customers.php | /admin/orders.php
async function getAdminDashboard() {
  if (!USE_API) {
    return {
      totalProdutos: state.products.length,
      totalPedidos: MOCK_ORDERS.length,
      totalClientes: MOCK_CUSTOMERS.length,
      receita: MOCK_ORDERS.filter(o => o.status !== "cancelado").reduce((s, o) => s + o.valor, 0)
    };
  }
  return apiRequest(`/admin/dashboard.php`);
}

/* ============================================================
   5. RENDERIZAÇÃO DE PRODUTOS
============================================================ */

function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderStars(rating) {
  const full = Math.round(rating);
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<i class="fa-solid fa-star" style="opacity:${i <= full ? 1 : .25}"></i>`;
  }
  return html;
}

function productCardTemplate(p) {
  const isFav = state.favorites.includes(p.id);
  const hasPromo = p.precoPromocional && p.precoPromocional < p.preco;
  const discount = hasPromo ? Math.round((1 - p.precoPromocional / p.preco) * 100) : 0;
  const priceShown = hasPromo ? p.precoPromocional : p.preco;
  const installments = (priceShown / 3).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return `
  <article class="product-card" data-id="${p.id}">
    <div class="product-media" data-open-product="${p.id}">
      ${hasPromo ? `<span class="product-badge">-${discount}%</span>` : ""}
      <button class="fav-toggle ${isFav ? "active" : ""}" data-toggle-fav="${p.id}" aria-label="Favoritar produto">
        <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i>
      </button>
      <img class="img-primary" src="${p.imagens[0]}" alt="${p.nome}" loading="lazy">
      <img class="img-secondary" src="${p.imagens[1] || p.imagens[0]}" alt="" loading="lazy">
    </div>
    <div class="product-info">
      <span class="product-cat">${p.publico} · ${p.categoria}</span>
      <h3 class="product-name">${p.nome}</h3>
      <div class="product-rating"><span class="stars">${renderStars(p.avaliacao)}</span> (${p.numAvaliacoes})</div>
      <div class="product-price-row">
        ${hasPromo ? `<span class="price-old">${formatBRL(p.preco)}</span>` : ""}
        <span class="price-current">${formatBRL(priceShown)}</span>
      </div>
      <span class="price-installments">3x de R$ ${installments} sem juros</span>
      <button class="add-cart-card-btn" data-quick-add="${p.id}">Adicionar ao carrinho</button>
    </div>
  </article>`;
}

function renderCategoryGrid() {
  const el = document.getElementById("category-grid");
  el.innerHTML = CATEGORIES_UI.map(c => `
    <div class="category-card" data-category-nav="${c.key}">
      <img src="${c.img}" alt="Categoria ${c.label}" loading="lazy">
      <div class="category-card-label"><span>${c.label}</span><i class="fa-solid fa-arrow-right"></i></div>
    </div>`).join("");
}

function renderColorFilters() {
  const el = document.getElementById("color-filter-group");
  el.innerHTML = Object.entries(COLOR_MAP).map(([name, hex]) => `
    <button type="button" class="color-swatch" data-value="${name}" style="background:${hex}" title="${name}" aria-label="Cor ${name}"></button>
  `).join("");
}

function getFilteredProducts() {
  const f = state.filters;
  let list = state.products.filter(p => {
    if (f.publico.size && !f.publico.has(p.publico)) return false;
    if (f.categoria.size && !f.categoria.has(p.categoria)) return false;
    if (f.tamanho.size && !p.tamanhos.some(t => f.tamanho.has(t))) return false;
    if (f.cor.size && !p.cor.some(c => f.cor.has(c))) return false;
    if (f.estilo.size && !f.estilo.has(p.estilo)) return false;
    if (f.ofertas && !(p.precoPromocional && p.precoPromocional < p.preco)) return false;

    const price = p.precoPromocional && p.precoPromocional < p.preco ? p.precoPromocional : p.preco;
    if (f.precoMin != null && price < f.precoMin) return false;
    if (f.precoMax != null && price > f.precoMax) return false;

    if (f.busca) {
      const q = f.busca.toLowerCase();
      const haystack = `${p.nome} ${p.categoria} ${p.publico} ${p.estilo} ${p.cor.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  switch (state.sort) {
    case "menor-preco":
      list.sort((a, b) => (a.precoPromocional || a.preco) - (b.precoPromocional || b.preco));
      break;
    case "maior-preco":
      list.sort((a, b) => (b.precoPromocional || b.preco) - (a.precoPromocional || a.preco));
      break;
    case "melhor-avaliados":
      list.sort((a, b) => b.avaliacao - a.avaliacao);
      break;
    default:
      break;
  }
  return list;
}

function renderProductGrid() {
  const grid = document.getElementById("produtos-grid");
  const empty = document.getElementById("empty-products");
  const list = getFilteredProducts();

  document.getElementById("results-count").textContent = `${list.length} produto${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = list.map(productCardTemplate).join("");
}

/* ============================================================
   6. FILTROS
============================================================ */

function toggleSetFilter(filterName, value) {
  const set = state.filters[filterName];
  if (set.has(value)) set.delete(value); else set.add(value);
}

function updateFilterUI() {
  document.querySelectorAll(".chip[data-value]").forEach(chip => {
    const group = chip.closest("[data-filter]");
    if (!group) return;
    const key = group.dataset.filter;
    chip.classList.toggle("active", state.filters[key].has(chip.dataset.value));
  });
  document.querySelectorAll(".color-swatch").forEach(sw => {
    sw.classList.toggle("active", state.filters.cor.has(sw.dataset.value));
  });
}

function clearFilters() {
  state.filters.publico.clear();
  state.filters.categoria.clear();
  state.filters.tamanho.clear();
  state.filters.cor.clear();
  state.filters.estilo.clear();
  state.filters.precoMin = null;
  state.filters.precoMax = null;
  state.filters.ofertas = false;
  document.getElementById("price-min").value = "";
  document.getElementById("price-max").value = "";
  document.getElementById("price-slider").value = 1000;
  updateFilterUI();
  renderProductGrid();
}

/* ============================================================
   7. BUSCA
============================================================ */

function handleSearchSubmit(e) {
  e.preventDefault();
  const q = document.getElementById("search-input").value.trim();
  state.filters.busca = q;
  showView("home");
  renderProductGrid();
  scrollToId("monte-seu-estilo");
}

/* ============================================================
   8. CARRINHO
============================================================ */

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveCart() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
}

function addToCart(product, size, color, qty = 1) {
  const existing = state.cart.find(i => i.productId === product.id && i.size === size && i.color === color);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      productId: product.id,
      nome: product.nome,
      imagem: product.imagens[0],
      preco: product.precoPromocional && product.precoPromocional < product.preco ? product.precoPromocional : product.preco,
      size, color, qty
    });
  }
  saveCart();
  addToCartApi({ productId: product.id, size, color, qty }); // preparado p/ backend
  renderCartBadge();
  renderCartDrawer();
  showToast(`${product.nome} adicionado ao carrinho`);
}

function removeCartLine(index) {
  state.cart.splice(index, 1);
  saveCart();
  renderCartBadge();
  renderCartDrawer();
}

function changeCartQty(index, delta) {
  const line = state.cart[index];
  line.qty = Math.max(1, line.qty + delta);
  saveCart();
  renderCartDrawer();
  renderCartBadge();
}

function cartSubtotal() {
  return state.cart.reduce((sum, i) => sum + i.preco * i.qty, 0);
}

let appliedCoupon = null;
function cartDiscount() {
  if (!appliedCoupon) return 0;
  return cartSubtotal() * appliedCoupon.percent;
}

function renderCartBadge() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-badge").textContent = count;
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-container");
  if (!state.cart.length) {
    container.innerHTML = `<p class="empty-state">Seu carrinho está vazio.</p>`;
  } else {
    container.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-line">
        <img src="${item.imagem}" alt="${item.nome}">
        <div class="cart-line-info">
          <h4>${item.nome}</h4>
          <div class="cart-line-meta">Cor: ${item.color || "—"} · Tam: ${item.size || "—"}</div>
          <div class="qty-control">
            <button data-cart-qty-down="${idx}" aria-label="Diminuir quantidade">−</button>
            <span>${item.qty}</span>
            <button data-cart-qty-up="${idx}" aria-label="Aumentar quantidade">+</button>
          </div>
          <button class="remove-line-btn" data-cart-remove="${idx}">Remover</button>
        </div>
        <div class="cart-line-price">${formatBRL(item.preco * item.qty)}</div>
      </div>`).join("");
  }

  const subtotal = cartSubtotal();
  const discount = cartDiscount();
  document.getElementById("cart-subtotal").textContent = formatBRL(subtotal);
  document.getElementById("cart-total").textContent = formatBRL(Math.max(0, subtotal - discount));
  document.getElementById("cart-discount-row").hidden = discount <= 0;
  if (discount > 0) document.getElementById("cart-discount").textContent = `- ${formatBRL(discount)}`;
}

function applyCoupon() {
  const code = document.getElementById("coupon-input").value.trim().toUpperCase();
  if (code === "MILI10") {
    appliedCoupon = { code, percent: 0.10 };
    showToast("Cupom MILI10 aplicado: 10% de desconto!");
  } else if (!code) {
    showToast("Digite um cupom válido.");
    return;
  } else {
    appliedCoupon = null;
    showToast("Cupom inválido.");
  }
  renderCartDrawer();
}

function openCartDrawer() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("overlay").classList.add("active");
}
function closeCartDrawer() {
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
}

/* ============================================================
   9. FAVORITOS
============================================================ */

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
}

function toggleFavorite(productId) {
  const idx = state.favorites.indexOf(productId);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    removeFavorite(productId);
    showToast("Removido dos favoritos");
  } else {
    state.favorites.push(productId);
    addFavorite(productId);
    showToast("Adicionado aos favoritos");
  }
  saveFavorites();
  renderFavoritesBadge();
  renderProductGrid();
  if (state.currentProduct) renderProductPage(state.currentProduct.id, false);
  if (state.currentView === "favorites") renderFavoritesPage();
}

function renderFavoritesBadge() {
  document.getElementById("favorites-badge").textContent = state.favorites.length;
}

function renderFavoritesPage() {
  const grid = document.getElementById("favorites-grid");
  const empty = document.getElementById("empty-favorites");
  const list = state.products.filter(p => state.favorites.includes(p.id));
  if (!list.length) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = list.map(productCardTemplate).join("");
}

/* ============================================================
   10. PRODUTO INDIVIDUAL
============================================================ */

function openProductPage(id) {
  showView("product");
  renderProductPage(id, true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProductPage(id, resetSelection) {
  const p = state.products.find(pp => pp.id === Number(id));
  if (!p) return;
  state.currentProduct = p;
  if (resetSelection) {
    state.selectedSize = null;
    state.selectedColor = p.cor[0];
    state.selectedQty = 1;
    state.activeImageIndex = 0;
  }

  const hasPromo = p.precoPromocional && p.precoPromocional < p.preco;
  const priceShown = hasPromo ? p.precoPromocional : p.preco;
  const discount = hasPromo ? Math.round((1 - p.precoPromocional / p.preco) * 100) : 0;
  const installments = (priceShown / 3).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const isFav = state.favorites.includes(p.id);

  const container = document.getElementById("product-page-content");
  container.innerHTML = `
    <p class="breadcrumb"><button data-view="home">Início</button> / ${p.publico} / ${p.categoria}</p>
    <div class="product-detail-grid">
      <div class="gallery">
        <div class="gallery-main"><img id="gallery-main-img" src="${p.imagens[state.activeImageIndex]}" alt="${p.nome}"></div>
        <div class="gallery-thumbs">
          ${p.imagens.map((img, i) => `<img src="${img}" class="${i === state.activeImageIndex ? "active" : ""}" data-thumb="${i}" alt="Miniatura ${i + 1} de ${p.nome}">`).join("")}
        </div>
      </div>

      <div class="pd-info">
        <span class="pd-category">${p.publico} · ${p.categoria}</span>
        <h1 class="pd-name">${p.nome}</h1>
        <div class="pd-rating">
          <span class="stars">${renderStars(p.avaliacao)}</span>
          <strong>${p.avaliacao.toFixed(1)}</strong>
          <a href="#reviews-section">(${p.numAvaliacoes} avaliações)</a>
        </div>

        <div class="pd-price-block">
          <div class="pd-price-row">
            ${hasPromo ? `<span class="pd-price-old">${formatBRL(p.preco)}</span><span class="pd-discount-badge">-${discount}%</span>` : ""}
          </div>
          <div class="pd-price-current">${formatBRL(priceShown)}</div>
          <div class="pd-installments">ou 3x de R$ ${installments} sem juros</div>
        </div>

        <div class="pd-variation">
          <h3>Tamanho</h3>
          <div class="size-options" id="size-options">
            ${p.tamanhos.map(t => `<button type="button" class="size-option ${state.selectedSize === t ? "active" : ""} ${p.estoqueBaixoTamanhos.includes(t) && p.estoque < 1 ? "disabled" : ""}" data-size="${t}">${t}</button>`).join("")}
          </div>
        </div>

        <div class="pd-variation">
          <h3>Cor: <span class="color-name-label">${state.selectedColor || ""}</span></h3>
          <div class="color-options" id="color-options">
            ${p.cor.map(c => `<button type="button" class="color-option ${state.selectedColor === c ? "active" : ""}" data-color="${c}" style="background:${COLOR_MAP[c] || "#ccc"}" title="${c}" aria-label="Cor ${c}"></button>`).join("")}
          </div>
        </div>

        <div class="pd-variation">
          <h3>Quantidade</h3>
          <div class="qty-selector">
            <div class="qty-control">
              <button id="pd-qty-down" aria-label="Diminuir">−</button>
              <span id="pd-qty-value">${state.selectedQty}</span>
              <button id="pd-qty-up" aria-label="Aumentar">+</button>
            </div>
            <span style="font-size:.82rem;color:#847c6f;">${p.estoque} em estoque</span>
          </div>
        </div>

        <div class="pd-actions">
          <button class="btn btn-outline" id="pd-add-cart"><i class="fa-solid fa-bag-shopping"></i> Adicionar ao carrinho</button>
          <button class="btn btn-primary" id="pd-buy-now"><i class="fa-solid fa-bolt"></i> Comprar agora</button>
          <button class="btn btn-outline pd-fav-btn ${isFav ? "active" : ""}" id="pd-fav-btn" data-toggle-fav="${p.id}" aria-label="Favoritar">
            <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i>
          </button>
        </div>

        <button type="button" class="pd-size-guide-link" id="pd-size-guide-btn"><i class="fa-regular fa-ruler"></i> Descubra seu tamanho ideal</button>

        <div class="pd-specs">
          <dl>
            <dt>Material</dt><dd>${p.tecido}</dd>
            <dt>Composição</dt><dd>${p.composicao}</dd>
            <dt>Modelagem</dt><dd>${p.modelagem}</dd>
            <dt>Lavagem</dt><dd>${p.lavagem}</dd>
            <dt>País de fabricação</dt><dd>${p.origem}</dd>
          </dl>
        </div>
      </div>
    </div>

    <section class="recommend-section">
      <h2>Combine com este look</h2>
      <div class="recommend-scroller" id="combine-scroller"></div>
    </section>

    <section class="recommend-section">
      <h2>Você também pode gostar</h2>
      <div class="recommend-scroller" id="similar-scroller"></div>
    </section>

    <section class="reviews-section" id="reviews-section"></section>
  `;

  renderRecommendations(p);
  renderReviewsSection(p);
}

function renderRecommendations(p) {
  // Venda casada: prioriza categorias complementares dentro do mesmo público/estilo.
  const complementMap = {
    camiseta: ["calca", "short", "tenis", "jaqueta", "acessorio"],
    camisa: ["calca", "sapato", "acessorio"],
    calca: ["camiseta", "camisa", "tenis", "sapato"],
    short: ["camiseta", "tenis"],
    saia: ["camiseta", "sapato", "acessorio"],
    vestido: ["sapato", "acessorio"],
    jaqueta: ["camiseta", "calca", "tenis"],
    moletom: ["calca", "tenis", "short"],
    tenis: ["calca", "short", "camiseta"],
    sapato: ["calca", "camisa"],
    acessorio: ["camiseta", "vestido", "calca"]
  };
  const complementCats = complementMap[p.categoria] || [];
  const combine = state.products
    .filter(x => x.id !== p.id && x.publico === p.publico && complementCats.includes(x.categoria))
    .slice(0, 6);

  const similar = state.products
    .filter(x => x.id !== p.id && (x.categoria === p.categoria || x.estilo === p.estilo))
    .sort((a, b) => (a.categoria === p.categoria ? -1 : 0))
    .slice(0, 6);

  document.getElementById("combine-scroller").innerHTML =
    (combine.length ? combine : similar).map(productCardTemplate).join("") || `<p class="empty-state">Sem sugestões no momento.</p>`;
  document.getElementById("similar-scroller").innerHTML =
    similar.length ? similar.map(productCardTemplate).join("") : `<p class="empty-state">Sem sugestões no momento.</p>`;
}

/* ============================================================
   11. AVALIAÇÕES
============================================================ */

function renderReviewsSection(p) {
  const el = document.getElementById("reviews-section");
  let reviews = MOCK_REVIEWS[p.id] || [];

  if (state.reviewsFilter !== "todas") {
    reviews = reviews.filter(r => String(r.nota) === state.reviewsFilter);
  }
  reviews = [...reviews].sort((a, b) => {
    if (state.reviewsSort === "recentes") return new Date(b.data) - new Date(a.data);
    if (state.reviewsSort === "melhor") return b.nota - a.nota;
    if (state.reviewsSort === "pior") return a.nota - b.nota;
    return 0;
  });

  el.innerHTML = `
    <div class="reviews-header">
      <div class="reviews-score">
        <div class="big-score">${p.avaliacao.toFixed(1)}</div>
        <div class="stars">${renderStars(p.avaliacao)}</div>
        <p>${p.numAvaliacoes} avaliações</p>
      </div>
      <div class="reviews-controls">
        <select id="reviews-filter-select">
          <option value="todas">Todas as notas</option>
          <option value="5">5 estrelas</option>
          <option value="4">4 estrelas</option>
          <option value="3">3 estrelas</option>
          <option value="2">2 estrelas</option>
          <option value="1">1 estrela</option>
        </select>
        <select id="reviews-sort-select">
          <option value="recentes">Mais recentes</option>
          <option value="melhor">Melhor avaliadas</option>
          <option value="pior">Pior avaliadas</option>
        </select>
      </div>
    </div>
    <div id="reviews-list">
      ${reviews.length ? reviews.map(r => `
        <div class="review-card">
          <div class="review-top">
            <div><strong>${r.nome}</strong> ${r.verificada ? `<span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Compra verificada</span>` : ""}</div>
            <span class="review-meta">${new Date(r.data).toLocaleDateString("pt-BR")} · Tam. ${r.tamanho}</span>
          </div>
          <div class="review-stars">${renderStars(r.nota)}</div>
          <p class="review-body">${r.comentario}</p>
        </div>`).join("") : `<p class="empty-state">Nenhuma avaliação com esse filtro.</p>`}
    </div>
  `;

  document.getElementById("reviews-filter-select").value = state.reviewsFilter;
  document.getElementById("reviews-sort-select").value = state.reviewsSort;
  document.getElementById("reviews-filter-select").addEventListener("change", e => {
    state.reviewsFilter = e.target.value; renderReviewsSection(p);
  });
  document.getElementById("reviews-sort-select").addEventListener("change", e => {
    state.reviewsSort = e.target.value; renderReviewsSection(p);
  });
}

/* ============================================================
   12. LOGIN
============================================================ */

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveUser() {
  if (state.user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
  else localStorage.removeItem(STORAGE_KEYS.USER);
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  if (!email || !password) return;

  try {
    const result = await loginUser({ email, password }); // futuramente: POST /auth/login.php
    if (result.success) {
      state.user = result.user;
      saveUser();
      closeModal("login-modal");
      showToast(`Bem-vindo(a), ${state.user.nome}!`);
      renderAccountPage();
    }
  } catch {
    showToast("Não foi possível entrar. Tente novamente.");
  }
}

function handleLogout() {
  state.user = null;
  saveUser();
  logoutUser();
  showToast("Você saiu da sua conta.");
  renderAccountPage();
}

/* ============================================================
   13. CADASTRO
============================================================ */

function validaCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
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

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const senha = document.getElementById("reg-senha").value;
  const confirm = document.getElementById("reg-senha-confirm").value;
  const cpf = document.getElementById("reg-cpf").value;

  if (senha !== confirm) { showToast("As senhas não coincidem."); return; }
  if (!validaCPF(cpf)) { showToast("CPF inválido. A validação completa ocorrerá no servidor."); return; }

  const user = {
    nome: document.getElementById("reg-nome").value.trim(),
    email: document.getElementById("reg-email").value.trim(),
    cpf, telefone: document.getElementById("reg-telefone").value,
    nascimento: document.getElementById("reg-nascimento").value,
    endereco: {
      cep: document.getElementById("reg-cep").value,
      rua: document.getElementById("reg-rua").value,
      numero: document.getElementById("reg-numero").value,
      complemento: document.getElementById("reg-complemento").value,
      bairro: document.getElementById("reg-bairro").value,
      cidade: document.getElementById("reg-cidade").value,
      estado: document.getElementById("reg-estado").value
    }
    // Senha NUNCA é salva em localStorage; futuramente o PHP fará
    // password_hash() antes de gravar no MySQL.
  };

  try {
    const result = await registerUser({ ...user, senha }); // futuramente: POST /auth/register.php
    if (result.success) {
      state.user = user;
      saveUser();
      closeModal("register-modal");
      showToast("Conta criada com sucesso!");
      renderAccountPage();
    }
  } catch {
    showToast("Não foi possível concluir o cadastro.");
  }
}

/* ============================================================
   14. GUIA DE TAMANHO
============================================================ */

function estimateClothingSize(altura, peso, genero) {
  const imc = peso / Math.pow(altura / 100, 2);
  // Estimativa simples combinando altura e IMC — apenas recomendação.
  let score = 0;
  if (altura < 160) score -= 1; else if (altura > 180) score += 1;
  if (imc < 19) score -= 1;
  else if (imc < 23) score += 0;
  else if (imc < 27) score += 1;
  else if (imc < 31) score += 2;
  else score += 3;

  const sizes = ["PP", "P", "M", "G", "GG"];
  let index = 2 + Math.round(score / 2);
  index = Math.max(0, Math.min(sizes.length - 1, index));
  return sizes[index];
}

function estimateShoeSize(cm) {
  const table = [
    { cm: 23, br: "35" }, { cm: 24, br: "36/37" }, { cm: 25, br: "38" },
    { cm: 26, br: "39/40" }, { cm: 27, br: "41/42" }, { cm: 28, br: "43" }
  ];
  let closest = table[0];
  let minDiff = Infinity;
  table.forEach(row => {
    const diff = Math.abs(row.cm - cm);
    if (diff < minDiff) { minDiff = diff; closest = row; }
  });
  return closest.br;
}

function handleSizeClothesSubmit(e) {
  e.preventDefault();
  const altura = Number(document.getElementById("sg-altura").value);
  const peso = Number(document.getElementById("sg-peso").value);
  const genero = document.getElementById("sg-genero").value;
  const size = estimateClothingSize(altura, peso, genero);
  const result = document.getElementById("size-clothes-result");
  result.hidden = false;
  result.textContent = `Tamanho recomendado: ${size}`;
}

function handleSizeShoesSubmit(e) {
  e.preventDefault();
  const cm = Number(document.getElementById("sg-pe").value);
  const br = estimateShoeSize(cm);
  const result = document.getElementById("size-shoes-result");
  result.hidden = false;
  result.textContent = `Numeração recomendada: ${br}`;
}

/* ============================================================
   15. CHECKOUT
============================================================ */

function renderCheckoutSummary() {
  const container = document.getElementById("checkout-items");
  container.innerHTML = state.cart.map(item => `
    <div class="checkout-line">
      <img src="${item.imagem}" alt="${item.nome}">
      <div>${item.nome}<br><span style="color:#847c6f;">${item.color || ""} · ${item.size || ""} · Qtd ${item.qty}</span></div>
    </div>`).join("") || `<p class="empty-state">Carrinho vazio.</p>`;

  const subtotal = cartSubtotal() - cartDiscount();
  const shippingCost = getSelectedShippingCost();
  document.getElementById("chk-subtotal").textContent = formatBRL(subtotal);
  document.getElementById("chk-shipping").textContent = shippingCost === 0 ? "Grátis" : formatBRL(shippingCost);
  document.getElementById("chk-total").textContent = formatBRL(subtotal + shippingCost);

  const installSelect = document.getElementById("installments-select");
  if (installSelect) {
    installSelect.innerHTML = Array.from({ length: 6 }, (_, i) => i + 1)
      .map(n => `<option value="${n}">${n}x de ${formatBRL((subtotal + shippingCost) / n)} ${n === 1 ? "à vista" : "sem juros"}</option>`).join("");
  }
}

function getSelectedShippingCost() {
  const selected = document.querySelector('input[name="shipping"]:checked');
  if (!selected) return 19.90;
  return { retirada: 0, normal: 19.90, expressa: 39.90 }[selected.value];
}

function switchPaymentTab(method) {
  document.querySelectorAll(".payment-tab").forEach(t => t.classList.toggle("active", t.dataset.payment === method));
  document.querySelectorAll(".payment-panel").forEach(p => p.hidden = p.id !== `payment-${method}`);
}

function handlePlaceOrder() {
  if (!state.cart.length) { showToast("Seu carrinho está vazio."); return; }
  const order = {
    id: Date.now(),
    itens: [...state.cart],
    total: cartSubtotal() - cartDiscount() + getSelectedShippingCost(),
    data: new Date().toISOString(),
    status: "aguardando"
    // Futuramente: POST /orders/create.php com sessão PHP autenticando o cliente
  };
  createOrder(order);
  state.cart = [];
  appliedCoupon = null;
  saveCart();
  renderCartBadge();
  renderCartDrawer();
  showToast("Pedido confirmado! Obrigado por comprar na MILISTORE.");
  showView("home");
}

/* ============================================================
   16. ADMINISTRAÇÃO
============================================================ */

function loadAdminProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_PRODUCTS);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveAdminProducts() {
  localStorage.setItem(STORAGE_KEYS.ADMIN_PRODUCTS, JSON.stringify(state.products));
}

function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById("admin-user").value;
  const pass = document.getElementById("admin-pass").value;
  // Demonstração local apenas — no backend real isso vira sessão PHP
  // validada com password_verify() e controle de permissões de admin.
  if (user === "admin" && pass === "admin123") {
    state.isAdmin = true;
    closeModal("admin-login-modal");
    renderAdminPage();
    showToast("Login administrativo realizado.");
  } else {
    showToast("Usuário ou senha inválidos.");
  }
}

async function renderAdminPage() {
  const el = document.getElementById("admin-page-content");
  if (!state.isAdmin) {
    el.innerHTML = `
      <div class="admin-locked">
        <i class="fa-solid fa-lock"></i>
        <h2>Área restrita</h2>
        <p>Faça login para acessar o painel administrativo da MILISTORE.</p>
        <button class="btn btn-primary" id="open-admin-login">Entrar como administrador</button>
      </div>`;
    document.getElementById("open-admin-login").addEventListener("click", () => openModal("admin-login-modal"));
    return;
  }

  el.innerHTML = `
    <aside class="admin-sidebar">
      <h3>Painel</h3>
      <button data-admin-section="dashboard"><i class="fa-solid fa-gauge"></i> Dashboard</button>
      <h3>Catálogo</h3>
      <button data-admin-section="produtos"><i class="fa-solid fa-shirt"></i> Produtos</button>
      <button data-admin-section="estoque"><i class="fa-solid fa-boxes-stacked"></i> Estoque</button>
      <h3>Vendas</h3>
      <button data-admin-section="pedidos"><i class="fa-solid fa-receipt"></i> Pedidos</button>
      <button data-admin-section="clientes"><i class="fa-solid fa-users"></i> Clientes</button>
      <h3>Sessão</h3>
      <button id="admin-logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Sair do painel</button>
    </aside>
    <div class="admin-content" id="admin-content-area"></div>
  `;

  document.querySelectorAll("[data-admin-section]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.adminSection = btn.dataset.adminSection;
      renderAdminSection();
      document.querySelectorAll("[data-admin-section]").forEach(b => b.classList.toggle("active", b === btn));
    });
  });
  document.getElementById("admin-logout-btn").addEventListener("click", () => {
    state.isAdmin = false;
    renderAdminPage();
  });

  document.querySelector(`[data-admin-section="${state.adminSection}"]`)?.classList.add("active");
  await renderAdminSection();
}

async function renderAdminSection() {
  const area = document.getElementById("admin-content-area");
  if (!area) return;

  if (state.adminSection === "dashboard") {
    const kpis = await getAdminDashboard();
    const lowStock = state.products.filter(p => p.estoque < 15);
    area.innerHTML = `
      <h2>Visão geral</h2>
      <div class="admin-kpis">
        <div class="kpi-card"><span>Produtos cadastrados</span><strong>${kpis.totalProdutos}</strong></div>
        <div class="kpi-card"><span>Pedidos</span><strong>${kpis.totalPedidos}</strong></div>
        <div class="kpi-card"><span>Clientes</span><strong>${kpis.totalClientes}</strong></div>
        <div class="kpi-card"><span>Receita (pedidos válidos)</span><strong>${formatBRL(kpis.receita)}</strong></div>
      </div>
      <div class="admin-chart">
        <h3 style="font-family:var(--font-body);font-size:.95rem;">Pedidos por status</h3>
        <div class="bar-chart">
          ${["aguardando", "pago", "separacao", "enviado", "entregue", "cancelado"].map(status => {
            const count = MOCK_ORDERS.filter(o => o.status === status).length;
            const max = MOCK_ORDERS.length;
            return `<div class="bar" style="height:${Math.max(6, (count / max) * 100)}%"><span>${status}</span></div>`;
          }).join("")}
        </div>
      </div>
      ${lowStock.length ? `
        <div class="kpi-card warn" style="margin-bottom:1rem;">
          <span>Produtos com estoque baixo</span><strong>${lowStock.length}</strong>
        </div>
        <table class="admin-table">
          <thead><tr><th>Produto</th><th>Estoque</th></tr></thead>
          <tbody>${lowStock.map(p => `<tr><td>${p.nome}</td><td>${p.estoque}</td></tr>`).join("")}</tbody>
        </table>` : ""}
    `;
  }

  else if (state.adminSection === "produtos") {
    area.innerHTML = `
      <div class="admin-toolbar">
        <h2 style="margin:0;">Produtos (${state.products.length})</h2>
        <button class="btn btn-primary btn-small" id="new-product-btn"><i class="fa-solid fa-plus"></i> Cadastrar produto</button>
      </div>
      <table class="admin-table">
        <thead><tr><th></th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th></th></tr></thead>
        <tbody>
          ${state.products.map(p => `
            <tr>
              <td><img src="${p.imagens[0]}" alt=""></td>
              <td>${p.nome}</td>
              <td>${p.categoria}</td>
              <td>${formatBRL(p.precoPromocional || p.preco)}</td>
              <td>${p.estoque}</td>
              <td>
                <button class="icon-action" data-edit-product="${p.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-action delete-action" data-delete-product="${p.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
    document.getElementById("new-product-btn").addEventListener("click", () => openProductForm(null));
    document.querySelectorAll("[data-edit-product]").forEach(b => b.addEventListener("click", () => openProductForm(Number(b.dataset.editProduct))));
    document.querySelectorAll("[data-delete-product]").forEach(b => b.addEventListener("click", () => handleDeleteProduct(Number(b.dataset.deleteProduct))));
  }

  else if (state.adminSection === "estoque") {
    const rows = [];
    state.products.forEach(p => {
      p.tamanhos.forEach(t => {
        p.cor.forEach(c => {
          const baixo = p.estoqueBaixoTamanhos.includes(t);
          rows.push({ nome: p.nome, tamanho: t, cor: c, qtd: baixo ? Math.max(1, Math.round(p.estoque / (p.tamanhos.length * p.cor.length)) - 2) : Math.round(p.estoque / (p.tamanhos.length * p.cor.length)) });
        });
      });
    });
    area.innerHTML = `
      <h2>Controle de estoque</h2>
      <table class="admin-table">
        <thead><tr><th>Produto</th><th>Tamanho</th><th>Cor</th><th>Quantidade</th></tr></thead>
        <tbody>
          ${rows.slice(0, 40).map(r => `
            <tr>
              <td>${r.nome}</td><td>${r.tamanho}</td><td>${r.cor}</td>
              <td style="${r.qtd <= 3 ? "color:var(--error);font-weight:700;" : ""}">${r.qtd}${r.qtd <= 3 ? " · baixo" : ""}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  else if (state.adminSection === "pedidos") {
    const orders = await getOrders();
    const statusLabel = { aguardando: "Aguardando pagamento", pago: "Pago", separacao: "Em separação", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
    area.innerHTML = `
      <h2>Pedidos</h2>
      <table class="admin-table">
        <thead><tr><th>ID</th><th>Cliente</th><th>Data</th><th>Valor</th><th>Pagamento</th><th>Status</th></tr></thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td>#${o.id}</td><td>${o.cliente}</td><td>${new Date(o.data).toLocaleDateString("pt-BR")}</td>
              <td>${formatBRL(o.valor)}</td><td>${o.pagamento}</td>
              <td><span class="status-tag status-${o.status}">${statusLabel[o.status]}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  else if (state.adminSection === "clientes") {
    area.innerHTML = `
      <h2>Clientes</h2>
      <table class="admin-table">
        <thead><tr><th>Nome</th><th>E-mail</th><th>Cadastro</th><th>Pedidos</th><th>Total gasto</th></tr></thead>
        <tbody>
          ${MOCK_CUSTOMERS.map(c => `
            <tr>
              <td>${c.nome}</td><td>${c.email}</td><td>${new Date(c.cadastro).toLocaleDateString("pt-BR")}</td>
              <td>${c.pedidos}</td><td>${formatBRL(c.total)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
  }
}

function openProductForm(id) {
  state.editingProductId = id;
  const p = id ? state.products.find(x => x.id === id) : null;
  const formHtml = `
  <div class="modal product-form-modal" id="product-form-modal" role="dialog" aria-modal="true">
    <div class="modal-card">
      <button class="icon-btn modal-close" id="close-product-form" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
      <h2>${p ? "Editar produto" : "Cadastrar produto"}</h2>
      <form id="product-form">
        <div class="form-grid-2">
          <label>Nome <input type="text" id="pf-nome" value="${p ? p.nome : ""}" required></label>
          <label>Categoria <input type="text" id="pf-categoria" value="${p ? p.categoria : ""}" required></label>
          <label>Público
            <select id="pf-publico">
              <option value="feminino" ${p?.publico === "feminino" ? "selected" : ""}>Feminino</option>
              <option value="masculino" ${p?.publico === "masculino" ? "selected" : ""}>Masculino</option>
              <option value="infantil" ${p?.publico === "infantil" ? "selected" : ""}>Infantil</option>
            </select>
          </label>
          <label>Estilo <input type="text" id="pf-estilo" value="${p ? p.estilo : "casual"}"></label>
          <label>Preço <input type="number" step="0.01" id="pf-preco" value="${p ? p.preco : ""}" required></label>
          <label>Preço promocional <input type="number" step="0.01" id="pf-preco-promo" value="${p && p.precoPromocional ? p.precoPromocional : ""}"></label>
          <label>Estoque <input type="number" id="pf-estoque" value="${p ? p.estoque : 10}" required></label>
          <label>Tamanhos (separados por vírgula) <input type="text" id="pf-tamanhos" value="${p ? p.tamanhos.join(", ") : "P, M, G"}"></label>
          <label>Cores (separadas por vírgula) <input type="text" id="pf-cores" value="${p ? p.cor.join(", ") : "Preto, Branco"}"></label>
          <label>Material <input type="text" id="pf-material" value="${p ? p.tecido : ""}"></label>
          <label>Imagem principal (URL) <input type="url" id="pf-imagem" value="${p ? p.imagens[0] : ""}"></label>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${p ? "Salvar alterações" : "Cadastrar produto"}</button>
        <p class="field-note">Estas operações ficam em memória/localStorage; futuramente usarão os endpoints /products/create.php e /products/update.php.</p>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", formHtml);
  document.getElementById("close-product-form").addEventListener("click", () => document.getElementById("product-form-modal").remove());
  document.getElementById("product-form").addEventListener("submit", handleProductFormSubmit);
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const data = {
    nome: document.getElementById("pf-nome").value,
    categoria: document.getElementById("pf-categoria").value,
    publico: document.getElementById("pf-publico").value,
    estilo: document.getElementById("pf-estilo").value,
    preco: Number(document.getElementById("pf-preco").value),
    precoPromocional: document.getElementById("pf-preco-promo").value ? Number(document.getElementById("pf-preco-promo").value) : null,
    estoque: Number(document.getElementById("pf-estoque").value),
    tamanhos: document.getElementById("pf-tamanhos").value.split(",").map(s => s.trim()).filter(Boolean),
    cor: document.getElementById("pf-cores").value.split(",").map(s => s.trim()).filter(Boolean),
    tecido: document.getElementById("pf-material").value,
    composicao: "—", modelagem: "—", lavagem: "—", origem: "Brasil",
    estoqueBaixoTamanhos: [],
    imagens: [document.getElementById("pf-imagem").value || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop"],
    avaliacao: 5, numAvaliacoes: 0
  };

  if (state.editingProductId) {
    const result = await updateProduct(state.editingProductId, data);
    const idx = state.products.findIndex(p => p.id === state.editingProductId);
    state.products[idx] = { ...state.products[idx], ...data };
    showToast("Produto atualizado.");
  } else {
    const created = await createProduct(data);
    state.products.push({ ...data, id: created.id });
    showToast("Produto cadastrado.");
  }
  saveAdminProducts();
  document.getElementById("product-form-modal").remove();
  renderAdminSection();
  renderProductGrid();
}

async function handleDeleteProduct(id) {
  if (!confirm("Excluir este produto?")) return;
  await deleteProduct(id);
  state.products = state.products.filter(p => p.id !== id);
  saveAdminProducts();
  showToast("Produto excluído.");
  renderAdminSection();
  renderProductGrid();
}

/* ============================================================
   ACCOUNT / MINHA CONTA
============================================================ */

function renderAccountPage() {
  const el = document.getElementById("account-page-content");
  if (!state.user) {
    el.innerHTML = `
      <div class="guest-account">
        <i class="fa-regular fa-user"></i>
        <h2>Entre para ver seus dados</h2>
        <p>Acesse pedidos, favoritos e seus endereços salvos.</p>
        <button class="btn btn-primary" id="account-login-btn">Entrar ou cadastrar</button>
      </div>`;
    document.getElementById("account-login-btn").addEventListener("click", () => openModal("login-modal"));
    return;
  }

  el.innerHTML = `
    <div class="account-grid">
      <nav class="account-menu">
        <button class="active" data-account-tab="dados">Meus dados</button>
        <button data-account-tab="pedidos">Meus pedidos</button>
        <button data-account-tab="enderecos">Endereços</button>
        <button data-account-tab="favoritos">Favoritos</button>
        <button data-account-tab="senha">Alterar senha</button>
        <button id="account-logout-btn">Sair</button>
      </nav>
      <div class="account-panel" id="account-panel-content"></div>
    </div>`;

  document.querySelectorAll("[data-account-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-account-tab]").forEach(b => b.classList.toggle("active", b === btn));
      renderAccountTab(btn.dataset.accountTab);
    });
  });
  document.getElementById("account-logout-btn").addEventListener("click", handleLogout);
  renderAccountTab("dados");
}

function renderAccountTab(tab) {
  const panel = document.getElementById("account-panel-content");
  const u = state.user;
  if (tab === "dados") {
    panel.innerHTML = `
      <h2 style="font-family:var(--font-body);font-size:1.1rem;">Meus dados</h2>
      <div class="account-form">
        <label>Nome completo <input type="text" value="${u.nome || ""}"></label>
        <label>E-mail <input type="email" value="${u.email || ""}"></label>
        <label>CPF <input type="text" value="${u.cpf || ""}"></label>
        <label>Telefone <input type="tel" value="${u.telefone || ""}"></label>
      </div>`;
  } else if (tab === "pedidos") {
    panel.innerHTML = `<h2 style="font-family:var(--font-body);font-size:1.1rem;">Meus pedidos</h2>` +
      MOCK_ORDERS.slice(0, 3).map(o => `<div class="order-row"><span>#${o.id} · ${new Date(o.data).toLocaleDateString("pt-BR")}</span><span>${formatBRL(o.valor)}</span><span class="status-tag status-${o.status}">${o.status}</span></div>`).join("");
  } else if (tab === "enderecos") {
    const e = u.endereco || {};
    panel.innerHTML = `
      <h2 style="font-family:var(--font-body);font-size:1.1rem;">Endereços</h2>
      <p style="font-size:.9rem;color:var(--dark-soft);">${e.rua || "—"}, ${e.numero || ""} — ${e.bairro || ""}, ${e.cidade || ""}/${e.estado || ""} · CEP ${e.cep || "—"}</p>`;
  } else if (tab === "favoritos") {
    const list = state.products.filter(p => state.favorites.includes(p.id));
    panel.innerHTML = `<h2 style="font-family:var(--font-body);font-size:1.1rem;">Favoritos</h2><div class="product-grid">${list.map(productCardTemplate).join("") || "<p class='empty-state'>Nenhum favorito ainda.</p>"}</div>`;
  } else if (tab === "senha") {
    panel.innerHTML = `
      <h2 style="font-family:var(--font-body);font-size:1.1rem;">Alterar senha</h2>
      <div class="account-form">
        <label>Senha atual <input type="password"></label>
        <label>Nova senha <input type="password"></label>
      </div>
      <p class="field-note">A alteração real de senha será processada com password_hash() no backend PHP.</p>`;
  }
}

/* ============================================================
   TOASTS / MODAIS / VIEWS (utilidades de UI)
============================================================ */

function showToast(msg) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function openModal(id) {
  document.getElementById(id).hidden = false;
  document.getElementById("overlay").classList.add("active");
}
function closeModal(id) {
  document.getElementById(id).hidden = true;
  document.getElementById("overlay").classList.remove("active");
}
function closeAllModals() {
  document.querySelectorAll(".modal").forEach(m => m.hidden = true);
  document.getElementById("overlay").classList.remove("active");
  closeCartDrawer();
  document.getElementById("main-nav").classList.remove("open");
  document.getElementById("filters-panel").classList.remove("open");
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("view-active"));
  document.getElementById(`view-${viewId}`).classList.add("view-active");
  state.currentView = viewId;

  document.querySelectorAll(".main-nav a[data-view]").forEach(a => {
    a.classList.toggle("active", a.dataset.view === viewId && !a.dataset.publico && !a.dataset.categoria);
  });

  if (viewId === "favorites") renderFavoritesPage();
  if (viewId === "checkout") { renderCheckoutSummary(); }
  if (viewId === "account") renderAccountPage();
  if (viewId === "admin") renderAdminPage();
  closeCartDrawer();
  document.getElementById("main-nav").classList.remove("open");
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* ============================================================
   17. EVENTOS
============================================================ */

function bindEvents() {
  // Navegação principal
  document.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showView(el.dataset.view);
      if (el.dataset.publico) {
        clearFilters();
        state.filters.publico.add(el.dataset.publico);
        updateFilterUI(); renderProductGrid();
        setTimeout(() => scrollToId("monte-seu-estilo"), 150);
      } else if (el.dataset.categoria) {
        clearFilters();
        state.filters.categoria.add(el.dataset.categoria);
        updateFilterUI(); renderProductGrid();
        setTimeout(() => scrollToId("monte-seu-estilo"), 150);
      } else if (el.dataset.ofertas) {
        clearFilters();
        state.filters.ofertas = true;
        renderProductGrid();
        setTimeout(() => scrollToId("monte-seu-estilo"), 150);
      }
      document.querySelectorAll(".main-nav a").forEach(a => a.classList.toggle("active", a === el));
    });
  });

  // Categoria cards (home)
  document.getElementById("category-grid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-category-nav]");
    if (!card) return;
    clearFilters();
    state.filters.publico.clear();
    const key = card.dataset.categoryNav;
    if (["feminino", "masculino", "infantil"].includes(key)) state.filters.publico.add(key);
    else state.filters.categoria.add(key);
    updateFilterUI(); renderProductGrid();
    scrollToId("monte-seu-estilo");
  });

  // Scroll suave de botões do hero
  document.querySelectorAll("[data-scroll-to]").forEach(btn => {
    btn.addEventListener("click", () => scrollToId(btn.dataset.scrollTo));
  });

  // Hamburger + menu mobile
  document.getElementById("hamburger-btn").addEventListener("click", () => {
    document.getElementById("main-nav").classList.add("open");
    document.getElementById("overlay").classList.add("active");
  });

  // Busca
  document.getElementById("search-form").addEventListener("submit", handleSearchSubmit);
  document.getElementById("mobile-search-btn").addEventListener("click", () => {
    const q = prompt("O que você está procurando?");
    if (q !== null) {
      document.getElementById("search-input").value = q;
      state.filters.busca = q.trim();
      showView("home"); renderProductGrid(); scrollToId("monte-seu-estilo");
    }
  });

  // Carrinho
  document.getElementById("cart-btn").addEventListener("click", openCartDrawer);
  document.getElementById("close-cart-btn").addEventListener("click", closeCartDrawer);
  document.getElementById("apply-coupon-btn").addEventListener("click", applyCoupon);
  document.getElementById("checkout-btn").addEventListener("click", () => {
    if (!state.cart.length) { showToast("Seu carrinho está vazio."); return; }
    closeCartDrawer();
    showView("checkout");
  });
  document.getElementById("cart-items-container").addEventListener("click", (e) => {
    const up = e.target.closest("[data-cart-qty-up]");
    const down = e.target.closest("[data-cart-qty-down]");
    const rm = e.target.closest("[data-cart-remove]");
    if (up) changeCartQty(Number(up.dataset.cartQtyUp), 1);
    if (down) changeCartQty(Number(down.dataset.cartQtyDown), -1);
    if (rm) removeCartLine(Number(rm.dataset.cartRemove));
  });

  // Overlay fecha tudo
  document.getElementById("overlay").addEventListener("click", closeAllModals);

  // Modais: fechar
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });

  // Login / Cadastro
  document.getElementById("account-btn").addEventListener("click", (e) => {
    e.preventDefault();
    showView("account");
  });
  document.getElementById("login-form").addEventListener("submit", handleLoginSubmit);
  document.getElementById("register-form").addEventListener("submit", handleRegisterSubmit);
  document.getElementById("go-to-register").addEventListener("click", (e) => { e.preventDefault(); closeModal("login-modal"); openModal("register-modal"); });
  document.getElementById("go-to-login").addEventListener("click", (e) => { e.preventDefault(); closeModal("register-modal"); openModal("login-modal"); });
  document.getElementById("forgot-password-link").addEventListener("click", (e) => { e.preventDefault(); showToast("Um link de redefinição será enviado para o seu e-mail (em breve)."); });
  document.querySelectorAll(".toggle-password").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });
  });

  // Guia de tamanhos
  document.getElementById("open-size-guide-home").addEventListener("click", () => openModal("size-guide-modal"));
  document.getElementById("footer-size-guide-link").addEventListener("click", (e) => { e.preventDefault(); openModal("size-guide-modal"); });
  document.getElementById("pd-size-guide-btn-placeholder");
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-panel").forEach(p => p.hidden = p.id !== btn.dataset.tab);
    });
  });
  document.getElementById("size-clothes-form").addEventListener("submit", handleSizeClothesSubmit);
  document.getElementById("size-shoes-form").addEventListener("submit", handleSizeShoesSubmit);

  // Filtros
  document.querySelectorAll(".chip-group .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const group = chip.closest("[data-filter]").dataset.filter;
      toggleSetFilter(group, chip.dataset.value);
      updateFilterUI();
      renderProductGrid();
    });
  });
  document.getElementById("color-filter-group").addEventListener("click", (e) => {
    const sw = e.target.closest(".color-swatch");
    if (!sw) return;
    toggleSetFilter("cor", sw.dataset.value);
    updateFilterUI();
    renderProductGrid();
  });
  document.getElementById("price-min").addEventListener("input", (e) => {
    state.filters.precoMin = e.target.value ? Number(e.target.value) : null;
    renderProductGrid();
  });
  document.getElementById("price-max").addEventListener("input", (e) => {
    state.filters.precoMax = e.target.value ? Number(e.target.value) : null;
    renderProductGrid();
  });
  document.getElementById("price-slider").addEventListener("input", (e) => {
    state.filters.precoMax = Number(e.target.value);
    document.getElementById("price-max").value = e.target.value;
    renderProductGrid();
  });
  document.getElementById("clear-filters-btn").addEventListener("click", clearFilters);
  document.getElementById("sort-select").addEventListener("change", (e) => { state.sort = e.target.value; renderProductGrid(); });

  // Filtros mobile (drawer)
  document.getElementById("mobile-filter-toggle").addEventListener("click", () => {
    document.getElementById("filters-panel").classList.add("open");
    document.getElementById("overlay").classList.add("active");
  });
  document.getElementById("close-filters-btn").addEventListener("click", () => {
    document.getElementById("filters-panel").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  });
  document.getElementById("apply-filters-mobile-btn").addEventListener("click", () => {
    document.getElementById("filters-panel").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  });

  // Grid de produtos: delegação de eventos (abrir produto, favoritar, adicionar rápido)
  document.body.addEventListener("click", (e) => {
    const openEl = e.target.closest("[data-open-product]");
    const favEl = e.target.closest("[data-toggle-fav]");
    const quickAddEl = e.target.closest("[data-quick-add]");
    if (favEl) { e.stopPropagation(); toggleFavorite(Number(favEl.dataset.toggleFav)); return; }
    if (quickAddEl) {
      e.stopPropagation();
      const p = state.products.find(pp => pp.id === Number(quickAddEl.dataset.quickAdd));
      if (p) addToCart(p, p.tamanhos[0], p.cor[0], 1);
      return;
    }
    if (openEl) { openProductPage(Number(openEl.dataset.openProduct)); return; }
  });

  // Página de produto: interações dinâmicas
  document.getElementById("view-product").addEventListener("click", (e) => {
    const thumb = e.target.closest("[data-thumb]");
    const sizeBtn = e.target.closest(".size-option");
    const colorBtn = e.target.closest(".color-option");
    const sizeGuide = e.target.closest("#pd-size-guide-btn");
    const addCart = e.target.closest("#pd-add-cart");
    const buyNow = e.target.closest("#pd-buy-now");
    const qtyUp = e.target.closest("#pd-qty-up");
    const qtyDown = e.target.closest("#pd-qty-down");

    if (thumb) { state.activeImageIndex = Number(thumb.dataset.thumb); renderProductPage(state.currentProduct.id, false); }
    if (sizeBtn && !sizeBtn.classList.contains("disabled")) { state.selectedSize = sizeBtn.dataset.size; renderProductPage(state.currentProduct.id, false); }
    if (colorBtn) { state.selectedColor = colorBtn.dataset.color; renderProductPage(state.currentProduct.id, false); }
    if (sizeGuide) openModal("size-guide-modal");
    if (qtyUp) { state.selectedQty++; document.getElementById("pd-qty-value").textContent = state.selectedQty; }
    if (qtyDown && state.selectedQty > 1) { state.selectedQty--; document.getElementById("pd-qty-value").textContent = state.selectedQty; }
    if (addCart || buyNow) {
      if (!state.selectedSize) { showToast("Selecione um tamanho antes de continuar."); return; }
      addToCart(state.currentProduct, state.selectedSize, state.selectedColor, state.selectedQty);
      if (buyNow) { closeCartDrawer(); showView("checkout"); }
    }
  });

  // Checkout
  document.querySelectorAll(".payment-tab").forEach(tab => {
    tab.addEventListener("click", () => switchPaymentTab(tab.dataset.payment));
  });
  document.querySelectorAll('input[name="shipping"]').forEach(r => {
    r.addEventListener("change", renderCheckoutSummary);
  });
  document.getElementById("place-order-btn").addEventListener("click", handlePlaceOrder);

  // Admin login
  document.getElementById("admin-login-form").addEventListener("submit", handleAdminLogin);

  // Ano do rodapé
  document.getElementById("footer-year").textContent = new Date().getFullYear();

  // ESC fecha modais/drawers
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllModals(); });

  // Atalho secreto para acessar o admin (demonstração): Ctrl+Alt+A
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
      showView("admin");
    }
  });
}

/* ============================================================
   18. INICIALIZAÇÃO DA APLICAÇÃO
============================================================ */

async function init() {
  renderCategoryGrid();
  renderColorFilters();

  if (USE_API) {
    try {
      state.products = await getProducts();
    } catch (error) {
      console.error("Não foi possível carregar os produtos:", error);
      showToast("Erro ao carregar produtos.");
    }
  }

  renderProductGrid();
  renderCartBadge();
  renderFavoritesBadge();
  renderCartDrawer();
  bindEvents();
  showView("home");

  console.log("MILISTORE — frontend inicializado. USE_API =", USE_API);
}

document.addEventListener("DOMContentLoaded", init);