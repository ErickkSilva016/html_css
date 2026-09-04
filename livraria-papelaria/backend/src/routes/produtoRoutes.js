const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { exigirPermissao } = require('../middlewares/auth');

// Rotas públicas de consulta
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.buscarProdutoPorId);
router.get('/:id/combo-itens', produtoController.listarItensCombo);

// Criar / editar por completo / apagar produto: só dona ou admin.
// O funcionário NÃO tem mais essas permissões — ele só mexe em promoção
// (ver rota /:id/promocao abaixo), como pedido pela cliente.
router.post('/', exigirPermissao('dona', 'admin'), produtoController.criarProduto);
router.patch('/:id', exigirPermissao('dona', 'admin'), produtoController.editarProduto);
router.delete('/:id', exigirPermissao('dona', 'admin'), produtoController.removerProduto);

// Única rota de escrita liberada para o funcionário: só promoção.
router.patch('/:id/promocao', exigirPermissao('funcionario', 'dona', 'admin'), produtoController.atualizarPromocao);

// Composição do combo/kit: estrutura de produto, então só dona/admin.
router.put('/:id/combo-itens', exigirPermissao('dona', 'admin'), produtoController.definirItensCombo);

module.exports = router;
