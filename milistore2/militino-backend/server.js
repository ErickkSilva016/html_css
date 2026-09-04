require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// Garante que o banco exista e o schema esteja aplicado antes de tudo
require("./database/db");

const productsRoutes = require("./routes/products");
const authRoutes = require("./routes/auth");
const favoritesRoutes = require("./routes/favorites");
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");
const reviewsRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Todas as rotas da API ficam sob /api, espelhando os caminhos que o
// front-end (script.js) já chama (ex: /api/products.php, /api/auth/login.php)
app.use("/api", productsRoutes);
app.use("/api", authRoutes);
app.use("/api", favoritesRoutes);
app.use("/api", cartRoutes);
app.use("/api", ordersRoutes);
app.use("/api", reviewsRoutes);
app.use("/api", adminRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve o próprio front-end (index.html/script.js/styles.css) na raiz,
// assim dá pra rodar tudo com um único comando em desenvolvimento.
app.use(express.static(path.join(__dirname, "public")));

// Tratamento de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`\n🛍️  MILISTORE API rodando em http://localhost:${PORT}`);
  console.log(`   Front-end (se copiado para /public): http://localhost:${PORT}\n`);
});
