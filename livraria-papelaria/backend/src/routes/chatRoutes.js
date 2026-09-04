const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { exigirAutenticacao, exigirPermissao } = require('../middlewares/auth');

router.post('/enviar', exigirAutenticacao, chatController.enviarMensagem);
router.get('/:tipo_chat', chatController.listarMensagens);

// Moderação: só dona/admin apagam mensagem do chat livre ou do canal VIP.
router.delete('/:id', exigirPermissao('dona', 'admin'), chatController.removerMensagem);

module.exports = router;
