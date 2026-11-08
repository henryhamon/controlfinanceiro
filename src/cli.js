var parceiros = require('./parceiros');
var contasPagar = require('./contasPagar');
var contasReceber = require('./contasReceber');
var relatorios = require('./relatorios');

var args = process.argv.slice(2);
var cmd = args[0];

function uso() {
  console.log('Comandos disponiveis:');
  console.log('  parceiro:add <FORNECEDOR|CLIENTE> <nome> <documento>');
  console.log('  parceiro:list [tipo]');
  console.log('  pagar:add <parceiroId> <descricao> <valor> <vencimento>');
  console.log('  pagar:list [status]');
  console.log('  pagar:baixa <id> <valor> <data>');
  console.log('  pagar:cancel <id>');
  console.log('  receber:add <parceiroId> <descricao> <valor> <vencimento>');
  console.log('  receber:list [status]');
  console.log('  receber:baixa <id> <valor> <data>');
  console.log('  receber:cancel <id>');
  console.log('  rel:resumo');
  console.log('  rel:vencidos [hoje]');
  console.log('  rel:fluxo <ano>');
  console.log('  rel:liquido');
}

if (!cmd) {
  uso();
  process.exit(0);
}

try {
  if (cmd === 'parceiro:add') {
    var p = parceiros.cadastrar({
      tipo: args[1],
      nome: args[2],
      documento: args[3]
    });
    console.log(JSON.stringify(p, null, 2));
  } else if (cmd === 'parceiro:list') {
    console.log(JSON.stringify(parceiros.listar(args[1]), null, 2));
  } else if (cmd === 'pagar:add') {
    var cp = contasPagar.criar({
      parceiroId: args[1],
      descricao: args[2],
      valor: Number(args[3]),
      vencimento: args[4]
    });
    console.log(JSON.stringify(cp, null, 2));
  } else if (cmd === 'pagar:list') {
    var fp = args[1] ? { status: args[1] } : undefined;
    console.log(JSON.stringify(contasPagar.listar(fp), null, 2));
  } else if (cmd === 'pagar:baixa') {
    var bxp = contasPagar.baixar(args[1], Number(args[2]), args[3]);
    console.log(JSON.stringify(bxp, null, 2));
  } else if (cmd === 'pagar:cancel') {
    var canp = contasPagar.cancelar(args[1]);
    console.log(JSON.stringify(canp, null, 2));
  } else if (cmd === 'receber:add') {
    var cr = contasReceber.criar({
      parceiroId: args[1],
      descricao: args[2],
      valor: Number(args[3]),
      vencimento: args[4]
    });
    console.log(JSON.stringify(cr, null, 2));
  } else if (cmd === 'receber:list') {
    var fr = args[1] ? { status: args[1] } : undefined;
    console.log(JSON.stringify(contasReceber.listar(fr), null, 2));
  } else if (cmd === 'receber:baixa') {
    var bxr = contasReceber.baixar(args[1], Number(args[2]), args[3]);
    console.log(JSON.stringify(bxr, null, 2));
  } else if (cmd === 'receber:cancel') {
    var canr = contasReceber.cancelar(args[1]);
    console.log(JSON.stringify(canr, null, 2));
  } else if (cmd === 'rel:resumo') {
    console.log(JSON.stringify(relatorios.resumo(), null, 2));
  } else if (cmd === 'rel:vencidos') {
    console.log(JSON.stringify(relatorios.vencidos(args[1]), null, 2));
  } else if (cmd === 'rel:fluxo') {
    console.log(JSON.stringify(relatorios.fluxoCaixa(Number(args[1])), null, 2));
  } else if (cmd === 'rel:liquido') {
    console.log(JSON.stringify(relatorios.posicaoLiquida(), null, 2));
  } else {
    uso();
  }
} catch (err) {
  console.log('ERRO: ' + err.message);
  process.exit(1);
}
