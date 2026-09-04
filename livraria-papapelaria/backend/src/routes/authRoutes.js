const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/cadastrar', authController.cadastrar);
router.post('/login', authController.login);
router.get('/perfil/:userId', authController.obterPerfil);

module.exports = router;  