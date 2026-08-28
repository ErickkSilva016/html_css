const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { exigirAutenticacao } = require('../middlewares/auth');

// Rotas públicas de consulta
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.buscarProdutoPorId);

// Rota de criação (exige login; a policy de RLS decide quem pode inserir,
// ex. apenas dona/funcionário — ver checagem de perfil dentro do controller)
router.post('/', exigirAutenticacao, produtoController.criarProduto);

module.exports = router;