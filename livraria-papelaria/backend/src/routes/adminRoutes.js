const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const { exigirPermissao } = require('../middlewares/auth');

router.use(exigirPermissao('funcionario', 'dona', 'admin'));
router.get('/dashboard', controller.dashboard);
router.get('/produtos', controller.listarProdutos);
router.patch('/estoque/:id', controller.atualizarEstoque);
router.get('/funcionarios', controller.listarFuncionarios);
router.post('/funcionarios', controller.criarFuncionario);
router.patch('/funcionarios/:id/permissao', controller.alterarPermissao);
router.delete('/funcionarios/:id', controller.removerFuncionario);
router.post('/chat-vip', controller.enviarNoticiaVip);

module.exports = router;