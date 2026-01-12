const {
  normalizarRowCsv,
  formattDate,
  converterPeriodoParaNumero,
  extrairAnoMesDoPeriodo,
  converterValorMonetarioParaNumero,
  calcularMedia,
  formatarValorParaBRL,
  salvarCsvNoCache,
  paginar,
  obterCsvDoCache
} = require("../utils/utils");
const { Readable } = require('stream');
const csv = require('csv-parser');


const XLSX = require("xlsx");

const download = async (req, res) => {
  const dados = obterCsvDoCache().map((csvCache) => {
    
    if(csvCache && csvCache.id) {
      return {
        ID: csvCache.id,
        TotalMedia: Number(
          csvCache.totalValorMedias
            .replace("R$", "")
            .replace(/\./g, "")
            .replace(",", ".")
            .trim()
        ),
      }
    } else {
    return {
        ID: `o Filtro aplicado ${csvCache.filtroAplicado} não foi encontrado`,
        TotalMedia: '0',
      }
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=resultado-filtrado.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.send(buffer);
};

const calculoMedias = async (req, res) => {
  try {
    let { filtros } = req.body;
    filtros = JSON.parse(filtros);
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 25;

    if (!req.file) {
      return res.status(400).send("Arquivo CSV não enviado");
    }

    if (!Array.isArray(filtros) || filtros.length === 0) {
      return res.status(400).send("Lista de filtros é obrigatória");
    }

    const registrosCsv = [];
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csv({ separator: ";" }))
        .on("data", (row) => {
          registrosCsv.push(normalizarRowCsv(row));
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const resultados = [];
    if (filtros[0].colunaCsv_01 === "Período Aquisitivo") {
      const ids = new Set();
      for (const csv of registrosCsv) {
        if (!ids.has(csv.ID)) {
          ids.add(csv.ID);
          filtros.push({
            colunaCsv_01: "ID",
            valorFiltro_01: csv.ID,
            colunaCsv_02: "Período Aquisitivo",
            valorFiltro_02: "",
            periodoInicio: filtros[0]?.periodoInicio,
            periodoFim: filtros[0]?.periodoFim,
            aberto: true,
            mes: filtros[0]?.mes,
            filtroAplicado: `Período inicial ${formattDate(
              filtros[0]?.periodoInicio
            )} período final ${formattDate(filtros[0]?.periodoFim)}`,
          });
        }
      }
      filtros.shift();
    }
    for (const filtro of filtros) {
      let colunaCsv_01 = filtro.colunaCsv_01.trim();
      let valorFiltro_01 = filtro.valorFiltro_01.trim();
      let colunaCsv_02 = filtro.colunaCsv_02.trim();
      let valorFiltro_02 = filtro.valorFiltro_02.trim();
      let periodoInicio = filtro.periodoInicio.trim();
      let periodoFim = filtro.periodoFim.trim();
      let mes = filtro.mes;
      let filtroAplicado = filtro.filtroAplicado ? filtro.filtroAplicado : null;
      if (!colunaCsv_01.trim() || !valorFiltro_01) {
        continue;
      }

      let registrosFiltrados = registrosCsv.filter(
        (registro) => registro[colunaCsv_01] === valorFiltro_01
      );

      let nomeFuncionario =
        registrosFiltrados && registrosFiltrados.length > 0
          ? registrosFiltrados[0].Nome
          : null;
      
      let idFuncionario = registrosFiltrados && registrosFiltrados.length > 0
          ? registrosFiltrados[0].ID
          : null;

      if (
        colunaCsv_02 === "Período Aquisitivo" &&
        periodoInicio &&
        periodoFim
      ) {
        const [anoInicio, mesInicio] = periodoInicio.split("-").map(Number);
        const [anoFim, mesFim] = periodoFim.split("-").map(Number);

        const periodoInicialNumerico = converterPeriodoParaNumero({
          ano: anoInicio,
          mes: mesInicio,
        });

        const periodoFinalNumerico = converterPeriodoParaNumero({
          ano: anoFim,
          mes: mesFim,
        });

        registrosFiltrados = registrosFiltrados.filter((registro) => {
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
          (registro) => registro[colunaCsv_02] === valorFiltro_02
        );
      }
      const valoresMonetarios = registrosFiltrados
        .map((registro) => converterValorMonetarioParaNumero(registro))
        .filter((valor) => !isNaN(valor));

      const mediaAnualCalculada = await calcularMedia(valoresMonetarios, mes);
      const mediaAnualFormatada = formatarValorParaBRL(mediaAnualCalculada);

      resultados.push({
        id: idFuncionario,
        nomeFuncionario: nomeFuncionario,
        filtroAplicado: filtroAplicado ? filtroAplicado : valorFiltro_01,
        filtrados: registrosFiltrados,
        totalValorMedias: mediaAnualFormatada,
        totalFiltrados: registrosFiltrados.length,
      });
    }

    salvarCsvNoCache(resultados);
    const paginado = paginar(resultados, page, perPage);

    return res.json(paginado);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Erro interno");
  }
};

const paginacaoMedia = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 25;
    const resultadosCacheados = obterCsvDoCache();

    if (!Array.isArray(resultadosCacheados)) {
      return res.status(404).json({
        message: "Nenhum resultado encontrado em cache",
      });
    }
    const paginado = paginar(resultadosCacheados, page, perPage);
    return res.json(paginado);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Erro interno");
  }
};

const filtrosCsv = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("Arquivo CSV não enviado");
      }

      const conteudoArquivo = req.file.buffer.toString("utf-8");
      const primeiraLinha = conteudoArquivo.split("\n")[0];

      const filtros = primeiraLinha
        .replace("\r", "")
        .split(",")
        .map((coluna) => coluna.replace(/^"+|"+$/g, "").trim());

      return res.json({ filtros });
    } catch (error) {
      console.error(error);
      return res.status(500).send("Erro interno");
    }
}

const buildFiltros = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("Arquivo CSV não enviado");
    }

    const conteudoArquivo = req.file.buffer.toString("utf-8");

    const linhas = conteudoArquivo
      .split("\n")
      .map(linha => linha.trim())
      .filter(Boolean);

    if (linhas.length === 0) {
      return res.status(400).send("Arquivo CSV vazio");
    }

    /* ==========================
       Validação do cabeçalho
    =========================== */
    const cabecalho = linhas[0].split(",").map(c => c.trim());

    const obrigatorias = ["id", "periodoInicial", "periodoFinal", "mes"];

    const faltantes = obrigatorias.filter(col => !cabecalho.includes(col));

    if (faltantes.length > 0) {
      return res.status(400).json({
        erro: "Cabeçalho do CSV inválido",
        colunasFaltantes: faltantes,
      });
    }

    /* ==========================
       Índices das colunas
    =========================== */
    const idxId = cabecalho.indexOf("id");
    const idxPeriodoInicial = cabecalho.indexOf("periodoInicial");
    const idxPeriodoFinal = cabecalho.indexOf("periodoFinal");
    const idxMes = cabecalho.indexOf("mes");

    /* ==========================
       Funções utilitárias
    =========================== */
    const parseDataBR = (data) => {
      const [dia, mes, ano] = data.split("/").map(Number);
      return { dia, mes, ano };
    };

    const formatAnoMes = (ano, mes) => {
      return `${ano}-${String(mes).padStart(2, "0")}`;
    };

    /* ==========================
       Regras de negócio
    =========================== */
    const calcularPeriodoInicial = (data) => {
      let { dia, mes, ano } = parseDataBR(data);

      const diasTrabalhados = 30 - dia;

      if (diasTrabalhados <= 15) {
        mes += 1;
        if (mes > 12) {
          mes = 1;
          ano += 1;
        }
      }

      return formatAnoMes(ano, mes);
    };

    const calcularPeriodoFinal = (data) => {
      let { dia, mes, ano } = parseDataBR(data);

      if (dia >= 15) {
        mes += 1;
        if (mes > 12) {
          mes = 1;
          ano += 1;
        }
      }

      return formatAnoMes(ano, mes);
    };

    /* ==========================
       Processamento
    =========================== */
    linhas.shift();

    const filtros = linhas.map((linha) => {
      const valores = linha.split(",").map(v => v.trim());

      return {
        colunaCsv_01: "ID",
        valorFiltro_01: valores[idxId],

        colunaCsv_02: "Período Aquisitivo",
        valorFiltro_02: "",

        periodoInicio: calcularPeriodoInicial(valores[idxPeriodoInicial]),
        periodoFim: calcularPeriodoFinal(valores[idxPeriodoFinal]),

        aberto: false,
        mes: Number(valores[idxMes]) || 12,
      };
    });

    return res.json(filtros);

  } catch (error) {
    console.error(error);
    return res.status(500).send("Erro interno");
  }
};


module.exports = {
    download,
    calculoMedias,
    paginacaoMedia,
    filtrosCsv,
    buildFiltros
}