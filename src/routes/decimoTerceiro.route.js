const express = require('express');
const router = express.Router();
const multer = require('multer');
const { adiantamentoDecimoTerceiro, atualizarBaseDados } = require('../controllers/decimoterceiro.controller');

const upload = multer({
  storage: multer.memoryStorage()
});

router.post('/filtrar',  upload.single('file'), adiantamentoDecimoTerceiro);
router.post('/atualizar',  upload.single('file'), atualizarBaseDados);

module.exports = router;