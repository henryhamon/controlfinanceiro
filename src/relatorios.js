var dbMod = require('./db');
var util = require('./util');
var contasPagar = require('./contasPagar');
var contasReceber = require('./contasReceber');
var parceiros = require('./parceiros');

function resumo() {
  var db = dbMod.carregar();
  var res = {
    pagar: { aberto: 0, parcial: 0, pago: 0 },
    receber: { aberto: 0, parcial: 0, pago: 0 }
  };

  for (var i = 0; i < db.lancamentos.length; i++) {
    var l = db.lancamentos[i];
    if (l.status === 'CANCELADO') continue;

    var grp = l.tipo === 'PAGAR' ? res.pagar : res.receber;
    if (l.status === 'ABERTO') {
      grp.aberto = util.round2(grp.aberto + l.saldo);
    } else if (l.status === 'PARCIAL') {
      grp.parcial = util.round2(grp.parcial + l.saldo);
    } else if (l.status === 'PAGO') {
      var somaPg = 0;
      for (var j = 0; j < l.pagamentos.length; j++) {
        somaPg += l.pagamentos[j].valor;
      }
      grp.pago = util.round2(grp.pago + somaPg);
    }
  }
  return res;
}

function vencidos(hoje) {
  var dt = hoje || util.hojeStr();
  var db = dbMod.carregar();
  var lista = [];

  for (var i = 0; i < db.lancamentos.length; i++) {
    var l = db.lancamentos[i];
    if (l.status !== 'ABERTO' && l.status !== 'PARCIAL') continue;
    var dias = util.diasEntre(l.vencimento, dt);
    if (dias > 0) {
      var enc = l.tipo === 'PAGAR'
        ? contasPagar.calcularEncargos(l.id, dt)
        : contasReceber.calcularEncargos(l.id, dt);
      var item = {
        id: l.id,
        tipo: l.tipo,
        parceiroId: l.parceiroId,
        descricao: l.descricao,
        valor: l.valor,
        saldo: l.saldo,
        vencimento: l.vencimento,
        status: l.status,
        criadoEm: l.criadoEm,
        pagamentos: l.pagamentos,
        diasAtraso: enc.dias,
        totalDevido: enc.totalDevido
      };
      lista.push(item);
    }
  }

  lista.sort(function (a, b) {
    return b.diasAtraso - a.diasAtraso;
  });

  return lista;
}

function vencidosPorParceiro(hoje) {
  var dt = hoje || util.hojeStr();
  var venc = vencidos(dt);
  var mapa = {};
  var lista = [];

  for (var i = 0; i < venc.length; i++) {
    var v = venc[i];
    if (!mapa[v.parceiroId]) {
      var p = parceiros.buscar(v.parceiroId);
      mapa[v.parceiroId] = {
        parceiroId: v.parceiroId,
        nome: p.nome,
        quantidade: 0,
        totalDevido: 0
      };
      lista.push(mapa[v.parceiroId]);
    }
    mapa[v.parceiroId].quantidade += 1;
    mapa[v.parceiroId].totalDevido = util.round2(mapa[v.parceiroId].totalDevido + v.totalDevido);
  }

  lista.sort(function (a, b) {
    return b.totalDevido - a.totalDevido;
  });

  return lista;
}

function fluxoCaixa(ano) {
  var db = dbMod.carregar();
  var meses = [];

  for (var m = 1; m <= 12; m++) {
    var mesStr = String(ano) + '-' + String(m).padStart(2, '0');
    var prevRec = 0;
    var prevPag = 0;
    var realRec = 0;
    var realPag = 0;

    for (var i = 0; i < db.lancamentos.length; i++) {
      var l = db.lancamentos[i];
      if (l.status === 'CANCELADO') continue;

      if (util.mesDe(l.vencimento) === mesStr) {
        if (l.tipo === 'RECEBER') {
          prevRec = util.round2(prevRec + l.valor);
        } else {
          prevPag = util.round2(prevPag + l.valor);
        }
      }

      for (var j = 0; j < l.pagamentos.length; j++) {
        var pg = l.pagamentos[j];
        if (util.mesDe(pg.data) === mesStr) {
          if (l.tipo === 'RECEBER') {
            realRec = util.round2(realRec + pg.valor);
          } else {
            realPag = util.round2(realPag + pg.valor);
          }
        }
      }
    }

    meses.push({
      mes: mesStr,
      previstoReceber: prevRec,
      previstoPagar: prevPag,
      realizadoReceber: realRec,
      realizadoPagar: realPag,
      saldoPrevisto: util.round2(prevRec - prevPag),
      saldoRealizado: util.round2(realRec - realPag)
    });
  }

  return meses;
}

function posicaoLiquida() {
  var db = dbMod.carregar();
  var aReceber = 0;
  var aPagar = 0;

  for (var i = 0; i < db.lancamentos.length; i++) {
    var l = db.lancamentos[i];
    if (l.status !== 'ABERTO' && l.status !== 'PARCIAL') continue;
    if (l.tipo === 'RECEBER') {
      aReceber = util.round2(aReceber + l.saldo);
    } else if (l.tipo === 'PAGAR') {
      aPagar = util.round2(aPagar + l.saldo);
    }
  }

  return {
    aReceber: aReceber,
    aPagar: aPagar,
    liquido: util.round2(aReceber - aPagar)
  };
}

module.exports = {
  resumo: resumo,
  vencidos: vencidos,
  vencidosPorParceiro: vencidosPorParceiro,
  fluxoCaixa: fluxoCaixa,
  posicaoLiquida: posicaoLiquida
};
