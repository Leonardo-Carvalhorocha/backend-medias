const express = require('express');
const cors = require('cors');
const autenticarToken = require('./src/utils/authMiddleware');
require('dotenv').config();

const usuarioRoutes = require('./src/routes/usuario.route');
const medias = require('./src/routes/medias.route');
const auth = require('./src/routes/auth.route');
const decimoTerceiro = require('./src/routes/decimoTerceiro.route');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', auth);
app.use('/usuario', autenticarToken, usuarioRoutes);
app.use('/medias', autenticarToken, medias);
app.use('/decimo-terceiro', decimoTerceiro);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
