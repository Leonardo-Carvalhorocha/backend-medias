const db = require("../db/db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
    const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      message: 'Email e senha são obrigatórios'
    });
  }

  const query = `
    SELECT * FROM users WHERE email = ?
  `;

  db.get(query, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({
        message: 'Erro ao buscar usuário'
      });
    }

    if (!user) {
      return res.status(401).json({
        message: 'Email ou senha inválidos'
      });
    }

    const senhaValida = await bcrypt.compare(
      senha,
      user.senha
    );

    if (!senhaValida) {
      return res.status(401).json({
        message: 'Email ou senha inválidos'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    return res.status(200).json({
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email
      },
      token
    });
  });
}

module.exports = {
    login
}