const express = require('express');
const router = express.Router();
const diarioController = require('../controllers/diarioController');

router.post('/', diarioController.criarAnotacao);
router.get('/usuario/:usuario_id', diarioController.listarDiarioDoUsuario);
router.get('/comunidade/publicos', diarioController.listarDiariosPublicos);

module.exports = router;