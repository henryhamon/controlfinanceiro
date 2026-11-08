var dbMod = require('./db');
var util = require('./util');

// nao mexer
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
  if (parc.tipo !== 'CLIENTE') {
    throw new Error('Parceiro nao e cliente');
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

  db.seq.receber = (db.seq.receber || 0) + 1;
  var id = 'R-' + String(db.seq.receber).padStart(4, '0');
  var vl = util.round2(dados.valor);

  var lanc = {
    id: id,
    tipo: 'RECEBER',
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
    if (l.tipo !== 'RECEBER') continue;
    if (filtro && filtro.status && l.status !== filtro.status) continue;
    if (filtro && filtro.parceiroId && l.parceiroId !== filtro.parceiroId) continue;
    res.push(l);
  }
  return res;
}

function buscar(id) {
  var db = dbMod.carregar();
  for (var i = 0; i < db.lancamentos.length; i++) {
    if (db.lancamentos[i].id === id && db.lancamentos[i].tipo === 'RECEBER') {
      return db.lancamentos[i];
    }
  }
  throw new Error('Conta nao encontrada');
}

function cancelar(id) {
  var db = dbMod.carregar();
  var lanc = null;
  for (var i = 0; i < db.lancamentos.length; i++) {
    if (db.lancamentos[i].id === id && db.lancamentos[i].tipo === 'RECEBER') {
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
  var desconto = 0;
  if (dias > 0) {
    multa = util.round2(lanc.saldo * 0.02);
    juros = util.round2(lanc.saldo * 0.00033 * dias);
  } else if (util.diasEntre(dataRef, lanc.vencimento) >= 5) {
    desconto = util.round2(lanc.saldo * 0.03);
  }
  var totalDevido = util.round2(lanc.saldo + multa + juros - desconto);
  return {
    dias: dias,
    multa: multa,
    juros: juros,
    desconto: desconto,
    totalDevido: totalDevido
  };
}

function baixar(id, valorPago, dataPagamento) {
  var db = dbMod.carregar();
  var lanc = null;
  for (var i = 0; i < db.lancamentos.length; i++) {
    if (db.lancamentos[i].id === id && db.lancamentos[i].tipo === 'RECEBER') {
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
    lanc.saldo = util.round2(enc.totalDevido - vp);
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
