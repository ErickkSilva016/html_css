const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { exigirPermissao } = require('../middlewares/auth');

// Rotas públicas de consulta
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.buscarProdutoPorId);

// Rota de criação (exige login; a policy de RLS decide quem pode inserir,
// ex. apenas dona/funcionário — ver checagem de perfil dentro do controller)
router.post('/', exigirPermissao('funcionario', 'dona', 'admin'), produtoController.criarProduto);
router.patch('/:id', exigirPermissao('funcionario', 'dona', 'admin'), produtoController.editarProduto);
router.delete('/:id', exigirPermissao('funcionario', 'dona', 'admin'), produtoController.removerProduto);

module.exports = router;