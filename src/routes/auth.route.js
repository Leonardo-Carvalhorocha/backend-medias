const express = require('express');
const { login, criarUsuario } = require('../controllers/auth.controller');
const router = express.Router();

router.post('/login', login);
router.post('/criar-usuario', criarUsuario);

module.exports = router;