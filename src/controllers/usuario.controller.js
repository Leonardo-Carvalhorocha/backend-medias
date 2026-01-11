const db = require("../db/db");
const bcrypt = require("bcryptjs");

const adicionar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({
        message: "Nome, email e senha são obrigatórios",
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO users (nome, email, senha)
      VALUES (?, ?, ?)
    `;

    db.run(query, [nome, email, senhaCriptografada], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({
            message: "Email já cadastrado",
          });
        }

        return res.status(500).json({
          message: "Erro ao cadastrar usuário",
        });
      }

      return res.status(201).json({
        id: this.lastID,
        nome,
        email,
      });
    });
  } catch (error) {
    console.log("error:? ", error);
    return res.status(500).json({
      message: "Erro interno",
    });
  }
};

module.exports = {
    adicionar
}
