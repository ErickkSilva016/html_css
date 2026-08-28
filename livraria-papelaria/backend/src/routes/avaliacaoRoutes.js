const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const { exigirAutenticacao } = require('../middlewares/auth');

router.post('/', exigirAutenticacao, avaliacaoController.criarAvaliacao);
router.get('/produto/:produto_id', avaliacaoController.listarAvaliacoesDoProduto);

module.exports = router;