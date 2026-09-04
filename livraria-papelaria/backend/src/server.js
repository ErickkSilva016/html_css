const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { identificarUsuario } = require('./middlewares/auth');

// Rotas
const produtoRoutes = require('./routes/produtoRoutes');
const authRoutes = require('./routes/authRoutes');
const diarioRoutes = require('./routes/diarioRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Lê o token do usuário (se houver) e prepara req.user / req.supabase
// para todas as rotas abaixo, respeitando RLS em vez de ignorá-la.
app.use(identificarUsuario);

// Endpoints da API
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/diario', diarioRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Rota Base
app.get('/', (req, res) => {
  res.json({ message: 'API da Livraria/Papelaria rodando com sucesso!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});