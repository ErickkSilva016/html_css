const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// Usamos o módulo SQLite nativo do próprio Node.js (disponível a partir da
// v22.5). Isso evita qualquer problema de compilação nativa (node-gyp,
// Python, Visual Studio Build Tools no Windows, etc.) que módulos como
// better-sqlite3 ou sqlite3 costumam causar.
const DB_PATH = path.join(__dirname, "milistore.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Aplica o schema sempre que o servidor sobe (CREATE TABLE IF NOT EXISTS
// não recria nem apaga nada que já exista).
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

// Pequeno helper de transação, no mesmo estilo do better-sqlite3:
//   const rodar = db.transaction(() => { ... });
//   rodar();
db.transaction = function (fn) {
  return (...args) => {
    db.exec("BEGIN");
    try {
      const result = fn(...args);
      db.exec("COMMIT");
      return result;
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  };
};

module.exports = db;
