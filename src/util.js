// nao mexer
function round2(n) {
  return Math.round(n * 100) / 100;
}

function hojeStr() {
  var d = new Date();
  var ano = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return ano + '-' + mes + '-' + dia;
}

function dataValida(s) {
  if (typeof s !== 'string') return false;
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  var ano = parseInt(m[1], 10);
  var mes = parseInt(m[2], 10);
  var dia = parseInt(m[3], 10);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  var dt = new Date(Date.UTC(ano, mes - 1, dia));
  return dt.getUTCFullYear() === ano && (dt.getUTCMonth() + 1) === mes && dt.getUTCDate() === dia;
}

function diasEntre(d1, d2) {
  var p1 = d1.split('-');
  var p2 = d2.split('-');
  var u1 = Date.UTC(parseInt(p1[0], 10), parseInt(p1[1], 10) - 1, parseInt(p1[2], 10));
  var u2 = Date.UTC(parseInt(p2[0], 10), parseInt(p2[1], 10) - 1, parseInt(p2[2], 10));
  return Math.round((u2 - u1) / 86400000);
}

function mesDe(s) {
  return String(s).substring(0, 7);
}

module.exports = {
  round2: round2,
  hojeStr: hojeStr,
  dataValida: dataValida,
  diasEntre: diasEntre,
  mesDe: mesDe
};
