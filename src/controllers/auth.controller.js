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

const criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        message: "Por favor, informe nome, email e senha."
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    const query = `INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)`;

    db.run(query, [nome, email, senhaCriptografada], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ message: "Email já cadastrado" });
        }
        return res.status(500).json({ message: "Erro ao criar usuário" });
      }

      return res.status(201).json({
        message: "Usuário criado com sucesso",
        id: this.lastID
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno", error: error.message });
  }
};

module.exports = {
    login,
    criarUsuario
}