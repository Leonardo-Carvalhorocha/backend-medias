const express = require('express');
const { filtrosCsv, paginacaoMedia, download, calculoMedias, buildFiltros } = require('../controllers/medias.controller');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage()
});

router.post('/select-filtros', upload.single('file'), filtrosCsv);
router.post('/calculo-medias',  upload.single('file'), calculoMedias);
router.post('/page-medias', paginacaoMedia);
router.post('/download', download);
router.post('/build-filtros', upload.single('file'), buildFiltros);

module.exports = router;
