const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const cors = require('cors');
const db = require('./db/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const autenticarToken = require('./utils/authMiddleware');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


const app = express();
const port = process.env.PORT || 3000;

/*
  ______   ________  _______    ______   ______   ______  
 /      \ |        \|       \  /      \ |      \ /      \ 
|  $$$$$$\| $$$$$$$$| $$$$$$$\|  $$$$$$\ \$$$$$$|  $$$$$$\
| $$ __\$$| $$__    | $$__| $$| $$__| $$  | $$  | $$___\$$
| $$|    \| $$  \   | $$    $$| $$    $$  | $$   \$$    \ 
| $$ \$$$$| $$$$$   | $$$$$$$\| $$$$$$$$  | $$   _\$$$$$$\
| $$__| $$| $$_____ | $$  | $$| $$  | $$ _| $$_ |  \__| $$
 \$$    $$| $$     \| $$  | $$| $$  | $$|   $$ \ \$$    $$
  \$$$$$$  \$$$$$$$$ \$$   \$$ \$$   \$$ \$$$$$$  \$$$$$$ 
*/

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage()
});

/*
  ______    ______    ______   __    __  ________        ________  __       __        __       __  ________  __       __  _______   ______   ______  
 /      \  /      \  /      \ |  \  |  \|        \      |        \|  \     /  \      |  \     /  \|        \|  \     /  \|       \ |      \ /      \ 
|  $$$$$$\|  $$$$$$\|  $$$$$$\| $$  | $$| $$$$$$$$      | $$$$$$$$| $$\   /  $$      | $$\   /  $$| $$$$$$$$| $$\   /  $$| $$$$$$$\ \$$$$$$|  $$$$$$\
| $$   \$$| $$__| $$| $$   \$$| $$__| $$| $$__          | $$__    | $$$\ /  $$$      | $$$\ /  $$$| $$__    | $$$\ /  $$$| $$__| $$  | $$  | $$__| $$
| $$      | $$    $$| $$      | $$    $$| $$  \         | $$  \   | $$$$\  $$$$      | $$$$\  $$$$| $$  \   | $$$$\  $$$$| $$    $$  | $$  | $$    $$
| $$   __ | $$$$$$$$| $$   __ | $$$$$$$$| $$$$$         | $$$$$   | $$\$$ $$ $$      | $$\$$ $$ $$| $$$$$   | $$\$$ $$ $$| $$$$$$$\  | $$  | $$$$$$$$
| $$__/  \| $$  | $$| $$__/  \| $$  | $$| $$_____       | $$_____ | $$ \$$$| $$      | $$ \$$$| $$| $$_____ | $$ \$$$| $$| $$  | $$ _| $$_ | $$  | $$
 \$$    $$| $$  | $$ \$$    $$| $$  | $$| $$     \      | $$     \| $$  \$ | $$      | $$  \$ | $$| $$     \| $$  \$ | $$| $$  | $$|   $$ \| $$  | $$
  \$$$$$$  \$$   \$$  \$$$$$$  \$$   \$$ \$$$$$$$$       \$$$$$$$$ \$$      \$$       \$$      \$$ \$$$$$$$$ \$$      \$$ \$$   \$$ \$$$$$$ \$$   \$$                                                                                                                                       
*/

let csvDownloadCache = [];

function salvarCsvNoCache(data) {
  csvDownloadCache = [...data];
}

function obterCsvDoCache() {
  return csvDownloadCache;
}

/*  __    __   ______   _______   __       __   ______   __        ______  ________   ______    ______          ______    ______   __     __ 
|  \  |  \ /      \ |       \ |  \     /  \ /      \ |  \      |      \|        \ /      \  /      \        /      \  /      \ |  \   |  \
| $$\ | $$|  $$$$$$\| $$$$$$$\| $$\   /  $$|  $$$$$$\| $$       \$$$$$$ \$$$$$$$$|  $$$$$$\|  $$$$$$\      |  $$$$$$\|  $$$$$$\| $$   | $$
| $$$\| $$| $$  | $$| $$__| $$| $$$\ /  $$$| $$__| $$| $$        | $$      /  $$ | $$__| $$| $$  | $$      | $$   \$$| $$___\$$| $$   | $$
| $$$$\ $$| $$  | $$| $$    $$| $$$$\  $$$$| $$    $$| $$        | $$     /  $$  | $$    $$| $$  | $$      | $$       \$$    \  \$$\ /  $$
| $$\$$ $$| $$  | $$| $$$$$$$\| $$\$$ $$ $$| $$$$$$$$| $$        | $$    /  $$   | $$$$$$$$| $$  | $$      | $$   __  _\$$$$$$\  \$$\  $$ 
| $$ \$$$$| $$__/ $$| $$  | $$| $$ \$$$| $$| $$  | $$| $$_____  _| $$_  /  $$___ | $$  | $$| $$__/ $$      | $$__/  \|  \__| $$   \$$ $$  
| $$  \$$$ \$$    $$| $$  | $$| $$  \$ | $$| $$  | $$| $$     \|   $$ \|  $$    \| $$  | $$ \$$    $$       \$$    $$ \$$    $$    \$$$   
 \$$   \$$  \$$$$$$  \$$   \$$ \$$      \$$ \$$   \$$ \$$$$$$$$ \$$$$$$ \$$$$$$$$ \$$   \$$  \$$$$$$         \$$$$$$   \$$$$$$      \$    
 */

function limparCamposRow(row) {
  return {
    ID: row['ID']?.trim() || '',
    Nome: row['Nome']?.trim() || '',
    'Período Aquisitivo': row['Período Aquisitivo']?.trim() || '',
    'Elemento People': row['Elemento People']?.trim() || '',
    'Total Valor': row['Total Valor']?.replace(/\s+/g, ' ').trim() || ''
  };
}

function normalizarRowCsv(row) {
  const colunas = Object.keys(row);

  // CSV já estruturado corretamente
  if (colunas.length > 1) {
    return limparCamposRow(row);
  }

  // CSV quebrado (linha inteira em uma única coluna)
  const linhaUnica = row[colunas[0]];

  const valoresSeparados = linhaUnica
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map(valor => valor.replace(/"/g, '').trim());

  return {
    ID: valoresSeparados[0] || '',
    Nome: valoresSeparados[1] || '',
    'Período Aquisitivo': valoresSeparados[2] || '',
    'Elemento People': valoresSeparados[3] || '',
    'Total Valor': valoresSeparados[4] || ''
  };
}

/* 
 _______   ________  _______    ______   _______    ______          ______    ______   __    __  ______   ______   ______  ________  ______  __     __   ______  
|       \ |        \|       \  /      \ |       \  /      \        /      \  /      \ |  \  |  \|      \ /      \ |      \|        \|      \|  \   |  \ /      \ 
| $$$$$$$\| $$$$$$$$| $$$$$$$\|  $$$$$$\| $$$$$$$\|  $$$$$$\      |  $$$$$$\|  $$$$$$\| $$  | $$ \$$$$$$|  $$$$$$\ \$$$$$$ \$$$$$$$$ \$$$$$$| $$   | $$|  $$$$$$\
| $$__/ $$| $$__    | $$__| $$| $$  | $$| $$  | $$| $$  | $$      | $$__| $$| $$  | $$| $$  | $$  | $$  | $$___\$$  | $$     | $$     | $$  | $$   | $$| $$  | $$
| $$    $$| $$  \   | $$    $$| $$  | $$| $$  | $$| $$  | $$      | $$    $$| $$  | $$| $$  | $$  | $$   \$$    \   | $$     | $$     | $$   \$$\ /  $$| $$  | $$
| $$$$$$$ | $$$$$   | $$$$$$$\| $$  | $$| $$  | $$| $$  | $$      | $$$$$$$$| $$ _| $$| $$  | $$  | $$   _\$$$$$$\  | $$     | $$     | $$    \$$\  $$ | $$  | $$
| $$      | $$_____ | $$  | $$| $$__/ $$| $$__/ $$| $$__/ $$      | $$  | $$| $$/ \ $$| $$__/ $$ _| $$_ |  \__| $$ _| $$_    | $$    _| $$_    \$$ $$  | $$__/ $$
| $$      | $$     \| $$  | $$ \$$    $$| $$    $$ \$$    $$      | $$  | $$ \$$ $$ $$ \$$    $$|   $$ \ \$$    $$|   $$ \   | $$   |   $$ \    \$$$    \$$    $$
 \$$       \$$$$$$$$ \$$   \$$  \$$$$$$  \$$$$$$$   \$$$$$$        \$$   \$$  \$$$$$$\  \$$$$$$  \$$$$$$  \$$$$$$  \$$$$$$    \$$    \$$$$$$     \$      \$$$$$$ 
*/

function extrairAnoMesDoPeriodo(periodoAquisitivo) {
  const resultado = periodoAquisitivo?.match(/(\d{4})M(\d{2})$/);
  if (!resultado) return null;

  return {
    ano: Number(resultado[1]),
    mes: Number(resultado[2])
  };
}

function converterPeriodoParaNumero(periodo) {
  return periodo.ano * 100 + periodo.mes;
}

/* 
  ______   __        ______   __    __  __        ______    ______  
 /      \ |  \      /      \ |  \  |  \|  \      /      \  /      \ 
|  $$$$$$\| $$     |  $$$$$$\| $$  | $$| $$     |  $$$$$$\|  $$$$$$\
| $$   \$$| $$     | $$   \$$| $$  | $$| $$     | $$  | $$| $$___\$$
| $$      | $$     | $$      | $$  | $$| $$     | $$  | $$ \$$    \ 
| $$   __ | $$     | $$   __ | $$  | $$| $$     | $$  | $$ _\$$$$$$\
| $$__/  \| $$_____| $$__/  \| $$__/ $$| $$_____| $$__/ $$|  \__| $$
 \$$    $$| $$     \\$$    $$ \$$    $$| $$     \\$$    $$ \$$    $$
  \$$$$$$  \$$$$$$$$ \$$$$$$   \$$$$$$  \$$$$$$$$ \$$$$$$   \$$$$$$                                                       
*/

function converterValorMonetarioParaNumero(registro) {
  if (!registro || !registro['Total Valor']) {
    return 0;
  }

  const valorOriginal = String(registro['Total Valor']);

  const valorNormalizado = valorOriginal
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const valorNumerico = Number(valorNormalizado);

  return Number.isFinite(valorNumerico) ? valorNumerico : 0;
}

async function calcularMediaAnual(valuesFilters) {
  return new Promise((resolve) => {
    let value = 0;

    for (const valueFilter of valuesFilters) {
      value += valueFilter;
    }

    value = value / 12;

    resolve(value);
  });
}

function formatarValorParaBRL(valorNumerico) {
  if (!Number.isFinite(valorNumerico)) {
    return 'R$ 0,00';
  }

  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}


/*
 ________  __    __  _______   _______    ______   ______  __    __  ________   ______  
|        \|  \  |  \|       \ |       \  /      \ |      \|  \  |  \|        \ /      \ 
| $$$$$$$$| $$\ | $$| $$$$$$$\| $$$$$$$\|  $$$$$$\ \$$$$$$| $$\ | $$ \$$$$$$$$|  $$$$$$\
| $$__    | $$$\| $$| $$  | $$| $$__/ $$| $$  | $$  | $$  | $$$\| $$   | $$   | $$___\$$
| $$  \   | $$$$\ $$| $$  | $$| $$    $$| $$  | $$  | $$  | $$$$\ $$   | $$    \$$    \ 
| $$$$$   | $$\$$ $$| $$  | $$| $$$$$$$ | $$  | $$  | $$  | $$\$$ $$   | $$    _\$$$$$$\
| $$_____ | $$ \$$$$| $$__/ $$| $$      | $$__/ $$ _| $$_ | $$ \$$$$   | $$   |  \__| $$
| $$     \| $$  \$$$| $$    $$| $$       \$$    $$|   $$ \| $$  \$$$   | $$    \$$    $$
 \$$$$$$$$ \$$   \$$ \$$$$$$$  \$$        \$$$$$$  \$$$$$$ \$$   \$$    \$$     \$$$$$$                                                                             
*/

app.post('/select-filtros', autenticarToken,upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Arquivo CSV não enviado');
    }

    const conteudoArquivo = req.file.buffer.toString('utf-8');
    const primeiraLinha = conteudoArquivo.split('\n')[0];

    const filtros = primeiraLinha
      .replace('\r', '')
      .split(',')
      .map(coluna => coluna.replace(/^"+|"+$/g, '').trim());

    return res.json({ filtros });

  } catch (error) {
    console.error(error);
    return res.status(500).send('Erro interno');
  }
});

app.post('/calculo-medias', autenticarToken,upload.single('file'), async (req, res) => {
  try {
    let { filtros } = req.body;
    filtros = JSON.parse(filtros);

    if (!req.file) {
      return res.status(400).send('Arquivo CSV não enviado');
    }

    if (!Array.isArray(filtros) || filtros.length === 0) {
      return res.status(400).send('Lista de filtros é obrigatória');
    }

    const registrosCsv = [];
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
          registrosCsv.push(normalizarRowCsv(row));
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const resultados = [];
    for (const filtro of filtros) {
      const {
        colunaCsv_01,
        valorFiltro_01,
        colunaCsv_02,
        valorFiltro_02,
        periodoInicio,
        periodoFim
      } = filtro;


      if (!colunaCsv_01 || !valorFiltro_01) {
        continue;
      }
      let registrosFiltrados = registrosCsv.filter(
        registro => registro[colunaCsv_01] === valorFiltro_01
      );
      if (
        colunaCsv_02 === 'Período Aquisitivo' &&
        periodoInicio &&
        periodoFim
      ) {
        const [anoInicio, mesInicio] = periodoInicio.split('-').map(Number);
        const [anoFim, mesFim] = periodoFim.split('-').map(Number);

        const periodoInicialNumerico = converterPeriodoParaNumero({
          ano: anoInicio,
          mes: mesInicio
        });

        const periodoFinalNumerico = converterPeriodoParaNumero({
          ano: anoFim,
          mes: mesFim
        });

        registrosFiltrados = registrosFiltrados.filter(registro => {
          const periodoExtraido = extrairAnoMesDoPeriodo(
            registro[colunaCsv_02]
          );

          if (!periodoExtraido) return false;

          const periodoRegistroNumerico =
            converterPeriodoParaNumero(periodoExtraido);

          return (
            periodoRegistroNumerico >= periodoInicialNumerico &&
            periodoRegistroNumerico <= periodoFinalNumerico
          );
        });
      } else if (colunaCsv_02 && valorFiltro_02) {
        registrosFiltrados = registrosFiltrados.filter(
          registro => registro[colunaCsv_02] === valorFiltro_02
        );
      }
      const valoresMonetarios = registrosFiltrados
        .map(registro => converterValorMonetarioParaNumero(registro))
        .filter(valor => !isNaN(valor));

      const mediaAnualCalculada = await calcularMediaAnual(valoresMonetarios);
      const mediaAnualFormatada = formatarValorParaBRL(mediaAnualCalculada);

      resultados.push({
        filtroAplicado: valorFiltro_01,
        filtrados: registrosFiltrados,
        totalValorMedias: mediaAnualFormatada,
        totalFiltrados: registrosFiltrados.length
      });
    }

    salvarCsvNoCache(resultados);

    return res.json(resultados);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Erro interno');
  }
});

app.post('/download', autenticarToken,(req, res) => {
  const dados = obterCsvDoCache().map(csvCache => ({
    ID: csvCache.filtroAplicado,
    TotalMedia: Number(
      csvCache.totalValorMedias
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim()
    )
  }));

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultado');

  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  });

  res.setHeader(
    'Content-Disposition',
    'attachment; filename=resultado-filtrado.xlsx'
  );
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.send(buffer);
});

app.post('/usuario', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    console.log("nome: ", nome);
    console.log("email: ", email);
    console.log("senha: ", senha);
    if (!nome || !email || !senha) {
      return res.status(400).json({
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO users (nome, email, senha)
      VALUES (?, ?, ?)
    `;

    db.run(
      query,
      [nome, email, senhaCriptografada],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({
              message: 'Email já cadastrado'
            });
          }

          return res.status(500).json({
            message: 'Erro ao cadastrar usuário'
          });
        }

        return res.status(201).json({
          id: this.lastID,
          nome,
          email
        });
      }
    );
  } catch (error) {
    console.log("error:? ", error);
    return res.status(500).json({
      message: 'Erro interno'
    });
  }
});

app.post('/login', (req, res) => {
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
});

app.put('/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        message: 'Nome e email são obrigatórios'
      });
    }

    let senhaCriptografada = null;

    if (senha) {
      senhaCriptografada = await bcrypt.hash(senha, 10);
    }

    let query = `
      UPDATE users
      SET nome = ?, email = ?
    `;

    let params = [nome, email];

    if (senhaCriptografada) {
      query += `, senha = ?`;
      params.push(senhaCriptografada);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.run(query, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({
            message: 'Email já cadastrado'
          });
        }

        return res.status(500).json({
          message: 'Erro ao atualizar usuário'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: 'Usuário não encontrado'
        });
      }

      return res.status(200).json({
        message: 'Usuário atualizado com sucesso'
      });
    });

  } catch (error) {
    console.log('error:', error);
    return res.status(500).json({
      message: 'Erro interno'
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
