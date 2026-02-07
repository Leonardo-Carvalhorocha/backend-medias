const express = require('express');
const { adicionar } = require('../controllers/usuario.controller');
const { atualizarUsuario } = require('../controllers/auth.controller');
const router = express.Router();

router.post('/', adicionar);
router.put('/atualizar', atualizarUsuario);

module.exports = router;
