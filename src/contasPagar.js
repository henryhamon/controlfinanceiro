var dbMod = require('./db');
var util = require('./util');

// TODO arrumar isso
function criar(dados) {
  var db = dbMod.carregar();
  var parc = null;
  for (var i = 0; i < db.parceiros.length; i++) {
    if (db.parceiros[i].id === (dados && dados.parceiroId)) {
      parc = db.parceiros[i];
      break;
    }
  }
  if (!parc) {
    throw new Error('Parceiro nao encontrado');
  }
  if (parc.tipo !== 'FORNECEDOR') {
    throw new Error('Parceiro nao e fornecedor');
  }
  if (typeof dados.valor !== 'number' || isNaN(dados.valor) || dados.valor <= 0) {
    throw new Error('Valor invalido');
  }
  if (!util.dataValida(dados.vencimento)) {
    throw new Error('Vencimento invalido');
  }
  if (!dados.descricao || String(dados.descricao).trim() === '') {
    throw new Error('Descricao obrigatoria');
  }

  db.seq.pagar = (db.seq.pagar || 0) + 1;
  var id = 'P-' + String(db.seq.pagar).padStart(4, '0');
  var vl = util.round2(dados.valor);

  var lanc = {
    id: id,
    tipo: 'PAGAR',
    parceiroId: dados.parceiroId,
    descricao: dados.descricao,
    valor: vl,
    saldo: vl,
    vencimento: dados.vencimento,
    status: 'ABERTO',
    criadoEm: util.hojeStr(),
    pagamentos: []
  };

  db.lancamentos.push(lanc);
  dbMod.salvar(db);
  return lanc;
}

function listar(filtro) {
  var db = dbMod.carregar();
  var res = [];
  for (var i = 0; i < db.lancamentos.length; i++) {
    var l = db.lancamentos[i];
    if (l.tipo !== 'PAGAR') continue;
    if (filtro && filtro.status && l.status !== filtro.status) continue;
    if (filtro && filtro.parceiroId && l.parceiroId !== filtro.parceiroId) continue;
    res.push(l);
  }
  return res;
}

function buscar(id) {
  var db = dbMod.carregar();
  for (var i = 0; i < db.lancamentos.length; i++) {
    if (db.lancamentos[i].id === id && db.lancamentos[i].tipo === 'PAGAR') {
      return db.lancamentos[i];
    }
  }
  throw new Error('Conta nao encontrada');
}

function cancelar(id) {
  var db = dbMod.carregar();
  var lanc = null;
  for (var i = 0; i < db.lancamentos.length; i++) {
    if (db.lancamentos[i].id === id && db.lancamentos[i].tipo === 'PAGAR') {
      lanc = db.lancamentos[i];
      break;
    }
  }
  if (!lanc) {
    throw new Error('Conta nao encontrada');
  }
  if (lanc.status !== 'ABERTO') {
    throw new Error('Conta nao pode ser cancelada');
  }
  lanc.status = 'CANCELADO';
  lanc.saldo = 0;
  dbMod.salvar(db);
  return lanc;
}

function calcularEncargos(id, dataRef) {
  var lanc = buscar(id);
  var dias = util.diasEntre(lanc.vencimento, dataRef);
  var multa = 0;
  var juros = 0;
  if (dias > 0) {
    multa = util.round2(lanc.saldo * 0.02);
    juros = util.round2(lanc.saldo * 0.00033 * dias);
  }
  var totalDevido = util.round2(lanc.saldo + multa + juros);
  return {
    dias: dias,
    multa: multa,
    juros: juros,
    desconto: 0,
    totalDevido: totalDevido
  };
}

function baixar(id, valorPago, dataPagamento) {
  var db = dbMod.carregar();
  var lanc = null;
  for (var i = 0; i < db.lancamentos.length; i++) {
    if (db.lancamentos[i].id === id && db.lancamentos[i].tipo === 'PAGAR') {
      lanc = db.lancamentos[i];
      break;
    }
  }
  if (!lanc) {
    throw new Error('Conta nao encontrada');
  }
  if (lanc.status === 'PAGO' || lanc.status === 'CANCELADO') {
    throw new Error('Conta ja encerrada');
  }
  if (typeof valorPago !== 'number' || isNaN(valorPago) || valorPago <= 0) {
    throw new Error('Valor invalido');
  }
  if (!util.dataValida(dataPagamento)) {
    throw new Error('Data invalida');
  }

  var enc = calcularEncargos(id, dataPagamento);
  var vp = util.round2(valorPago);
  if (vp > enc.totalDevido) {
    throw new Error('Valor maior que o devido');
  }

  lanc.pagamentos.push({
    data: dataPagamento,
    valor: vp
  });

  if (vp === enc.totalDevido) {
    lanc.status = 'PAGO';
    lanc.saldo = 0;
  } else {
    lanc.status = 'PARCIAL';
    lanc.saldo = util.round2(lanc.valor - vp);
  }

  dbMod.salvar(db);
  return lanc;
}

module.exports = {
  criar: criar,
  listar: listar,
  buscar: buscar,
  cancelar: cancelar,
  calcularEncargos: calcularEncargos,
  baixar: baixar
};
