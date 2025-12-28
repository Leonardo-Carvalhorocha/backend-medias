const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(
  path.resolve(__dirname, 'db.sqlite'),
  (err) => {
    if (err) {
      console.error('Erro ao conectar no SQLite', err);
    } else {
      console.log('SQLite conectado');
    }
  }
);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
