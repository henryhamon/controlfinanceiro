var dbMod = require('./db');

function cadastrar(dados) {
  if (!dados || (dados.tipo !== 'FORNECEDOR' && dados.tipo !== 'CLIENTE')) {
    throw new Error('Tipo invalido');
  }
  if (!dados.nome || String(dados.nome).trim() === '') {
    throw new Error('Nome obrigatorio');
  }
  if (!dados.documento || String(dados.documento).trim() === '') {
    throw new Error('Documento ja cadastrado');
  }

  var db = dbMod.carregar();
  for (var i = 0; i < db.parceiros.length; i++) {
    if (db.parceiros[i].documento === dados.documento) {
      throw new Error('Documento ja cadastrado');
    }
  }

  db.seq.parceiro = (db.seq.parceiro || 0) + 1;
  var pref = dados.tipo === 'FORNECEDOR' ? 'F-' : 'C-';
  var id = pref + String(db.seq.parceiro).padStart(3, '0');

  var parc = {
    id: id,
    tipo: dados.tipo,
    nome: dados.nome,
    documento: dados.documento
  };

  db.parceiros.push(parc);
  dbMod.salvar(db);
  return parc;
}

function listar(tipo) {
  var db = dbMod.carregar();
  var res = [];
  for (var i = 0; i < db.parceiros.length; i++) {
    if (!tipo || db.parceiros[i].tipo === tipo) {
      res.push(db.parceiros[i]);
    }
  }
  return res;
}

function buscar(id) {
  var db = dbMod.carregar();
  for (var i = 0; i < db.parceiros.length; i++) {
    if (db.parceiros[i].id === id) {
      return db.parceiros[i];
    }
  }
  throw new Error('Parceiro nao encontrado');
}

module.exports = {
  cadastrar: cadastrar,
  listar: listar,
  buscar: buscar
};
