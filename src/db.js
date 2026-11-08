var fs = require('fs');
var path = require('path');

function getArq() {
  return process.env.CONTAS_DB || 'data/db.json';
}

function carregar() {
  var arq = getArq();
  if (!fs.existsSync(arq)) {
    return {
      parceiros: [],
      lancamentos: [],
      seq: { parceiro: 0, pagar: 0, receber: 0 }
    };
  }
  var txt = fs.readFileSync(arq, 'utf8');
  return JSON.parse(txt);
}

function salvar(db) {
  var arq = getArq();
  var dir = path.dirname(arq);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(arq, JSON.stringify(db, null, 2), 'utf8');
}

module.exports = {
  carregar: carregar,
  salvar: salvar
};
