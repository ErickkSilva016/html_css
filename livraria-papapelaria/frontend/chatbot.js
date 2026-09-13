/**
 * Assistente virtual da Gutenberg (chatbot).
 *
 * Arquivo isolado e independente de script.js. Regras seguidas:
 *  - NÃO cria um novo sistema de autenticação: lê o mesmo `state.user`
 *    que script.js já mantém (populado a partir do localStorage
 *    'gutenberg-user' preenchido pelo login/cadastro existentes).
 *  - NÃO cria uma segunda lista de produtos: lê `state.books` e
 *    `state.stationery`, os mesmos arrays que script.js carrega a partir
 *    da API já existente (GET /api/produtos) e usa para renderizar a
 *    loja. Se por algum motivo ainda não estiverem carregados, chama a
 *    própria função `loadProducts()` do script.js (reaproveitada, não
 *    duplicada).
 *  - Todas as funções, IDs e classes usadas aqui têm o prefixo "gtb"
 *    para nunca colidir com o que já existe no projeto.
 */
(function () {
  'use strict';

  // ---------- Acesso seguro ao que já existe em script.js ----------
  // script.js e chatbot.js são scripts clássicos carregados na mesma
  // página (ambos com `defer`), então compartilham o mesmo escopo global
  // de topo: variáveis/funções declaradas em script.js (state, apiRequest,
  // formatPrice, escapeHtml, loadProducts) já estão acessíveis aqui.
  function getGlobal(name) {
    try {
      // eslint-disable-next-line no-undef
      return typeof window[name] !== 'undefined' ? window[name] : eval('typeof ' + name + " !== 'undefined' ? " + name + ' : undefined');
    } catch (_e) {
      return undefined;
    }
  }

  function getState() { return getGlobal('state'); }

  function fmtPrice(value) {
    var fp = getGlobal('formatPrice');
    if (typeof fp === 'function') return fp(value);
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function escHtml(value) {
    var esc = getGlobal('escapeHtml');
    if (typeof esc === 'function') return esc(value);
    var div = document.createElement('div');
    div.textContent = String(value == null ? '' : value);
    return div.innerHTML;
  }

  async function ensureProductsLoaded() {
    var s = getState();
    if (!s) return;
    var hasBooks = Array.isArray(s.books) && s.books.length;
    var hasStationery = Array.isArray(s.stationery) && s.stationery.length;
    if (hasBooks || hasStationery) return;
    var loader = getGlobal('loadProducts');
    if (typeof loader === 'function') {
      try { await loader(); } catch (_e) { /* silencioso: mantém catálogo vazio */ }
    }
  }

  function getCatalog() {
    var s = getState();
    var books = s && Array.isArray(s.books) ? s.books : [];
    var stationery = s && Array.isArray(s.stationery) ? s.stationery : [];
    return { books: books, stationery: stationery, all: books.concat(stationery) };
  }

  function getCurrentUser() {
    var s = getState();
    return s ? s.user : null;
  }

  // ---------- Utilitários de texto ----------
  function normalize(str) {
    return String(str == null ? '' : str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function firstName(user) {
    if (!user || !user.nome) return '';
    return String(user.nome).trim().split(/\s+/)[0];
  }

  // ---------- Busca de produtos ----------
  function findProductMatches(normMsg, list) {
    return list.filter(function (p) {
      var t = normalize(p.titulo);
      if (!t) return false;
      if (normMsg.indexOf(t) !== -1) return true;
      var words = t.split(/\s+/).filter(function (w) { return w.length > 3; });
      if (!words.length) return false;
      var hits = words.filter(function (w) { return normMsg.indexOf(w) !== -1; }).length;
      return hits >= Math.max(1, Math.ceil(words.length * 0.6));
    });
  }

  function listLine(p) {
    var estoqueInfo = (p.estoque != null) ? (Number(p.estoque) > 0 ? '' : ' (sem estoque no momento)') : '';
    return '• ' + p.titulo + ' — ' + fmtPrice(p.preco) + estoqueInfo;
  }

  function describeProduct(p) {
    var linhas = [];
    linhas.push((p.categoria === 'papelaria' ? '📎 ' : '📚 ') + p.titulo);
    linhas.push('Preço: ' + fmtPrice(p.preco));
    if (p.estoque != null) linhas.push('Estoque: ' + (Number(p.estoque) > 0 ? Number(p.estoque) + ' unidade(s) disponíveis' : 'sem estoque no momento'));
    if (p.genero) linhas.push('Gênero/categoria: ' + p.genero);
    if (p.promocao) linhas.push('Está em promoção! 🎉');
    return linhas.join('\n');
  }

  // ==========================================================================
  // A PARTIR DAQUI: lógica de interpretação de mensagens e geração de
  // respostas do chatbot (repertório de conversação). Esta é a ÚNICA parte
  // do arquivo alterada nesta atualização — nada de interface, autenticação
  // ou fonte de produtos foi tocado (ver funções acima, inalteradas).
  // ==========================================================================

  // ---------- Variação controlada de respostas (evita repetição literal) ----------
  // Percorre cada lista de respostas de forma cíclica (sem aleatoriedade
  // exagerada), conforme pedido: "pode utilizar arrays de respostas e
  // selecionar uma resposta de forma controlada".
  var responseCycles = Object.create(null);
  function pick(key, options) {
    if (!options || !options.length) return '';
    var i = responseCycles[key] || 0;
    responseCycles[key] = (i + 1) % options.length;
    return options[i];
  }

  // ---------- Contexto de curtíssimo prazo da conversa ----------
  // Permite entender uma resposta curta (ex.: só "fantasia") quando ela
  // responde à pergunta anterior do bot, sem exigir repetir tudo de novo.
  // Vive apenas em memória enquanto a página estiver aberta.
  var context = { pendingGenre: false, pendingIntensity: false, lastGenre: null };

  // ---------- Tolerância a gírias/abreviações comuns ----------
  var SLANG_MAP = {
    vc: 'voce', vcs: 'voces', blz: 'beleza', tbm: 'tambem', obg: 'obrigado',
    obgd: 'obrigado', vlw: 'valeu', flw: 'falou', pq: 'porque', oq: 'o que'
  };
  function denoise(normMsg) {
    return normMsg.replace(/\b(vc|vcs|blz|tbm|obg|obgd|vlw|flw|pq|oq)\b/g, function (m) { return SLANG_MAP[m]; });
  }

  // ---------- Gêneros realmente cadastrados no catálogo (dado real) ----------
  function catalogGenres(catalog) {
    var set = {};
    catalog.books.forEach(function (b) { var g = normalize(b.genero); if (g) set[g] = b.genero; });
    return set;
  }

  // Mapeia termos naturais para os gêneros de fato existentes no sistema —
  // não inventa categorias que o catálogo não tenha.
  var GENRE_SYNONYMS = {
    romance: ['romance', 'romantico', 'romanticos', 'romantica'],
    fantasia: ['fantasia', 'fantasias'],
    'ficcao cientifica': ['ficcao cientifica', 'ficcao-cientifica', 'sci-fi', 'scifi'],
    ficcao: ['ficcao'],
    classicos: ['classico', 'classicos'],
    'literatura russa': ['literatura russa', 'russa', 'russos'],
    aventura: ['aventura', 'aventuras'],
    suspense: ['suspense'],
    terror: ['terror'],
    infantil: ['infantil', 'infantis', 'crianca', 'criancas'],
    juvenil: ['juvenil', 'juvenis']
  };

  function detectGenreTerm(normMsg) {
    var achado = null;
    Object.keys(GENRE_SYNONYMS).some(function (canon) {
      return GENRE_SYNONYMS[canon].some(function (syn) {
        if (normMsg.indexOf(syn) !== -1) { achado = canon; return true; }
        return false;
      });
    });
    return achado;
  }

  function genreMatches(catalog, termoCanon) {
    var generosCatalogo = catalogGenres(catalog);
    var chave = Object.keys(generosCatalogo).filter(function (g) { return g.indexOf(termoCanon) !== -1 || termoCanon.indexOf(g) !== -1; });
    if (!chave.length) return [];
    return catalog.books.filter(function (b) { return chave.indexOf(normalize(b.genero)) !== -1; });
  }

  // ---------- Intenção: literatura (repertório programado, ampliado) ----------
  var LITERATURE_RULES = [
    { test: /diferenca.*fantasia.*ficcao cientifica|ficcao cientifica.*fantasia/, answer: 'Fantasia costuma trazer elementos mágicos e mundos que não seguem as leis da física, como magia e criaturas míticas. Ficção científica se apoia em ciência e tecnologia, mesmo que futurista. Os dois brincam com o "e se...", mas por caminhos diferentes 😊' },
    { test: /diferenca.*ficcao.*nao\s*ficcao|nao\s*ficcao.*ficcao/, answer: 'Ficção é uma história inventada pelo autor, mesmo quando se inspira em fatos reais. Não ficção conta acontecimentos reais, como biografias, ensaios e livros de história.' },
    { test: /o que e (um |uma )?romance\b/, answer: 'Romance é uma narrativa longa em prosa que acompanha personagens e uma história ao longo do tempo, com um enredo geralmente mais desenvolvido que um conto.' },
    { test: /o que e (uma )?fantasia\b/, answer: 'Fantasia é um gênero literário com elementos que não existem no mundo real, como magia, criaturas fantásticas e mundos inventados.' },
    { test: /o que e (uma )?ficcao cientifica/, answer: 'Ficção científica é o gênero que imagina como a ciência e a tecnologia podem transformar o futuro ou outros mundos, com viagens espaciais, robôs e universos alternativos.' },
    { test: /o que e (uma )?nao\s*ficcao/, answer: 'Não ficção é o gênero de livros baseados em fatos reais, como biografias, ensaios e livros de história.' },
    { test: /o que e (uma )?ficcao\b/, answer: 'Ficção é qualquer história inventada pelo autor — personagens, fatos e lugares que não precisam ter acontecido de verdade.' },
    { test: /o que e (um )?suspense\b/, answer: 'Suspense é um gênero construído para manter a tensão: o leitor fica na expectativa do que vai acontecer, geralmente com mistérios a serem resolvidos.' },
    { test: /o que e (um )?terror\b/, answer: 'Terror é o gênero que busca causar medo ou tensão no leitor, com elementos sombrios ou perturbadores.' },
    { test: /o que e (uma )?aventura\b/, answer: 'Aventura é um gênero centrado em jornadas e desafios, com personagens enfrentando obstáculos em busca de um objetivo.' },
    { test: /o que e (um )?classico\b/, answer: 'Um clássico é uma obra que resistiu ao tempo: continua sendo lida, comentada e influenciando outros livros décadas (ou séculos) depois de ter sido escrita.' },
    { test: /o que e literatura\b/, answer: 'Literatura é a arte de contar histórias e expressar ideias através da escrita, em prosa, poesia ou teatro, e em diversos gêneros.' },
    { test: /por que ler( livros)?\b|importancia da leitura/, answer: 'Ler amplia repertório, desenvolve empatia e melhora o vocabulário — além de ser uma ótima forma de relaxar. Cada livro pode te levar a um lugar diferente 😊' },
    { test: /nao gosto de ler|como (comecar|criar habito) a? ?ler|habito de leitura/, answer: 'Uma boa dica é começar com algo curto, de um gênero que você já curta em filme ou série — ajuda a pegar gosto sem parecer obrigação. Posso te ajudar a achar algo assim por aqui!' },
    { test: /genero mais facil( para comecar)?/, answer: 'Livros de aventura ou romances mais leves costumam ser um bom começo: ritmo ágil e fácil de se envolver com a história.' },
    { test: /(indique|indica).*genero|quais (sao os )?generos|generos literarios/, answer: 'Alguns gêneros literários bem conhecidos são: romance, ficção científica, fantasia, terror, suspense, biografia, poesia e não ficção. Se quiser, posso ver o que temos desses gêneros na loja!' },
  ];

  function literatureIntentMatches(normMsg) {
    return /o que e (um |uma )?(romance|fantasia|suspense|terror|aventura|classico)\b/.test(normMsg)
      || /o que e (uma )?(ficcao cientifica|ficcao|nao\s*ficcao)\b/.test(normMsg)
      || /o que e literatura\b/.test(normMsg)
      || /diferenca.*(ficcao|fantasia)/.test(normMsg)
      || /por que ler|importancia da leitura/.test(normMsg)
      || /nao gosto de ler|habito de leitura|genero mais facil/.test(normMsg)
      || /(indique|indica).*genero|quais (sao os )?generos|generos literarios/.test(normMsg);
  }

  function answerLiterature(normMsg) {
    for (var i = 0; i < LITERATURE_RULES.length; i++) {
      if (LITERATURE_RULES[i].test.test(normMsg)) return LITERATURE_RULES[i].answer;
    }
    return 'Boa pergunta! Posso falar sobre gêneros literários, o que é ficção, romance, clássicos, ou por que vale a pena ler. O que você gostaria de saber? 📖';
  }

  // ---------- Intenção: sobre o próprio bot ----------
  function aboutBotIntentMatches(normMsg) {
    return /quem e voce\b|o que voce e\b|voce e um robo|voce e uma ia|como voce funciona|qual (e )?seu nome|voce pode me ajudar|o que voce sabe fazer/.test(normMsg);
  }
  function answerAboutBot() {
    return pick('aboutBot', [
      'Sou o assistente virtual da nossa livraria! Posso conversar com você e ajudar com livros e produtos da loja. 📚',
      'Sou um assistente virtual daqui da Gutenberg — bato um papo, respondo dúvidas sobre livros e ajudo a achar produtos no catálogo. 😊',
      'Pode me chamar de assistente da Gutenberg! Tô aqui pra ajudar com livros, papelaria e dúvidas sobre a loja.'
    ]);
  }

  // ---------- Intenção: agradecimento ----------
  function thanksIntentMatches(normMsg) {
    return /\b(obrigad[oa]s?|obg|obgd|valeu|vlw)\b|ajudou muito|^era isso$|^perfeito$|^resolveu$/.test(normMsg);
  }
  function answerThanks() {
    return pick('thanks', ['Por nada! 😊', 'Disponha!', 'Tmj! 😄', 'Fico feliz em ajudar!', 'Por nada! Boa leitura! 📚']);
  }

  // ---------- Intenção: despedida ----------
  function farewellIntentMatches(normMsg) {
    return /\b(tchau|ate mais|ate logo|ate depois|falou|flw|fui|nos vemos|vou indo)\b/.test(normMsg);
  }
  function answerFarewell() {
    return pick('farewell', ['Até mais! 👋', 'Tchau! Boa leitura! 📚', 'Até logo! 😊', 'Falou! Volte sempre.']);
  }

  // ---------- Intenção: ajuda para escolher livro / recomendação ----------
  function wantsHelpChoosing(normMsg) {
    if (detectGenreTerm(normMsg)) return false; // já disse o gênero, não precisa perguntar de novo
    return /quero (um |uma )?livro\b|nao sei o que ler|me ajuda a escolher( um livro)?|nao sei qual livro/.test(normMsg);
  }
  function wantsRecommendation(normMsg) {
    return /me recomenda um livro|qual livro voce recomenda|me indica um livro|quero uma indicacao|qual livro devo ler/.test(normMsg);
  }
  var INTENSITY_RE = /leve|tranquil[ao]|calma|intensa|intenso|forte|pesada|emocionante/;

  function askGenrePreference() {
    context.pendingGenre = true;
    context.pendingIntensity = false;
    return pick('askGenre', [
      'Sem problema! 😄 Você prefere romance, fantasia, aventura, suspense ou outro gênero?',
      'Claro! 😄 Você curte mais romance, fantasia, suspense, aventura ou outro gênero?'
    ]);
  }

  function handleGenreAnswer(normMsg, catalog) {
    var termo = detectGenreTerm(normMsg);
    context.pendingGenre = false;
    if (!termo) {
      var generosDisponiveis = Object.keys(catalogGenres(catalog));
      return 'Não peguei bem esse gênero 😅 ' + (generosDisponiveis.length ? 'Por aqui temos: ' + generosDisponiveis.join(', ') + '.' : 'Me conta outro gênero que você curte?');
    }
    context.pendingIntensity = true;
    context.lastGenre = termo;
    return 'Boa escolha! Você prefere algo mais leve ou uma história mais intensa?';
  }

  function handleIntensityAnswer(catalog) {
    context.pendingIntensity = false;
    var termo = context.lastGenre;
    context.lastGenre = null;
    if (!termo) return 'Entendi! Me conta que gênero você prefere que eu já te mostro as opções. 😊';
    var matches = genreMatches(catalog, termo);
    if (!matches.length) return 'Entendi. No momento não encontrei livros desse gênero no nosso catálogo, mas fico de olho pra próxima!';
    return 'Entendi. Vou te mostrar as opções de ' + termo + ' que temos por aqui:\n' + matches.slice(0, 6).map(listLine).join('\n');
  }

  // ---------- Intenção: conversa casual / reações curtas ----------
  var CASUAL_RULES = [
    { test: /^(to|tou|estou) bem$/, answers: ['Boa! 😄', 'Que bom!'] },
    { test: /^(to|tou|estou) (otimo|otima)$/, answers: ['Aí sim! Fico feliz.'] },
    { test: /^(tambem|eu tambem)$/, answers: ['Que bom! 😄 Se quiser, posso te ajudar a encontrar algum livro ou produto por aqui.'] },
    { test: /^mais ou menos$|^na mesma$|^normal$/, answers: ['Poxa 😕 Espero que seu dia melhore!'] },
    { test: /^(to|tou|estou) cansad[oa]$/, answers: ['Imagino! Um livro tranquilo às vezes ajuda a desacelerar. 📚'] },
    { test: /^kk+$/, answers: ['KKKK 😄'] },
    { test: /^ha+h[ah]*$/, answers: ['😂'] },
    { test: /^rs+$/, answers: ['😄'] },
    { test: /^hehe+$/, answers: ['😄'] },
    { test: /^legal$/, answers: ['Que bom que gostou!'] },
    { test: /^beleza$/, answers: ['Fechou! 😄'] },
    { test: /^show$/, answers: ['Boa! Se precisar de alguma coisa, tô por aqui.'] },
    { test: /^(❤️|😍)+$/, answers: ['😊❤️'] },
    { test: /^(👍)+$/, answers: ['👍 Fico feliz!'] },
    { test: /^(😅|🥹|😎)+$/, answers: ['😄'] },
  ];

  function casualIntentMatches(normClean) {
    return CASUAL_RULES.some(function (r) { return r.test.test(normClean); });
  }
  function answerCasual(normClean) {
    for (var i = 0; i < CASUAL_RULES.length; i++) {
      if (CASUAL_RULES[i].test.test(normClean)) return pick('casual-' + i, CASUAL_RULES[i].answers);
    }
    return null;
  }

  // ---------- Intenção: saudação (com variação) ----------
  var GREETING_RE = /^(oi+|ol[a]|e a[i]|eae|opa|hey|hello|fala|fala ai)$/;
  var HOW_ARE_YOU_RE = /tudo bem|tudo bom|como voce esta|como vai/;

  function greetingIntentMatches(normClean) {
    return GREETING_RE.test(normClean)
      || /^(oi+|ol[a])[\s,]/.test(normClean)
      || /^bom dia|^boa tarde|^boa noite/.test(normClean)
      || HOW_ARE_YOU_RE.test(normClean);
  }

  function answerGreeting(normClean) {
    if (HOW_ARE_YOU_RE.test(normClean)) {
      return pick('howAreYou', ['Tudo sim! E você?', 'Tudo certo por aqui! E com você?']);
    }
    return pick('greeting', [
      'Oi! Tudo bem? 😊',
      'Olá! Que bom te ver por aqui!',
      'Opa! Tudo certo?',
      'Oi! Como você tá?',
      'Olá! Posso te ajudar por aqui. 📚'
    ]);
  }

  // ---------- Intenção: ajuda sobre a loja ----------
  function helpIntentMatches(normMsg) {
    return /como (eu )?compr(o|ar)/.test(normMsg)
      || /como (funciona|uso) o carrinho|carrinho de compras/.test(normMsg)
      || /como (faco|fazer) login|como entrar (na )?(minha )?conta/.test(normMsg)
      || /como vejo meus pedidos|acompanhar (meu )?pedido/.test(normMsg)
      || /como funciona (a loja|o site)/.test(normMsg)
      || /onde ficam os produtos|como vejo os produtos|como adiciono um produto/.test(normMsg);
  }

  function answerHelp(normMsg) {
    if (/como (eu )?compr(o|ar)/.test(normMsg)) {
      return 'É bem simples: escolha o produto na Livraria ou na Papelaria, clique em "Adicionar à sacola" e depois abra a Sacola (canto superior direito) para finalizar. No final você escolhe a forma de pagamento.';
    }
    if (/carrinho/.test(normMsg)) {
      return 'O botão "Sacola", no topo do site, abre seu carrinho. Lá você vê os itens escolhidos, o total e o botão para continuar o pedido.';
    }
    if (/login|entrar (na )?(minha )?conta/.test(normMsg)) {
      return 'Para entrar, use o link "Entrar" no topo do site com seu e-mail e senha cadastrados. Se ainda não tem conta, dá para criar uma pela página de cadastro. 😊';
    }
    if (/pedidos?/.test(normMsg)) {
      return 'Seus pedidos ficam na seção "Meu perfil", em "Meus pedidos". Por lá também dá para conversar com a loja sobre um pedido específico.';
    }
    if (/onde ficam os produtos|como vejo os produtos|como adiciono um produto/.test(normMsg)) {
      return 'Os produtos ficam nas seções Livraria e Papelaria, no menu do site. Para adicionar à sacola, é só abrir o produto e clicar em "Adicionar à sacola".';
    }
    return 'Por aqui você pode navegar pela Livraria e pela Papelaria, adicionar produtos à sacola, finalizar o pedido e acompanhar tudo na sua área de perfil.';
  }

  // ---------- Intenção: produtos (dados reais do catálogo) ----------
  var AVAILABILITY_RE = /voces? (tem|vende|vendem|possui|possuem)|voce (tem|vende|possui)|^tem\b/;

  function productIntentMatches(normMsg, catalog) {
    if (findProductMatches(normMsg, catalog.all).length) return true;
    if (AVAILABILITY_RE.test(normMsg)) return true;
    if (/\b(livro|livros|produto|produtos|caderno|canet|marcador|papelaria|combo|kit|estoque|dispon[i]vel|quanto custa|qual e o preco|prec[o]|quanto e|barato|barata|caro|cara|vendem|catalogo|me mostra)\b/.test(normMsg)) return true;
    return !!detectGenreTerm(normMsg);
  }

  function answerProducts(rawMsg, normMsg, catalog) {
    // 1) produto específico mencionado pelo nome
    var directMatches = findProductMatches(normMsg, catalog.all);
    if (directMatches.length === 1) {
      return describeProduct(directMatches[0]);
    }
    if (directMatches.length > 1) {
      return 'Encontrei mais de um produto parecido:\n' + directMatches.slice(0, 5).map(listLine).join('\n');
    }

    // 2) pergunta direta sim/não com dado real do catálogo
    if (/voces? vend(e|em) livros|vende livros/.test(normMsg)) {
      return catalog.books.length
        ? 'Sim! Temos livros disponíveis na loja. Posso te mostrar algumas opções, se quiser. 📚'
        : 'No momento não encontrei livros no catálogo, mas dá uma olhada na aba Livraria para conferir.';
    }
    if (/tem papelaria|voces? (tem|vendem) papelaria/.test(normMsg)) {
      return catalog.stationery.length
        ? 'Sim! Temos itens de papelaria também. Quer ver o que está disponível?'
        : 'No momento não encontrei itens de papelaria no catálogo.';
    }

    // 3) combos/kits
    if (/\bcombo(s)?\b|\bkit(s)?\b/.test(normMsg)) {
      var combos = catalog.all.filter(function (p) { return p.is_combo; });
      if (!combos.length) return 'No momento não encontrei nenhum combo/kit cadastrado no catálogo.';
      return 'Temos esses combos disponíveis:\n' + combos.slice(0, 6).map(listLine).join('\n');
    }

    // 4) mais baratos / mais caros
    if (/mais barat|menor prec|livro barato/.test(normMsg)) {
      var asc = catalog.all.slice().sort(function (a, b) { return Number(a.preco) - Number(b.preco); });
      if (!asc.length) return 'Ainda não encontrei produtos no catálogo para comparar preços.';
      return 'Os produtos mais baratos que encontrei são:\n' + asc.slice(0, 3).map(listLine).join('\n');
    }
    if (/mais car[oa]|maior prec/.test(normMsg)) {
      var desc = catalog.all.slice().sort(function (a, b) { return Number(b.preco) - Number(a.preco); });
      if (!desc.length) return 'Ainda não encontrei produtos no catálogo para comparar preços.';
      return 'Os produtos com maior preço que encontrei são:\n' + desc.slice(0, 3).map(listLine).join('\n');
    }

    // 5) gênero específico de livro (romance, fantasia, aventura, suspense, terror, etc. — dado real do produto)
    var termoGenero = detectGenreTerm(normMsg);
    if (termoGenero) {
      var doGenero = genreMatches(catalog, termoGenero);
      if (!doGenero.length) return 'No momento não encontrei livros desse gênero no nosso catálogo. Quer que eu te mostre outros livros disponíveis?';
      return 'Encontrei esses livros nesse gênero:\n' + doGenero.slice(0, 6).map(listLine).join('\n');
    }

    // 6) papelaria específica (caderno, caneta, marcador)
    var termoPapelaria = ['caderno', 'canet', 'marcador'].find(function (t) { return normMsg.indexOf(t) !== -1; });
    if (termoPapelaria) {
      var itensPapelaria = catalog.stationery.filter(function (p) { return normalize(p.titulo).indexOf(termoPapelaria) !== -1; });
      if (!itensPapelaria.length) return 'Não encontrei esse item específico na papelaria agora. Quer ver tudo que temos na seção de Papelaria?';
      return 'Encontrei isso na papelaria:\n' + itensPapelaria.slice(0, 6).map(listLine).join('\n');
    }

    // 7) pergunta de disponibilidade sobre um produto específico que não
    // achamos no catálogo real (ex.: "vocês têm Harry Potter?") — não
    // inventamos o produto, avisamos que não encontramos.
    var genericListing = /quais (livros|produtos)|o que (voces )?vendem|produtos dispon[i]v|catalogo|me mostra/.test(normMsg);
    if (!genericListing && AVAILABILITY_RE.test(normMsg)) {
      return 'Não encontrei esse produto no nosso catálogo no momento. Quer que eu mostre o que temos disponível?';
    }

    // 8) listagem geral ("quais livros/produtos vocês têm", "o que vendem", "me mostra os livros")
    if (!catalog.all.length) return 'Ainda não consegui carregar o catálogo agora — dá uma olhada nas seções Livraria e Papelaria do site, por favor, e me pergunta de novo em instantes. 🙏';

    var partes = [];
    if (catalog.books.length) partes.push('temos ' + catalog.books.length + ' livro(s), como: ' + catalog.books.slice(0, 3).map(function (b) { return b.titulo; }).join(', '));
    if (catalog.stationery.length) partes.push('e ' + catalog.stationery.length + ' item(ns) de papelaria, como: ' + catalog.stationery.slice(0, 3).map(function (s) { return s.titulo; }).join(', '));
    return 'Na Gutenberg ' + partes.join(' ') + '. Dá uma olhada nas abas Livraria e Papelaria para ver tudo, ou me pergunta por um título específico! 📚';
  }

  // ---------- Intenção: confirmações/negativas isoladas (sem contexto pendente) ----------
  var CONFIRM_YES_RE = /^(sim+|claro|pode ser|quero|acho que sim|exatamente|correto|isso|esse|pode|beleza|tranquilo)$/;
  var CONFIRM_NO_RE = /^(nao|n|acho que nao|nao quero|errado)$/;
  function confirmationIntentMatches(normClean) { return CONFIRM_YES_RE.test(normClean) || CONFIRM_NO_RE.test(normClean); }
  function answerConfirmation(normClean) {
    if (CONFIRM_NO_RE.test(normClean)) return pick('confirmNo', ['Tudo bem, sem problemas!', 'Sem problema nenhum 🙂']);
    return pick('confirmYes', ['Show! 😄', 'Beleza!', 'Combinado! 😊']);
  }

  // ---------- Intenção: fora do assunto (com variação) ----------
  function answerOffTopic() {
    return pick('offTopic', [
      'Essa eu não consigo te ajudar 😅 Mas posso falar sobre livros e produtos da loja!',
      'Essa saiu um pouco da minha área 😂 Posso te ajudar com livros e produtos.',
      'Não tenho muita informação sobre isso, mas posso te ajudar a encontrar um livro. 📚'
    ]);
  }

  // ---------- Roteador de intenção ----------
  // Ordem de prioridade (aproximada, conforme pedido):
  // 1) continuação da conversa atual; 2) categorias específicas e pouco
  // ambíguas (sobre o bot, agradecimento, despedida, pedido de recomendação);
  // 3) perguntas de literatura com frase específica ("o que é...", "por que
  // ler..."); 4) conversa casual/saudação; 5) produtos (dados reais);
  // 6) ajuda sobre a loja; 7) confirmações isoladas; 8) fora do assunto.
  function respond(rawMsg) {
    var normMsgRaw = normalize(rawMsg);
    var normMsg = denoise(normMsgRaw);
    var normClean = normMsg.replace(/[!?.,]+$/, '').trim();
    var catalog = getCatalog();

    // 1) continuação da conversa atual (maior prioridade)
    if (context.pendingIntensity && (INTENSITY_RE.test(normClean) || normClean.split(/\s+/).length <= 4)) {
      return handleIntensityAnswer(catalog);
    }
    if (context.pendingGenre && (detectGenreTerm(normMsg) || normClean.split(/\s+/).length <= 3)) {
      return handleGenreAnswer(normMsg, catalog);
    }
    // qualquer outra mensagem encerra um fluxo pendente que ficou "esquecido"
    context.pendingGenre = false;
    context.pendingIntensity = false;

    // 2) categorias específicas e pouco ambíguas
    if (aboutBotIntentMatches(normMsg)) return answerAboutBot();
    if (thanksIntentMatches(normMsg)) return answerThanks();
    if (farewellIntentMatches(normMsg)) return answerFarewell();
    if (wantsHelpChoosing(normMsg) || wantsRecommendation(normMsg)) return askGenrePreference();

    // 3) literatura (perguntas com frase específica, checadas antes de
    // "produtos" porque palavras como "romance"/"fantasia" sozinhas também
    // aparecem em buscas de catálogo — a frase completa desambigua)
    if (literatureIntentMatches(normMsg)) return answerLiterature(normMsg);

    // 4) conversa casual / saudação (não deve virar busca de produto)
    if (casualIntentMatches(normClean)) {
      var casual = answerCasual(normClean);
      if (casual) return casual;
    }
    if (greetingIntentMatches(normClean)) return answerGreeting(normClean);

    // 5) produtos (dados reais do catálogo)
    if (productIntentMatches(normMsg, catalog)) return answerProducts(rawMsg, normMsg, catalog);

    // 6) ajuda sobre a loja
    if (helpIntentMatches(normMsg)) return answerHelp(normMsg);

    // 7) confirmações/negativas isoladas, sem contexto pendente
    if (confirmationIntentMatches(normClean)) return answerConfirmation(normClean);

    // 8) fora do assunto
    return answerOffTopic();
  }

  // ---------- Interface (DOM) ----------
  var root = null;
  var messagesEl = null;
  var inputEl = null;
  var welcomed = false;

  function iconChat() {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12.5C4 7.81 8.03 4 13 4s9 3.81 9 8.5-4.03 8.5-9 8.5c-1.06 0-2.08-.17-3.02-.49L5 22l1.2-4.02C4.8 16.53 4 14.6 4 12.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="9.5" cy="12.2" r="1.1" fill="currentColor"/><circle cx="13" cy="12.2" r="1.1" fill="currentColor"/><circle cx="16.5" cy="12.2" r="1.1" fill="currentColor"/></svg>';
  }
  function iconSend() {
    return '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12 20 4l-4.5 16-4-6.5L4 12Z" fill="currentColor"/></svg>';
  }

  function buildWidget() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'gtbChatbotRoot';
    root.innerHTML =
      '<button type="button" class="gtb-toggle" id="gtbToggle" aria-label="Abrir assistente da Gutenberg">' + iconChat() + '<span class="gtb-unread-dot"></span></button>' +
      '<div class="gtb-panel" role="dialog" aria-label="Assistente da Gutenberg">' +
        '<div class="gtb-header">' +
          '<div class="gtb-header-avatar">G</div>' +
          '<div class="gtb-header-text"><strong>Assistente Gutenberg</strong><span class="gtb-header-status"><i></i> Online</span></div>' +
          '<button type="button" class="gtb-close" id="gtbClose" aria-label="Fechar assistente">×</button>' +
        '</div>' +
        '<div class="gtb-messages" id="gtbMessages"></div>' +
        '<form class="gtb-input-row" id="gtbForm">' +
          '<label class="sr-only" for="gtbInput">Mensagem</label>' +
          '<input id="gtbInput" type="text" maxlength="300" autocomplete="off" placeholder="Escreva sua mensagem...">' +
          '<button type="submit" class="gtb-send" aria-label="Enviar mensagem">' + iconSend() + '</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(root);

    messagesEl = root.querySelector('#gtbMessages');
    inputEl = root.querySelector('#gtbInput');

    root.querySelector('#gtbToggle').addEventListener('click', togglePanel);
    root.querySelector('#gtbClose').addEventListener('click', function () { setOpen(false); });
    root.querySelector('#gtbForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var texto = inputEl.value.trim();
      if (!texto) return;
      inputEl.value = '';
      handleUserMessage(texto);
    });
  }

  function destroyWidget() {
    if (!root) return;
    root.remove();
    root = null;
    messagesEl = null;
    inputEl = null;
    welcomed = false;
  }

  function addMessage(text, who) {
    if (!messagesEl) return;
    var wrap = document.createElement('div');
    wrap.className = 'gtb-msg ' + (who === 'user' ? 'user' : 'bot');
    var p = document.createElement('p');
    p.textContent = text;
    wrap.appendChild(p);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function handleUserMessage(texto) {
    addMessage(texto, 'user');
    setTimeout(async function () {
      await ensureProductsLoaded();
      var resposta = respond(texto);
      addMessage(resposta, 'bot');
    }, 300);
  }

  function togglePanel() {
    if (!root) return;
    setOpen(!root.classList.contains('open'));
  }

  function setOpen(open) {
    if (!root) return;
    root.classList.toggle('open', open);
    if (open) {
      root.classList.remove('has-unread');
      if (!welcomed) {
        welcomed = true;
        setTimeout(function () { addMessage('Olá! 👋 Como posso ajudar? Posso falar sobre nossos livros, produtos de papelaria ou sobre literatura em geral.', 'bot'); }, 150);
      }
      if (inputEl) setTimeout(function () { inputEl.focus(); }, 200);
    }
  }

  // ---------- Controle de visibilidade por autenticação ----------
  // Não cria um segundo sistema de login: apenas observa o `state.user`
  // que o mecanismo de autenticação já existente mantém atualizado.
  function syncAuthState() {
    var user = getCurrentUser();
    if (user && !root) {
      buildWidget();
    } else if (!user && root) {
      destroyWidget();
    }
  }

  function start() {
    syncAuthState();
    setInterval(syncAuthState, 500);
    // Cobre login/logout em outra aba do mesmo navegador.
    window.addEventListener('storage', function (event) {
      if (event.key === 'gutenberg-user') syncAuthState();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();