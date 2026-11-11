/* Identificación de instrumentos según ANSI/ISA-5.1-2009 · ReyEngi
 * Tag típico de proyecto: ÁREA-LETRAS-NÚMERO[SUFIJO], por ejemplo 100-LIT-0101 o 200-PDSH-0201A.
 */
(function () {
  'use strict';
  // Primera letra: variable medida o de inicio (las "a elección del usuario" se dejan con el uso habitual en minería)
  var VAR = {
    A: 'análisis', B: 'llama', C: 'conductividad', D: 'densidad', E: 'voltaje', F: 'flujo', G: 'posición de compuerta', H: 'mano (manual)',
    I: 'corriente', J: 'potencia', K: 'tiempo', L: 'nivel', M: 'humedad', N: 'torque', O: 'velocidad de rotación', P: 'presión', Q: 'cantidad',
    R: 'radiación', S: 'velocidad', T: 'temperatura', U: 'multivariable', V: 'vibración', W: 'peso', X: 'sin clasificar', Y: 'evento / estado',
    Z: 'posición'
  };
  // Modificadores de la primera letra
  var MOD = { D: 'diferencial', F: 'razón', J: 'barrido', K: 'tasa de cambio', Q: 'totalizado', S: 'de seguridad', X: 'eje X', Y: 'eje Y', Z: 'eje Z' };
  // Letras siguientes (función)
  var FUN = {
    A: 'alarma', B: 'quemador', C: 'controlador', E: 'elemento primario', G: 'visor', H: 'alto', I: 'indicador', K: 'estación de control',
    L: 'luz', M: 'medio', N: 'a elección', O: 'orificio', P: 'punto de prueba', Q: 'totalizador', R: 'registrador', S: 'interruptor',
    T: 'transmisor', U: 'multifunción', V: 'válvula', W: 'pozo / sonda', X: 'accesorio', Y: 'relé / convertidor', Z: 'actuador'
  };
  var SUST = { T: 'Transmisor', E: 'Elemento primario', S: 'Interruptor', V: 'Válvula', Y: 'Relé / convertidor', Z: 'Actuador', C: 'Controlador',
    I: 'Indicador', R: 'Registrador', A: 'Alarma', L: 'Luz piloto', K: 'Estación de control', G: 'Visor', Q: 'Totalizador', W: 'Pozo' };
  var ADJ = { I: 'indicador', C: 'controlador', R: 'registrador', T: 'transmisor', Q: 'totalizador', A: 'de alarma' };
  var NIVEL = { H: 'alto', HH: 'muy alto', L: 'bajo', LL: 'muy bajo', HL: 'alto/bajo', M: 'medio' };

  function analizar(tag) {
    var t = String(tag || '').trim().toUpperCase(), partes = t.split(/[-_ ]+/), area = '', letras = '', num = '', suf = '';
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i];
      if (!letras && /^[A-Z]{1,6}$/.test(p) && i > 0) { letras = p; continue; }
      if (!letras && i === 0 && /^[A-Z]{1,6}$/.test(p)) { letras = p; continue; }
      if (letras) { var m = /^(\d+)([A-Z]*)$/.exec(p); if (m) { num = m[1]; suf = m[2]; } else num = num || p; continue; }
      area = area ? area + '-' + p : p;
    }
    if (!letras) { var m2 = /^(\d*)([A-Z]{1,6})(\d+)([A-Z]?)$/.exec(t.replace(/[-_ ]/g, '')); if (m2) { area = m2[1]; letras = m2[2]; num = m2[3]; suf = m2[4]; } }
    var v = letras.charAt(0), mod = '', resto = letras.slice(1);
    if (resto.length > 1 && (resto.charAt(0) === 'D' || (resto.charAt(0) === 'F' && v === 'F'))) { mod = resto.charAt(0); resto = resto.slice(1); }
    return { tag: t, area: area, letras: letras, variable: v, modificador: mod, funciones: resto, numero: num, sufijo: suf };
  }
  // Descripción en castellano a partir de las letras
  function describir(tag) {
    var a = analizar(tag), f = a.funciones, nivel = '';
    var pos = ''; if (a.variable === 'Z' && /S[OC]$/.test(f)) { pos = f.slice(-1) === 'O' ? ' abierta' : ' cerrada'; f = f.slice(0, -1); }
    var mh = /(HH|LL|HL|H|L|M)$/.exec(f); if (mh && /S|A/.test(f.replace(mh[1], ''))) { nivel = NIVEL[mh[1]]; f = f.slice(0, -mh[1].length); }
    var principal = '', adj = [];
    ['V', 'T', 'S', 'E', 'Z', 'Y', 'C', 'R', 'I', 'Q', 'A', 'L', 'K', 'G', 'W'].some(function (k) { if (f.indexOf(k) >= 0) { principal = k; return true; } return false; });
    f.split('').forEach(function (k) { if (k !== principal && ADJ[k]) adj.push(ADJ[k]); });
    var vari = VAR[a.variable] || '';
    if (a.modificador) vari += ' ' + (MOD[a.modificador] || '');
    if (a.variable === 'X' && principal === 'V') return 'Válvula on/off';
    if (a.variable === 'H' && principal === 'S') return 'Selector / botonera manual';
    var s = (SUST[principal] || 'Instrumento') + (adj.length ? ' ' + adj.join(' ') : '') + (vari ? ' de ' + vari : '') + (nivel ? ' ' + nivel.replace('alto', principal === 'S' ? 'alta' : 'alto').replace('bajo', principal === 'S' ? 'baja' : 'bajo') : '') + pos;
    return s.replace(/\s+/g, ' ');
  }
  // Funciones a mostrar en la HMI (burbujas de pantalla compartida) según el tipo de señal
  function funcionesHmi(tag, tipo, conControl) {
    var a = analizar(tag), v = a.variable + (a.modificador || ''), f = a.funciones;
    if (tipo === 'AI') return conControl ? [v + 'IC'] : [v + 'I'];
    if (tipo === 'AO') return conControl ? [] : [a.letras || v + 'Y'];
    if (tipo === 'DI') {
      var m = /S(HH|LL|H|L)$/.exec(f); if (m) return [v + 'A' + m[1]];
      if (/^Z S[OC]?$/.test(a.variable + ' ' + f)) return ['Z' + 'I' + (f.slice(1) || '')];
      if (a.variable === 'Z') return ['ZI' + (f.replace('S', '') || '')];
      return [v + (f.indexOf('A') >= 0 ? f : 'I')];
    }
    if (tipo === 'DO') return ['HS'];
    return [];
  }
  // Clave de lazo: área + número (FIT-7372, FV-7372 y FY-7372 quedan en el lazo 7372; XV, ZSO y ZSC del mismo número también)
  function lazoDe(tag) { var a = analizar(tag); return (a.area ? a.area + '-' : '') + (a.numero || a.letras); }
  function compacto(tag) { return String(tag || '').replace(/[-_ ]/g, ''); }

  window.ISA = { VAR: VAR, MOD: MOD, FUN: FUN, analizar: analizar, describir: describir, funcionesHmi: funcionesHmi, lazoDe: lazoDe, compacto: compacto };
})();
