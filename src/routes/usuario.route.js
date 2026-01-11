const express = require('express');
const { adicionar } = require('../controllers/usuario.controller');
const router = express.Router();

router.post('/', adicionar);

module.exports = router;
