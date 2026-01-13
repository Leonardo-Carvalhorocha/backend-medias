const { inserirDados } = require("../utils/utils");
const db = require("./../db/db");
const XLSX = require('xlsx');

let adiantamentoDecimoTerceiro = async (req, res) => {
  try {
    const { filtro } = req.body;

    if (!filtro || !Array.isArray(filtro) || filtro.length === 0) {
      return res.status(400).json({
        message: "Informe pelo menos um ID"
      });
    }

    const placeholders = filtro.map(() => "?").join(",");

    const sql = `
      SELECT *
      FROM adiantamentoDecimoTerceiro
      WHERE id IN (${placeholders})
    `;

    db.all(sql, filtro, (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Erro ao buscar registros",
          error: err.message
        });
      }

      // Mapeia resultados por ID
      const mapaResultados = new Map();
      rows.forEach((row) => {
        mapaResultados.set(row.id, row);
      });

      // Garante retorno para todos os IDs enviados
      const dadosCompletos = filtro.map((id) => {
        if (mapaResultados.has(id)) {
          return mapaResultados.get(id);
        }

        return {
          id,
          nome: "não foi encontrado",
          grupoCalendario: "",
          concepto: "",
          valor: 0
        };
      });

      return res.status(200).json({
        total: dadosCompletos.length,
        dados: dadosCompletos
      });
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erro inesperado",
      error: error.message
    });
  }
};



let atualizarBaseDados = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Arquivo não enviado" });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(worksheet);
    inserirDados(db, dados);
    return res.status(200).json({
      message: "Dados importados com sucesso",
      totalRegistros: dados.length
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erro ao importar dados",
      error: error.message
    });
  }
};

module.exports = {
    adiantamentoDecimoTerceiro,
    atualizarBaseDados
}