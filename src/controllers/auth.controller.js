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

const atualizarUsuario = async (req, res) => {
  try {
    const { email, senhaAtual, novaSenha, nome } = req.body;
    
    // Tenta identificar o usuário pelo Token (req.usuario) ou pelo Email enviado no corpo
    const userId = req.usuario?.id;

    if (!userId && !email) {
      return res.status(400).json({ message: "Usuário não identificado. Faça login ou informe o email." });
    }

    if (!senhaAtual) {
      return res.status(400).json({ message: "Informe a senha atual para confirmar a alteração." });
    }

    const queryBusca = userId ? `SELECT * FROM users WHERE id = ?` : `SELECT * FROM users WHERE email = ?`;
    const paramsBusca = userId ? [userId] : [email];

    db.get(queryBusca, paramsBusca, async (err, user) => {
      if (err) return res.status(500).json({ message: "Erro ao buscar usuário" });
      if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

      // Verifica se a senha atual enviada bate com a do banco
      const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
      
      if (!senhaValida) {
        return res.status(401).json({ message: "A senha atual está incorreta." });
      }

      const updates = [];
      const params = [];

      if (nome) {
        updates.push("nome = ?");
        params.push(nome);
      }

      if (novaSenha) {
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
        updates.push("senha = ?");
        params.push(novaSenhaHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "Nenhum dado para atualizar." });
      }

      params.push(user.id);
      const queryUpdate = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

      db.run(queryUpdate, params, function(err) {
        if (err) return res.status(500).json({ message: "Erro ao atualizar dados" });
        
        return res.status(200).json({
          message: "Dados atualizados com sucesso!",
          usuario: {
            id: user.id,
            nome: nome || user.nome,
            email: user.email
          }
        });
      });
    });

  } catch (error) {
    return res.status(500).json({ message: "Erro interno", error: error.message });
  }
};

module.exports = {
    login,
    criarUsuario,
    atualizarUsuario
}