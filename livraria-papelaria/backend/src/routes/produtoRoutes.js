const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Rotas públicas de consulta
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.buscarProdutoPorId);

// Rota de criação (Futuramente protegida com níveis de acesso)
router.post('/', produtoController.criarProduto);

module.exports = router;