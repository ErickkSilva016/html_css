# MILISTORE — Backend (Node.js + Express + SQLite)

Backend completo para o site da **MILISTORE** (loja Militino), conectando o
front-end que você já tinha (`index.html`, `script.js`, `styles.css`) a um
banco de dados de verdade.

## O que está pronto

- **Produtos**: CRUD completo, com imagens (vários ângulos), cores, tamanhos
  e estoque por variação, filtros (público, categoria, estilo, cor, tamanho,
  preço, busca, ofertas) e recomendações de "venda casada".
- **Autenticação**: cadastro e login de clientes com senha criptografada
  (bcrypt) e token JWT. Painel admin protegido (só quem tem `is_admin = 1`
  acessa).
- **Favoritos** e **Carrinho**: persistidos no banco, por usuário logado.
- **Pedidos**: criação de pedido, geração de código PIX (simulado — veja
  aviso abaixo), consulta de status, histórico do cliente.
- **Avaliações**: com filtro por nota e por "compra verificada" (o sistema
  checa automaticamente se o cliente já comprou o produto).
- **Painel admin**: dashboard com totais, lista de pedidos, lista de
  clientes, atualização de status de pedido.

## ⚠️ O que ainda depende de você (ou de contratar depois)

- **Gateway de pagamento real**: o código PIX gerado hoje é só para
  preencher a tela — não é um PIX válido. Pra receber pagamento de verdade
  você vai precisar integrar um gateway (Mercado Pago, Efí/Gerencianet,
  Asaas, PagSeguro etc.) e trocar a função em `utils/pix.js` pela chamada
  real da API do gateway escolhido. O mesmo vale para cartão e boleto — hoje
  os formulários são só visuais.
- **Upload de imagens**: por enquanto os produtos usam URLs de imagem
  (como já era no mock). Se quiser que o admin faça upload de fotos do
  próprio computador, dá pra adicionar isso depois (multer + pasta local ou
  um serviço tipo Cloudinary/S3).
- **Deploy**: isso aqui roda local. Pra colocar no ar de verdade você vai
  precisar de hospedagem (Render, Railway, VPS, etc.) — te ajudo com isso
  quando chegar a hora.

## Estrutura de pastas

```
militino-backend/
├── server.js              # ponto de entrada
├── database/
│   ├── schema.sql          # estrutura das tabelas
│   ├── db.js                # conexão com o SQLite
│   └── seed.js              # popula o banco com produtos/usuários de teste
├── middleware/
│   └── auth.js              # validação de JWT (login obrigatório / admin)
├── routes/
│   ├── products.js
│   ├── auth.js
│   ├── favorites.js
│   ├── cart.js
│   ├── orders.js
│   ├── reviews.js
│   └── admin.js
├── utils/
│   └── pix.js               # gerador de código PIX (simulado)
└── public/                  # seu front-end (index.html, script.js, styles.css)
```

## Como rodar

Pré-requisito: **Node.js 18 ou mais recente** instalado
([nodejs.org](https://nodejs.org)).

```bash
# 1. Entrar na pasta do projeto
cd militino-backend

# 2. Instalar as dependências
npm install

# 3. Criar o arquivo de variáveis de ambiente
cp .env.example .env
# (opcional: abra o .env e troque o JWT_SECRET por uma string aleatória)

# 4. Popular o banco de dados com os produtos e usuários de teste
npm run seed

# 5. Subir o servidor
npm start
```

O servidor sobe em **http://localhost:3000**. Como o front-end foi copiado
para a pasta `public/`, basta abrir esse endereço no navegador que o site
inteiro já funciona conectado ao banco.

Se preferir manter o front-end rodando separado (ex: com Live Server no
VS Code), sem problema — o `script.js` já chama a API pelo caminho relativo
`/api`. Nesse caso, rode o backend com `npm start` normalmente e configure
seu servidor de front-end para rodar em outra porta; só ajuste
`API_BASE_URL` no `script.js` para `http://localhost:3000/api` se as portas
forem diferentes (senão o navegador bloqueia por CORS — o backend já libera
CORS geral, mas o caminho relativo `/api` só funciona se front e back
estiverem na mesma origem).

### Durante o desenvolvimento

```bash
npm run dev
```

Reinicia o servidor sozinho a cada alteração nos arquivos.

### Resetar o banco (apagar tudo e recriar os dados de exemplo)

```bash
npm run seed
```

Pode rodar quantas vezes quiser — ele limpa e repopula do zero.

## Credenciais de teste (criadas pelo seed)

| Papel   | E-mail                     | Senha    |
|---------|-----------------------------|----------|
| Admin   | admin@milistore.com.br      | admin123 |
| Cliente | cliente@teste.com           | 123456   |

Use o e-mail/senha do admin no modal de "Login administrativo" do site
(o botão de acesso admin que já existia no front-end).

## Principais rotas da API

Todas sob o prefixo `/api`. Rotas marcadas com 🔒 exigem o header
`Authorization: Bearer <token>` (o token vem da resposta do login).
Rotas marcadas com 🔒👑 exigem além disso que o usuário seja admin.

| Método | Rota                              | Descrição                          |
|--------|------------------------------------|-------------------------------------|
| GET    | `/products.php`                    | Lista produtos (aceita filtros)     |
| GET    | `/product.php?id=`                 | Detalhe de um produto               |
| GET    | `/products/recommendations.php?id=`| Produtos parecidos (venda casada)   |
| POST   | `/products/create.php`             | 🔒👑 Cria produto                    |
| PUT    | `/products/update.php?id=`         | 🔒👑 Atualiza produto                |
| DELETE | `/products/delete.php?id=`         | 🔒👑 Remove produto                  |
| POST   | `/auth/register.php`               | Cadastro de cliente                 |
| POST   | `/auth/login.php`                  | Login (retorna token)               |
| POST   | `/auth/logout.php`                 | Logout (compatibilidade)            |
| GET    | `/auth/me.php`                     | 🔒 Dados do usuário logado           |
| GET    | `/favorites.php`                   | 🔒 Lista favoritos                   |
| POST   | `/favorites/add.php`               | 🔒 Adiciona favorito                 |
| DELETE | `/favorites/remove.php`            | 🔒 Remove favorito                   |
| GET    | `/cart.php`                        | 🔒 Ver carrinho                      |
| POST   | `/cart/add.php`                    | 🔒 Adicionar item                    |
| PUT    | `/cart/update.php`                 | 🔒 Alterar quantidade                |
| DELETE | `/cart/remove.php`                 | 🔒 Remover item                      |
| POST   | `/orders/create.php`               | 🔒 Fecha pedido (gera PIX se aplicável) |
| GET    | `/orders.php`                      | 🔒 Histórico de pedidos do cliente   |
| GET    | `/orders/status.php?id=`           | 🔒 Status de um pedido               |
| GET    | `/reviews.php?product_id=`         | Lista avaliações (filtros opcionais)|
| POST   | `/reviews/create.php`              | 🔒 Cria avaliação                    |
| GET    | `/admin/dashboard.php`             | 🔒👑 Totais gerais                    |
| GET    | `/admin/orders.php`                | 🔒👑 Todos os pedidos                 |
| PUT    | `/admin/orders/status.php?id=`     | 🔒👑 Atualiza status de um pedido     |
| GET    | `/admin/customers.php`             | 🔒👑 Lista de clientes                |

Os nomes de rota (`.php`) foram mantidos de propósito iguais aos que já
estavam previstos no `script.js` original — assim o front-end quase não
precisou ser alterado, só o endereço base e o envio do token de login.

## Dúvidas comuns

**"Rodei `npm start` e deu erro de porta em uso"**
Outro processo já está usando a porta 3000. Troque `PORT=3000` para outra
porta no `.env` (ex: `PORT=3001`).

**"Mudei um produto no admin mas não vejo a mudança"**
Confirme que está logado como admin (e-mail/senha acima) — sem isso a API
recusa a alteração (erro 401/403), mesmo que a tela do admin pareça ter
aceitado.

**"Quero apagar os dados e recomeçar do zero"**
Apague o arquivo `database/milistore.db` (e os `-shm`/`-wal` se existirem)
e rode `npm run seed` de novo.
