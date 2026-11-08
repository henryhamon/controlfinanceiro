var http = require('http');
var url = require('url');
var querystring = require('querystring');
var parceiros = require('./parceiros');
var contasPagar = require('./contasPagar');
var contasReceber = require('./contasReceber');
var relatorios = require('./relatorios');
var util = require('./util');

var porta = process.env.PORT || 3000;

function formataDataBr(s) {
  if (!s) return '';
  var p = String(s).split('-');
  if (p.length !== 3) return s;
  return p[2] + '/' + p[1] + '/' + p[0];
}

function paginaErro(res, msg) {
  var html = '<html><head><title>ERRO DO SISTEMA</title></head>';
  html += '<body bgcolor="#FF0000" text="#FFFF00">';
  html += '<center><br><br><br>';
  html += '<table width="600" border="3" cellpadding="10" bgcolor="#990000"><tr><td align="center">';
  html += '<font face="Times New Roman" size="6" color="#FFFF00"><blink><b>ERRO: ' + msg + '</b></blink></font>';
  html += '<br><br><font face="Verdana" size="2"><a href="javascript:history.back()" style="color:#FFFFFF">Voltar</a></font>';
  html += '</td></tr></table>';
  html += '</center></body></html>';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function lerPost(req, cb) {
  var body = '';
  req.on('data', function (chunk) {
    body += chunk.toString();
  });
  req.on('end', function () {
    cb(querystring.parse(body));
  });
}

var server = http.createServer(function (req, res) {
  var parsed = url.parse(req.url, true);
  var pathname = parsed.pathname;
  var query = parsed.query || {};

  try {
    if (req.method === 'GET' && pathname === '/') {
      var r = relatorios.resumo();
      var html = '<html><head><title>ControlFinanceiro 1.0</title></head>';
      html += '<body bgcolor="#C0C0C0" style="font-family:Verdana;font-size:10px;">';
      html += '<center><table width="800" border="1" cellpadding="4" cellspacing="0" bgcolor="#DCDCDC">';
      html += '<tr bgcolor="#000080"><td align="center"><font face="Times New Roman" size="5" color="#FFFFFF"><b>ControlFinanceiro 1.0 - Sistema de Contas</b></font></td></tr>';
      html += '<tr bgcolor="#EEEEEE"><td align="center"><font face="Verdana" size="2">';
      html += '<a href="/">Inicio</a> | <a href="/parceiros">Parceiros</a> | <a href="/pagar">Contas a Pagar</a> | <a href="/receber">Contas a Receber</a> | <a href="/relatorios">Relatorios</a>';
      html += '</font></td></tr>';
      html += '<tr><td>';
      html += '<h2><u><font face="Times New Roman">Painel Principal - Resumo Geral</font></u></h2>';
      html += '<p>Bem-vindo ao sistema corporativo ControlFinanceiro. Utilize os links acima para navegar.</p>';
      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>Tipo</th><th>Em Aberto</th><th>Parcial</th><th>Pago</th></tr>';
      html += '<tr bgcolor="#FFFFCC"><td><b>CONTAS A PAGAR</b></td>';
      html += '<td style="font-family:Courier New">R$ ' + r.pagar.aberto + '</td>';
      html += '<td style="font-family:Courier New">' + r.pagar.parcial + '</td>';
      html += '<td style="font-family:Courier New">R$ ' + r.pagar.pago + '</td></tr>';
      html += '<tr bgcolor="#CCFFFF"><td><b>CONTAS A RECEBER</b></td>';
      html += '<td style="font-family:Courier New">' + r.receber.aberto + '</td>';
      html += '<td style="font-family:Courier New">R$ ' + r.receber.parcial + '</td>';
      html += '<td style="font-family:Courier New">' + r.receber.pago + '</td></tr>';
      html += '</table><br>';
      html += '</td></tr>';
      html += '<tr bgcolor="#B0B0B0"><td align="center">';
      html += '<marquee bgcolor="#FFFF00" style="font-family:Courier New;font-size:11px;color:#000000;">Backup diario as 23h - nao desligue o computador</marquee><br>';
      html += '<font face="Verdana" size="1">Visitante numero 004213 | Melhor visualizado em 1024x768 | Desenvolvido em 2003</font>';
      html += '</td></tr></table></center></body></html>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && pathname === '/parceiros') {
      var listaP = parceiros.listar();
      var html = '<html><head><title>ControlFinanceiro 1.0 - Parceiros</title></head>';
      html += '<body bgcolor="#C0C0C0" style="font-family:Verdana;font-size:10px;">';
      html += '<center><table width="800" border="1" cellpadding="4" cellspacing="0" bgcolor="#DCDCDC">';
      html += '<tr bgcolor="#000080"><td align="center"><font face="Times New Roman" size="5" color="#FFFFFF"><b>ControlFinanceiro 1.0 - Sistema de Contas</b></font></td></tr>';
      html += '<tr bgcolor="#EEEEEE"><td align="center"><font face="Verdana" size="2">';
      html += '<a href="/">Inicio</a> | <a href="/parceiros">Parceiros</a> | <a href="/pagar">Contas a Pagar</a> | <a href="/receber">Contas a Receber</a> | <a href="/relatorios">Relatorios</a>';
      html += '</font></td></tr>';
      html += '<tr><td>';
      html += '<h2><u><font face="Times New Roman">Cadastro de Parceiros (Clientes / Fornecedores)</font></u></h2>';
      html += '<form method="POST" action="/parceiros/novo">';
      html += '<table border="1" cellpadding="2" bgcolor="#EEEEEE"><tr>';
      html += '<td>Tipo: <select name="tipo"><option value="FORNECEDOR">FORNECEDOR</option><option value="CLIENTE">CLIENTE</option></select></td>';
      html += '<td>Nome: <input type="text" name="nome" size="25"></td>';
      html += '<td>Doc (CPF/CNPJ): <input type="text" name="documento" size="18"></td>';
      html += '<td><input type="submit" value="Cadastrar Parceiro"></td>';
      html += '</tr></table></form>';
      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>Codigo</th><th>Tipo</th><th>Nome / Razao Social</th><th>Documento</th></tr>';
      for (var i = 0; i < listaP.length; i++) {
        var cor = (i % 2 === 0) ? '#FFFFCC' : '#CCFFFF';
        html += '<tr bgcolor="' + cor + '">';
        html += '<td style="font-family:Courier New">' + listaP[i].id + '</td>';
        html += '<td>' + listaP[i].tipo + '</td>';
        html += '<td>' + listaP[i].nome + '</td>';
        html += '<td style="font-family:Courier New">' + listaP[i].documento + '</td>';
        html += '</tr>';
      }
      html += '</table><br>';
      html += '</td></tr>';
      html += '<tr bgcolor="#B0B0B0"><td align="center">';
      html += '<marquee bgcolor="#FFFF00" style="font-family:Courier New;font-size:11px;color:#000000;">Backup diario as 23h - nao desligue o computador</marquee><br>';
      html += '<font face="Verdana" size="1">Visitante numero 004213 | Melhor visualizado em 1024x768 | Desenvolvido em 2003</font>';
      html += '</td></tr></table></center></body></html>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && pathname === '/parceiros/novo') {
      lerPost(req, function (dados) {
        try {
          parceiros.cadastrar({
            tipo: dados.tipo,
            nome: dados.nome,
            documento: dados.documento
          });
          res.writeHead(302, { Location: '/parceiros' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/pagar') {
      var stFiltro = query.status || '';
      var filtroObj = stFiltro ? { status: stFiltro } : undefined;
      var contas = contasPagar.listar(filtroObj);
      var forns = parceiros.listar('FORNECEDOR');
      var hoje = util.hojeStr();

      var html = '<html><head><title>ControlFinanceiro 1.0 - Contas a Pagar</title></head>';
      html += '<body bgcolor="#C0C0C0" style="font-family:Verdana;font-size:10px;">';
      html += '<center><table width="800" border="1" cellpadding="4" cellspacing="0" bgcolor="#DCDCDC">';
      html += '<tr bgcolor="#000080"><td align="center"><font face="Times New Roman" size="5" color="#FFFFFF"><b>ControlFinanceiro 1.0 - Sistema de Contas</b></font></td></tr>';
      html += '<tr bgcolor="#EEEEEE"><td align="center"><font face="Verdana" size="2">';
      html += '<a href="/">Inicio</a> | <a href="/parceiros">Parceiros</a> | <a href="/pagar">Contas a Pagar</a> | <a href="/receber">Contas a Receber</a> | <a href="/relatorios">Relatorios</a>';
      html += '</font></td></tr>';
      html += '<tr><td>';
      html += '<h2><u><font face="Times New Roman">Contas a Pagar</font></u></h2>';

      html += '<form method="POST" action="/pagar/novo">';
      html += '<table border="1" cellpadding="2" bgcolor="#EEEEEE"><tr><td colspan="5"><b>Novo Lancamento a Pagar</b></td></tr><tr>';
      html += '<td>Fornecedor: <select name="parceiroId">';
      for (var f = 0; f < forns.length; f++) {
        html += '<option value="' + forns[f].id + '">' + forns[f].id + ' - ' + forns[f].nome + '</option>';
      }
      html += '</select></td>';
      html += '<td>Desc: <input type="text" name="descricao" size="18"></td>';
      html += '<td>Valor: <input type="text" name="valor" size="8"></td>';
      html += '<td>Venc (AAAA-MM-DD): <input type="text" name="vencimento" size="10" value="' + hoje + '"></td>';
      html += '<td><input type="submit" value="Incluir"></td>';
      html += '</tr></table></form>';

      html += '<form method="GET" action="/pagar">';
      html += 'Filtrar Status: <select name="status">';
      html += '<option value="">TODOS</option>';
      html += '<option value="ABERTO"' + (stFiltro === 'ABERTO' ? ' selected' : '') + '>ABERTO</option>';
      html += '<option value="PARCIAL"' + (stFiltro === 'PARCIAL' ? ' selected' : '') + '>PARCIAL</option>';
      html += '<option value="PAGO"' + (stFiltro === 'PAGO' ? ' selected' : '') + '>PAGO</option>';
      html += '<option value="CANCELADO"' + (stFiltro === 'CANCELADO' ? ' selected' : '') + '>CANCELADO</option>';
      html += '</select> <input type="submit" value="Filtrar">';
      html += '</form>';

      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>ID</th><th>Fornecedor</th><th>Descricao</th><th>Vencimento</th><th>Valor</th><th>Saldo</th><th>Status</th><th>Baixar / Cancelar</th></tr>';
      for (var i = 0; i < contas.length; i++) {
        var c = contas[i];
        var cor = (i % 2 === 0) ? '#FFFFCC' : '#CCFFFF';
        var vencido = (c.status === 'ABERTO' || c.status === 'PARCIAL') && util.diasEntre(c.vencimento, hoje) > 0;
        var stCell = '';
        if (c.status === 'ABERTO') stCell = '<td bgcolor="#FFFF00" align="center"><b>ABERTO</b></td>';
        else if (c.status === 'PARCIAL') stCell = '<td bgcolor="#FF9900" align="center"><b>PARCIAL</b></td>';
        else if (c.status === 'PAGO') stCell = '<td bgcolor="#00FF00" align="center"><b>PAGO</b></td>';
        else if (c.status === 'CANCELADO') stCell = '<td bgcolor="#999999" align="center"><s>CANCELADO</s></td>';

        var descTxt = c.status === 'CANCELADO' ? '<s>' + c.descricao + '</s>' : (vencido ? '<font color="#FF0000"><b>' + c.descricao + '</b></font>' : c.descricao);
        var vencTxt = vencido ? '<font color="#FF0000"><b>' + c.vencimento + '</b></font>' : c.vencimento;

        html += '<tr bgcolor="' + cor + '">';
        html += '<td style="font-family:Courier New">' + c.id + '</td>';
        html += '<td>' + c.parceiroId + '</td>';
        html += '<td>' + descTxt + '</td>';
        html += '<td>' + vencTxt + '</td>';
        html += '<td style="font-family:Courier New">R$ ' + c.valor + '</td>';
        html += '<td style="font-family:Courier New">' + c.saldo + '</td>';
        html += stCell;
        html += '<td>';
        html += '<form method="POST" action="/pagar/baixa" style="display:inline;margin:0;">';
        html += '<input type="hidden" name="id" value="' + c.id + '">';
        html += '<input type="text" name="valor" size="6" value="' + c.saldo + '"> ';
        html += '<input type="text" name="data" size="10" value="' + hoje + '"> ';
        html += '<input type="submit" value="Baixar">';
        html += '</form> ';
        html += '<form method="POST" action="/pagar/cancelar" style="display:inline;margin:0;">';
        html += '<input type="hidden" name="id" value="' + c.id + '">';
        html += '<input type="submit" value="Cancelar" onclick="return confirm(\'Tem certeza?\')">';
        html += '</form>';
        html += '</td></tr>';
      }
      html += '</table><br>';
      html += '</td></tr>';
      html += '<tr bgcolor="#B0B0B0"><td align="center">';
      html += '<marquee bgcolor="#FFFF00" style="font-family:Courier New;font-size:11px;color:#000000;">Backup diario as 23h - nao desligue o computador</marquee><br>';
      html += '<font face="Verdana" size="1">Visitante numero 004213 | Melhor visualizado em 1024x768 | Desenvolvido em 2003</font>';
      html += '</td></tr></table></center></body></html>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && pathname === '/pagar/novo') {
      lerPost(req, function (dados) {
        try {
          contasPagar.criar({
            parceiroId: dados.parceiroId,
            descricao: dados.descricao,
            valor: Number(dados.valor),
            vencimento: dados.vencimento
          });
          res.writeHead(302, { Location: '/pagar' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/pagar/baixa') {
      lerPost(req, function (dados) {
        try {
          contasPagar.baixar(dados.id, Number(dados.valor), dados.data);
          res.writeHead(302, { Location: '/pagar' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/pagar/cancelar') {
      lerPost(req, function (dados) {
        try {
          contasPagar.cancelar(dados.id);
          res.writeHead(302, { Location: '/pagar' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/receber') {
      var stFiltroR = query.status || '';
      var filtroObjR = stFiltroR ? { status: stFiltroR } : undefined;
      var contasR = contasReceber.listar(filtroObjR);
      var clis = parceiros.listar('CLIENTE');
      var hojeR = util.hojeStr();

      var html = '<html><head><title>ControlFinanceiro 1.0 - Contas a Receber</title></head>';
      html += '<body bgcolor="#C0C0C0" style="font-family:Verdana;font-size:10px;">';
      html += '<center><table width="800" border="1" cellpadding="4" cellspacing="0" bgcolor="#DCDCDC">';
      html += '<tr bgcolor="#000080"><td align="center"><font face="Times New Roman" size="5" color="#FFFFFF"><b>ControlFinanceiro 1.0 - Sistema de Contas</b></font></td></tr>';
      html += '<tr bgcolor="#EEEEEE"><td align="center"><font face="Verdana" size="2">';
      html += '<a href="/">Inicio</a> | <a href="/parceiros">Parceiros</a> | <a href="/pagar">Contas a Pagar</a> | <a href="/receber">Contas a Receber</a> | <a href="/relatorios">Relatorios</a>';
      html += '</font></td></tr>';
      html += '<tr><td>';
      html += '<h2><u><font face="Times New Roman">Contas a Receber</font></u></h2>';

      html += '<form method="POST" action="/receber/novo">';
      html += '<table border="1" cellpadding="2" bgcolor="#EEEEEE"><tr><td colspan="5"><b>Novo Lancamento a Receber</b></td></tr><tr>';
      html += '<td>Cliente: <select name="parceiroId">';
      for (var k = 0; k < clis.length; k++) {
        html += '<option value="' + clis[k].id + '">' + clis[k].id + ' - ' + clis[k].nome + '</option>';
      }
      html += '</select></td>';
      html += '<td>Desc: <input type="text" name="descricao" size="18"></td>';
      html += '<td>Valor: <input type="text" name="valor" size="8"></td>';
      html += '<td>Venc (AAAA-MM-DD): <input type="text" name="vencimento" size="10" value="' + hojeR + '"></td>';
      html += '<td><input type="submit" value="Incluir"></td>';
      html += '</tr></table></form>';

      html += '<form method="GET" action="/receber">';
      html += 'Filtrar Status: <select name="status">';
      html += '<option value="">TODOS</option>';
      html += '<option value="ABERTO"' + (stFiltroR === 'ABERTO' ? ' selected' : '') + '>ABERTO</option>';
      html += '<option value="PARCIAL"' + (stFiltroR === 'PARCIAL' ? ' selected' : '') + '>PARCIAL</option>';
      html += '<option value="PAGO"' + (stFiltroR === 'PAGO' ? ' selected' : '') + '>PAGO</option>';
      html += '<option value="CANCELADO"' + (stFiltroR === 'CANCELADO' ? ' selected' : '') + '>CANCELADO</option>';
      html += '</select> <input type="submit" value="Filtrar">';
      html += '</form>';

      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>ID</th><th>Cliente</th><th>Descricao</th><th>Vencimento</th><th>Valor</th><th>Saldo</th><th>Status</th><th>Baixar / Cancelar</th></tr>';
      for (var j = 0; j < contasR.length; j++) {
        var cr = contasR[j];
        var corR = (j % 2 === 0) ? '#FFFFCC' : '#CCFFFF';
        var vencidoR = (cr.status === 'ABERTO' || cr.status === 'PARCIAL') && util.diasEntre(cr.vencimento, hojeR) > 0;
        var stCellR = '';
        if (cr.status === 'ABERTO') stCellR = '<td bgcolor="#FFFF00" align="center"><b>ABERTO</b></td>';
        else if (cr.status === 'PARCIAL') stCellR = '<td bgcolor="#FF9900" align="center"><b>PARCIAL</b></td>';
        else if (cr.status === 'PAGO') stCellR = '<td bgcolor="#00FF00" align="center"><b>PAGO</b></td>';
        else if (cr.status === 'CANCELADO') stCellR = '<td bgcolor="#999999" align="center"><s>CANCELADO</s></td>';

        var descTxtR = cr.status === 'CANCELADO' ? '<s>' + cr.descricao + '</s>' : (vencidoR ? '<font color="#FF0000"><b>' + cr.descricao + '</b></font>' : cr.descricao);
        var vencTxtR = vencidoR ? '<font color="#FF0000"><b>' + formataDataBr(cr.vencimento) + '</b></font>' : formataDataBr(cr.vencimento);

        html += '<tr bgcolor="' + corR + '">';
        html += '<td style="font-family:Courier New">' + cr.id + '</td>';
        html += '<td>' + cr.parceiroId + '</td>';
        html += '<td>' + descTxtR + '</td>';
        html += '<td>' + vencTxtR + '</td>';
        html += '<td style="font-family:Courier New">' + cr.valor + '</td>';
        html += '<td style="font-family:Courier New">R$ ' + cr.saldo + '</td>';
        html += stCellR;
        html += '<td>';
        html += '<form method="POST" action="/receber/baixa" style="display:inline;margin:0;">';
        html += '<input type="hidden" name="id" value="' + cr.id + '">';
        html += '<input type="text" name="valor" size="6" value="' + cr.saldo + '"> ';
        html += '<input type="text" name="data" size="10" value="' + hojeR + '"> ';
        html += '<input type="submit" value="Baixar">';
        html += '</form> ';
        html += '<form method="POST" action="/receber/cancelar" style="display:inline;margin:0;">';
        html += '<input type="hidden" name="id" value="' + cr.id + '">';
        html += '<input type="submit" value="Cancelar" onclick="return confirm(\'Tem certeza?\')">';
        html += '</form>';
        html += '</td></tr>';
      }
      html += '</table><br>';
      html += '</td></tr>';
      html += '<tr bgcolor="#B0B0B0"><td align="center">';
      html += '<marquee bgcolor="#FFFF00" style="font-family:Courier New;font-size:11px;color:#000000;">Backup diario as 23h - nao desligue o computador</marquee><br>';
      html += '<font face="Verdana" size="1">Visitante numero 004213 | Melhor visualizado em 1024x768 | Desenvolvido em 2003</font>';
      html += '</td></tr></table></center></body></html>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && pathname === '/receber/novo') {
      lerPost(req, function (dados) {
        try {
          contasReceber.criar({
            parceiroId: dados.parceiroId,
            descricao: dados.descricao,
            valor: Number(dados.valor),
            vencimento: dados.vencimento
          });
          res.writeHead(302, { Location: '/receber' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/receber/baixa') {
      lerPost(req, function (dados) {
        try {
          contasReceber.baixar(dados.id, Number(dados.valor), dados.data);
          res.writeHead(302, { Location: '/receber' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/receber/cancelar') {
      lerPost(req, function (dados) {
        try {
          contasReceber.cancelar(dados.id);
          res.writeHead(302, { Location: '/receber' });
          res.end();
        } catch (e) {
          paginaErro(res, e.message);
        }
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/relatorios') {
      var dtRef = query.hoje || util.hojeStr();
      var anoRef = Number(query.ano || 2026);
      var resGer = relatorios.resumo();
      var posLiq = relatorios.posicaoLiquida();
      var venc = relatorios.vencidos(dtRef);
      var vencParc = relatorios.vencidosPorParceiro(dtRef);
      var fluxo = relatorios.fluxoCaixa(anoRef);

      var html = '<html><head><title>ControlFinanceiro 1.0 - Relatorios</title></head>';
      html += '<body bgcolor="#C0C0C0" style="font-family:Verdana;font-size:10px;">';
      html += '<center><table width="800" border="1" cellpadding="4" cellspacing="0" bgcolor="#DCDCDC">';
      html += '<tr bgcolor="#000080"><td align="center"><font face="Times New Roman" size="5" color="#FFFFFF"><b>ControlFinanceiro 1.0 - Sistema de Contas</b></font></td></tr>';
      html += '<tr bgcolor="#EEEEEE"><td align="center"><font face="Verdana" size="2">';
      html += '<a href="/">Inicio</a> | <a href="/parceiros">Parceiros</a> | <a href="/pagar">Contas a Pagar</a> | <a href="/receber">Contas a Receber</a> | <a href="/relatorios">Relatorios</a>';
      html += '</font></td></tr>';
      html += '<tr><td>';
      html += '<h2><u><font face="Times New Roman">Relatorios Gerenciais</font></u></h2>';

      html += '<form method="GET" action="/relatorios">';
      html += 'Data Hoje (AAAA-MM-DD): <input type="text" name="hoje" size="12" value="' + dtRef + '"> ';
      html += 'Ano Fluxo: <input type="text" name="ano" size="6" value="' + anoRef + '"> ';
      html += '<input type="submit" value="Atualizar Relatorios">';
      html += '</form>';

      html += '<h3><u><font face="Times New Roman">1. Resumo e Posicao Liquida</font></u></h3>';
      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>Pagar Aberto</th><th>Pagar Parcial</th><th>Pagar Pago</th><th>Receber Aberto</th><th>Receber Parcial</th><th>Receber Pago</th></tr>';
      html += '<tr bgcolor="#FFFFCC">';
      html += '<td style="font-family:Courier New">R$ ' + resGer.pagar.aberto + '</td>';
      html += '<td style="font-family:Courier New">' + resGer.pagar.parcial + '</td>';
      html += '<td style="font-family:Courier New">R$ ' + resGer.pagar.pago + '</td>';
      html += '<td style="font-family:Courier New">' + resGer.receber.aberto + '</td>';
      html += '<td style="font-family:Courier New">R$ ' + resGer.receber.parcial + '</td>';
      html += '<td style="font-family:Courier New">' + resGer.receber.pago + '</td>';
      html += '</tr></table><br>';

      html += '<table width="50%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>Total a Receber</th><th>Total a Pagar</th><th>Saldo Liquido</th></tr>';
      html += '<tr bgcolor="#CCFFFF">';
      html += '<td style="font-family:Courier New">R$ ' + posLiq.aReceber + '</td>';
      html += '<td style="font-family:Courier New">' + posLiq.aPagar + '</td>';
      html += '<td style="font-family:Courier New"><b>R$ ' + posLiq.liquido + '</b></td>';
      html += '</tr></table>';

      html += '<h3><u><font face="Times New Roman">2. Titulos Vencidos (Ref: ' + formataDataBr(dtRef) + ')</font></u></h3>';
      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>ID</th><th>Tipo</th><th>Parceiro</th><th>Descricao</th><th>Vencimento</th><th>Dias Atraso</th><th>Saldo</th><th>Total Devido</th></tr>';
      for (var v = 0; v < venc.length; v++) {
        var corV = (v % 2 === 0) ? '#FFFFCC' : '#CCFFFF';
        html += '<tr bgcolor="' + corV + '">';
        html += '<td style="font-family:Courier New"><font color="#FF0000"><b>' + venc[v].id + '</b></font></td>';
        html += '<td>' + venc[v].tipo + '</td>';
        html += '<td>' + venc[v].parceiroId + '</td>';
        html += '<td><font color="#FF0000"><b>' + venc[v].descricao + '</b></font></td>';
        html += '<td>' + venc[v].vencimento + '</td>';
        html += '<td style="font-family:Courier New" align="center"><b>' + venc[v].diasAtraso + '</b></td>';
        html += '<td style="font-family:Courier New">' + venc[v].saldo + '</td>';
        html += '<td style="font-family:Courier New"><font color="#FF0000"><b>R$ ' + venc[v].totalDevido + '</b></font></td>';
        html += '</tr>';
      }
      html += '</table>';

      html += '<h3><u><font face="Times New Roman">3. Vencidos por Parceiro</font></u></h3>';
      html += '<table width="70%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>Parceiro ID</th><th>Nome</th><th>Qtd Titulos</th><th>Total Devido</th></tr>';
      for (var vp = 0; vp < vencParc.length; vp++) {
        var corVP = (vp % 2 === 0) ? '#FFFFCC' : '#CCFFFF';
        html += '<tr bgcolor="' + corVP + '">';
        html += '<td style="font-family:Courier New">' + vencParc[vp].parceiroId + '</td>';
        html += '<td>' + vencParc[vp].nome + '</td>';
        html += '<td style="font-family:Courier New" align="center">' + vencParc[vp].quantidade + '</td>';
        html += '<td style="font-family:Courier New"><font color="#FF0000"><b>R$ ' + vencParc[vp].totalDevido + '</b></font></td>';
        html += '</tr>';
      }
      html += '</table>';

      html += '<h3><u><font face="Times New Roman">4. Fluxo de Caixa (' + anoRef + ')</font></u></h3>';
      html += '<table width="100%" border="1" cellpadding="2" cellspacing="0">';
      html += '<tr bgcolor="#FFCC00"><th>Mes</th><th>Prev. Receber</th><th>Prev. Pagar</th><th>Saldo Prev.</th><th>Real. Receber</th><th>Real. Pagar</th><th>Saldo Real.</th></tr>';
      for (var m = 0; m < fluxo.length; m++) {
        var corM = (m % 2 === 0) ? '#FFFFCC' : '#CCFFFF';
        var fl = fluxo[m];
        html += '<tr bgcolor="' + corM + '">';
        html += '<td style="font-family:Courier New">' + fl.mes + '</td>';
        html += '<td style="font-family:Courier New">' + fl.previstoReceber + '</td>';
        html += '<td style="font-family:Courier New">R$ ' + fl.previstoPagar + '</td>';
        html += '<td style="font-family:Courier New"><b>' + fl.saldoPrevisto + '</b></td>';
        html += '<td style="font-family:Courier New">R$ ' + fl.realizadoReceber + '</td>';
        html += '<td style="font-family:Courier New">' + fl.realizadoPagar + '</td>';
        html += '<td style="font-family:Courier New"><b>R$ ' + fl.saldoRealizado + '</b></td>';
        html += '</tr>';
      }
      html += '</table><br>';

      html += '</td></tr>';
      html += '<tr bgcolor="#B0B0B0"><td align="center">';
      html += '<marquee bgcolor="#FFFF00" style="font-family:Courier New;font-size:11px;color:#000000;">Backup diario as 23h - nao desligue o computador</marquee><br>';
      html += '<font face="Verdana" size="1">Visitante numero 004213 | Melhor visualizado em 1024x768 | Desenvolvido em 2003</font>';
      html += '</td></tr></table></center></body></html>';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    paginaErro(res, 'Pagina nao encontrada');
  } catch (err) {
    paginaErro(res, err.message);
  }
});

server.listen(porta, function () {
  console.log('Servidor ControlFinanceiro 1.0 rodando na porta ' + porta);
});
