const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { exigirAutenticacao } = require('../middlewares/auth');

router.post('/enviar', exigirAutenticacao, chatController.enviarMensagem);
router.get('/:tipo_chat', chatController.listarMensagens);

module.exports = router;