const express = require('express');
const router = express.Router();
const avaliacaoController = require('../controllers/avaliacaoController');

router.post('/', avaliacaoController.criarAvaliacao);
router.get('/produto/:produto_id', avaliacaoController.listarAvaliacoesDoProduto);

module.exports = router;