const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');
const { exigirAutenticacao, exigirPermissao } = require('../middlewares/auth');

router.post('/', exigirAutenticacao, avaliacaoController.criarAvaliacao);
router.get('/produto/:produto_id', avaliacaoController.listarAvaliacoesDoProduto);

// Moderação: só dona/admin apagam avaliação.
router.delete('/:id', exigirPermissao('dona', 'admin'), avaliacaoController.removerAvaliacao);

module.exports = router;
