const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/enviar', chatController.enviarMensagem);
router.get('/:tipo_chat', chatController.listarMensagens);

module.exports = router;