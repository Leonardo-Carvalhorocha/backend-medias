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

csvDownloadCache = [];

const salvarCsvNoCache = (data) => {
  csvDownloadCache = [...data];
}

const obterCsvDoCache = () => {
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

const limparCamposRow = (row) => {
  return {
    ID: row['ID']?.trim() || '',
    Nome: row['Nome']?.trim() || '',
    'Período Aquisitivo': row['Período Aquisitivo']?.trim() || '',
    'Elemento People': row['Elemento People']?.trim() || '',
    'Total Valor': row['Total Valor']?.replace(/\s+/g, ' ').trim() || ''
  };
}

const normalizarRowCsv = (row) => {
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

const extrairAnoMesDoPeriodo = (periodoAquisitivo) => {
  const resultado = periodoAquisitivo?.match(/(\d{4})M(\d{2})$/);
  if (!resultado) return null;

  return {
    ano: Number(resultado[1]),
    mes: Number(resultado[2])
  };
}

const converterPeriodoParaNumero = (periodo) => {
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

const converterValorMonetarioParaNumero = (registro) => {
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

const calcularMedia = async (valuesFilters, mes) => {
  return new Promise((resolve) => {
    let value = 0;
    for (const valueFilter of valuesFilters) {
      value += valueFilter;
    }

    value = value / mes;

    resolve(value);
  });
}

const formatarValorParaBRL = (valorNumerico) => {
  if (!Number.isFinite(valorNumerico)) {
    return 'R$ 0,00';
  }

  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

const paginar = (resultados, page, perPage = 25) => {
  const total = resultados.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    page,
    perPage,
    total,
    totalPages,
    resultados: resultados.slice(start, end),
  };
}

const formattDate = (valor) => {
  const [ano, mes] = valor.split('-');
  const dataFormatada = `${mes}/${ano}`;
  return dataFormatada;
}

const inserirDados = (db, dados) => {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const sql = `
      INSERT INTO adiantamentoDecimoTerceiro
      (id, nome, grupoCalendario, concepto, valor)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nome = excluded.nome,
        grupoCalendario = excluded.grupoCalendario,
        concepto = excluded.concepto,
        valor = excluded.valor
    `;

    const stmt = db.prepare(sql);

    for (let linha of dados) {
      stmt.run([
        linha.ID,
        linha.Nome,
        linha['Grupo Calendário'],
        linha.Concepto,
        linha[' Valor ']
      ]);
    }

    stmt.finalize();
    db.run("COMMIT");
  });
};


module.exports = {
    salvarCsvNoCache,
    obterCsvDoCache,
    normalizarRowCsv,
    extrairAnoMesDoPeriodo,
    converterPeriodoParaNumero,
    converterValorMonetarioParaNumero,
    calcularMedia,
    formatarValorParaBRL,
    paginar,
    formattDate,
    inserirDados
}