const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');
const { exigirAutenticacao, exigirPermissao } = require('../middlewares/auth');

router.post('/', exigirAutenticacao, pedidoController.criarPedido);
router.get('/meus', exigirAutenticacao, pedidoController.listarMeusPedidos);

// Ver todos os pedidos: funcionário também precisa, pra saber quem pediu
// o quê e poder conversar sobre o pedido (ver chatController).
router.get('/', exigirPermissao('funcionario', 'dona', 'admin'), pedidoController.listarPedidos);

// Mudar status do pedido: só dona/admin.
router.patch('/:id/status', exigirPermissao('dona', 'admin'), pedidoController.atualizarStatusPedido);

module.exports = router;
