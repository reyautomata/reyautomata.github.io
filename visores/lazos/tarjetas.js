/* Biblioteca de tarjetas de E/S para diagramas de lazo · ReyEngi
 *
 * Cada tarjeta indica, por canal, qué borne cumple cada función:
 *   AI: pwr (entrega energía al lazo de 2/3 hilos), ret (retorno del lazo de 2 hilos), inp / inn (entrada
 *       de señal + / −), com (común), puentes (uniones internas que se cablean en la bornera de la tarjeta).
 *   AO: out (salida +), rtn (retorno).
 *   DI: inp (entrada), com (común del grupo), pwr/ret cuando la tarjeta energiza el contacto.
 *   DO: out (salida), com (retorno del grupo), sup (alimentación del grupo).
 * alim: 'interna' = la tarjeta alimenta el lazo; 'externa' = se alimenta desde una fuente de 24 VDC del gabinete.
 * verificado: true cuando los bornes se tomaron de la hoja de datos del fabricante citada en "fuente".
 * Los bornes de cualquier tarjeta se pueden corregir desde la aplicación (se guardan por proyecto).
 */
(function () {
  'use strict';
  function b(n, s) { return { n: String(n), s: s }; }

  // base: número del primer canal como lo muestra el fabricante
  var PROVEEDORES = [
    { id: 'rockwell', nombre: 'Rockwell Automation · ControlLogix 1756', base: 0, def: { AI: '1756-IF8', AO: '1756-OF8', DI: '1756-IB16', DO: '1756-OB16E' } },
    { id: 'emerson', nombre: 'Emerson · DeltaV serie M (E/S tradicional)', base: 1, def: { AI: 'VE4003S2B1', AO: 'VE4005S2B1', DI: 'VE4001S2T2B1', DO: 'VE4002S1T2B1' } },
    { id: 'siemens', nombre: 'Siemens · SIMATIC S7-1500 / ET 200MP', base: 0, def: { AI: '6ES7531-7KF00-0AB0', AO: '6ES7532-5HD00-0AB0', DI: '6ES7521-1BH00-0AB0', DO: '6ES7522-1BH01-0AB0' } },
    { id: 'schneider', nombre: 'Schneider Electric · Modicon X80 (M340/M580)', base: 0, def: { AI: 'BMX AMI 0810', AO: 'BMX AMO 0410', DI: 'BMX DDI 1602', DO: 'BMX DDO 1602' } },
    { id: 'abb', nombre: 'ABB · S800 I/O (800xA)', base: 1, def: { AI: 'AI845 / TU844', AO: 'AO845 / TU844', DI: 'DI810 / TU830', DO: 'DO810 / TU830' } },
    { id: 'generico', nombre: 'Genérico (bornes correlativos)', base: 1, def: { AI: 'AI-8 (alimentación interna)', AO: 'AO-8', DI: 'DI-16 24 VDC', DO: 'DO-16 24 VDC' } }
  ];

  var TD002 = 'Rockwell 1756-TD002M-EN-E (dic. 2019)';
  var T = [];

  // ── Rockwell ControlLogix (bornes verificados con 1756-TD002M) ──
  (function () {
    var IN8 = [2, 4, 6, 8, 12, 14, 16, 18], IR8 = [1, 3, 5, 7, 11, 13, 15, 17];
    T.push({ modelo: '1756-IF8', prov: 'rockwell', tipo: 'AI', canales: 8, alim: 'externa', desc: 'AI 8 canales, corriente/voltaje, unipolar (single-ended)',
      fuente: TD002 + ', p. 52', verificado: true, rtb: '1756-TBNH (36 bornes)',
      bornes: function (c) { return { inp: b(IN8[c], 'IN-' + c), inn: b(9, 'RTN'), puentes: [[b(IR8[c], 'iRTN-' + c), b(9, 'RTN')]] }; } });
    var IN16 = [2, 4, 6, 8, 12, 14, 16, 18, 20, 22, 24, 26, 30, 32, 34, 36], IR16 = [1, 3, 5, 7, 11, 13, 15, 17, 19, 21, 23, 25, 29, 31, 33, 35];
    T.push({ modelo: '1756-IF16', prov: 'rockwell', tipo: 'AI', canales: 16, alim: 'externa', desc: 'AI 16 canales, corriente/voltaje, unipolar',
      fuente: TD002 + ', p. 69', verificado: true, rtb: '1756-TBCH (36 bornes)',
      bornes: function (c) { var r = c < 8 ? 9 : 27; return { inp: b(IN16[c], 'IN-' + c), inn: b(r, 'RTN'), puentes: [[b(IR16[c], 'iRTN-' + c), b(r, 'RTN')]] }; } });
    var I8 = [[2, 4, 6], [1, 3, 5], [10, 12, 14], [9, 11, 13], [18, 20, 22], [17, 19, 21], [26, 28, 30], [25, 27, 29]];
    T.push({ modelo: '1756-IF8I', prov: 'rockwell', tipo: 'AI', canales: 8, alim: 'interna', desc: 'AI 8 canales aislados, modo corriente con alimentación de lazo interna',
      fuente: TD002 + ', p. 59', verificado: true, rtb: '1756-TBCH (36 bornes)',
      bornes: function (c) { var t = I8[c]; return { pwr: b(t[1], 'IN_' + c + '/I/SRC'), ret: b(t[2], 'RTN-' + c), inp: b(t[1], 'IN_' + c + '/I/SRC'), inn: b(t[2], 'RTN-' + c) }; } });
    var IO8 = [3, 9, 13, 19, 4, 10, 14, 20], RO8 = [5, 5, 15, 15, 6, 6, 16, 16];
    T.push({ modelo: '1756-OF8', prov: 'rockwell', tipo: 'AO', canales: 8, alim: 'interna', desc: 'AO 8 canales, corriente/voltaje',
      fuente: TD002 + ', p. 192', verificado: true, rtb: '1756-TBNH (20 bornes)',
      bornes: function (c) { return { out: b(IO8[c], 'IOUT-' + c), rtn: b(RO8[c], 'RTN') }; } });
    T.push({ modelo: '1756-IB16', prov: 'rockwell', tipo: 'DI', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DI 16 canales 24 VDC, entrada sumidero (sink)',
      fuente: TD002 + ', p. 17', verificado: true, rtb: '1756-TBNH (20 bornes)',
      bornes: function (c) { var n = c < 8 ? c + 1 : c + 3; return { inp: b(n, 'IN-' + c), com: c < 8 ? b(9, 'GND-0') : b(19, 'GND-1') }; } });
    T.push({ modelo: '1756-OB16E', prov: 'rockwell', tipo: 'DO', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DO 16 canales 24 VDC fuente (source), con fusible electrónico',
      fuente: TD002 + ', p. 159', verificado: true, rtb: '1756-TBNH (20 bornes)',
      bornes: function (c) { var n = c < 8 ? c + 1 : c + 3; return { out: b(n, 'OUT-' + c), com: c < 8 ? b(9, 'RTN OUT-0') : b(19, 'RTN OUT-1'), sup: c < 8 ? b(10, 'DC-0(+)') : b(20, 'DC-1(+)') }; } });
  })();

  // ── Emerson DeltaV serie M, E/S tradicional: 2 bornes por canal (numeración del bloque de terminación) ──
  (function () {
    var F = 'Bloque de terminación estándar DeltaV, 2 bornes por canal (como en plano de referencia con VE4003S2B1)';
    function par(c, p, m) { return [b(2 * c + 1, p + (c + 1)), b(2 * c + 2, m + (c + 1))]; }
    T.push({ modelo: 'VE4003S2B1', prov: 'emerson', tipo: 'AI', canales: 8, alim: 'interna', desc: 'AI 8 canales 4–20 mA HART (alimenta transmisores de 2 hilos)', fuente: F, verificado: false,
      bornes: function (c) { var p = par(c, 'CH', 'CH'); p[0].s = '+'; p[1].s = '−'; return { pwr: p[0], ret: p[1], inp: p[0], inn: p[1] }; } });
    T.push({ modelo: 'VE4005S2B1', prov: 'emerson', tipo: 'AO', canales: 8, alim: 'interna', desc: 'AO 8 canales 4–20 mA HART', fuente: F, verificado: false,
      bornes: function (c) { var p = par(c, '', ''); p[0].s = '+'; p[1].s = '−'; return { out: p[0], rtn: p[1] }; } });
    T.push({ modelo: 'VE4001S2T2B1', prov: 'emerson', tipo: 'DI', canales: 8, alim: 'interna', tension: '24 VDC', desc: 'DI 8 canales 24 VDC contacto seco (la tarjeta energiza el contacto)', fuente: F, verificado: false,
      bornes: function (c) { var p = par(c, '', ''); p[0].s = '+'; p[1].s = '−'; return { pwr: p[0], inp: p[1] }; } });
    T.push({ modelo: 'VE4002S1T2B1', prov: 'emerson', tipo: 'DO', canales: 8, alim: 'interna', tension: '24 VDC', desc: 'DO 8 canales 24 VDC lado alto', fuente: F, verificado: false,
      bornes: function (c) { var p = par(c, '', ''); p[0].s = '+'; p[1].s = '−'; return { out: p[0], com: p[1] }; } });
  })();

  // ── Siemens S7-1500 (conector frontal de 40 bornes; referencial, verificar con el manual del módulo) ──
  (function () {
    var F = 'Siemens S7-1500, conector frontal 40 polos (referencial)';
    function base(c) { return (c < 4 ? 1 : 5) + c * 4; } // canales 0–3 en bornes 1–16, 4–7 en 21–36
    T.push({ modelo: '6ES7531-7KF00-0AB0', prov: 'siemens', tipo: 'AI', canales: 8, alim: 'interna', desc: 'AI 8xU/I/RTD/TC ST (alimentación UVn para transmisores de 2 hilos; L+ 41, M 44)', fuente: F, verificado: false,
      bornes: function (c) { var k = base(c); return { pwr: b(k, 'UV' + c), ret: b(k + 1, 'I' + c + '+'), inp: b(k + 1, 'I' + c + '+'), inn: b(k + 3, 'I' + c + '−') }; } });
    T.push({ modelo: '6ES7532-5HD00-0AB0', prov: 'siemens', tipo: 'AO', canales: 4, alim: 'interna', desc: 'AQ 4xU/I ST', fuente: F, verificado: false,
      bornes: function (c) { var k = 1 + c * 4; return { out: b(k + 1, 'QI' + c), rtn: b(k + 3, 'MANA') }; } });
    T.push({ modelo: '6ES7521-1BH00-0AB0', prov: 'siemens', tipo: 'DI', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DI 16x24VDC BA, entrada tipo sumidero (M en 20/40)', fuente: F, verificado: false,
      bornes: function (c) { return { inp: b(c < 8 ? c + 1 : c + 3, 'DI' + c), com: c < 8 ? b(20, 'M') : b(40, 'M') }; } });
    T.push({ modelo: '6ES7522-1BH01-0AB0', prov: 'siemens', tipo: 'DO', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DQ 16x24VDC/0,5A ST, salida fuente (L+ 19/39, M 20/40)', fuente: F, verificado: false,
      bornes: function (c) { return { out: b(c < 8 ? c + 1 : c + 3, 'DQ' + c), com: c < 8 ? b(20, 'M') : b(40, 'M'), sup: c < 8 ? b(19, 'L+') : b(39, 'L+') }; } });
  })();

  // ── Schneider Modicon X80 (bornera de 20/28 polos; referencial) ──
  (function () {
    var F = 'Schneider Modicon X80 (referencial, verificar con el manual del módulo)';
    T.push({ modelo: 'BMX AMI 0810', prov: 'schneider', tipo: 'AI', canales: 8, alim: 'externa', desc: 'AI 8 canales aislados alta velocidad (lazo con fuente externa 24 VDC)', fuente: F, verificado: false,
      bornes: function (c) { return { inp: b(2 * c + 1, 'IV' + c + '+'), inn: b(2 * c + 2, 'COM' + c) }; } });
    T.push({ modelo: 'BMX AMO 0410', prov: 'schneider', tipo: 'AO', canales: 4, alim: 'interna', desc: 'AO 4 canales aislados', fuente: F, verificado: false,
      bornes: function (c) { return { out: b(2 * c + 1, 'I' + c + '+'), rtn: b(2 * c + 2, 'COM' + c) }; } });
    T.push({ modelo: 'BMX DDI 1602', prov: 'schneider', tipo: 'DI', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DI 16 canales 24 VDC lógica positiva', fuente: F, verificado: false,
      bornes: function (c) { return { inp: b(c + 1, 'I' + c), com: b(18, '0V') }; } });
    T.push({ modelo: 'BMX DAI 1614', prov: 'schneider', tipo: 'DI', canales: 16, alim: 'externa', tension: '120 VAC', desc: 'DI 16 canales 100–120 VAC', fuente: F, verificado: false,
      bornes: function (c) { return { inp: b(c + 1, 'I' + c), com: b(c < 8 ? 18 : 19, 'COM') }; } });
    T.push({ modelo: 'BMX DDO 1602', prov: 'schneider', tipo: 'DO', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DO 16 canales 24 VDC transistor', fuente: F, verificado: false,
      bornes: function (c) { return { out: b(c + 1, 'Q' + c), com: b(18, '0V'), sup: b(17, '+24V') }; } });
  })();

  // ── ABB S800 con unidad de terminación (MTU); referencial ──
  (function () {
    var F = 'ABB S800 I/O sobre MTU TU810/TU830 (referencial)';
    T.push({ modelo: 'AI845 / TU844', prov: 'abb', tipo: 'AI', canales: 8, alim: 'interna', desc: 'AI 8 canales 4–20 mA HART con alimentación de transmisores', fuente: F, verificado: false,
      bornes: function (c) { return { pwr: b('L' + (c + 1) + '+', 'TX PWR'), ret: b('C' + (c + 1), 'CH' + (c + 1)), inp: b('C' + (c + 1), 'CH' + (c + 1)), inn: b('B' + (c + 1), 'RET') }; } });
    T.push({ modelo: 'AO845 / TU844', prov: 'abb', tipo: 'AO', canales: 8, alim: 'interna', desc: 'AO 8 canales 4–20 mA HART', fuente: F, verificado: false,
      bornes: function (c) { return { out: b('C' + (c + 1), 'CH' + (c + 1) + '+'), rtn: b('B' + (c + 1), 'CH' + (c + 1) + '−') }; } });
    T.push({ modelo: 'DI810 / TU830', prov: 'abb', tipo: 'DI', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DI 16 canales 24 VDC', fuente: F, verificado: false,
      bornes: function (c) { return { inp: b('C' + (c + 1), 'CH' + (c + 1)), com: b(c < 8 ? 'ZP1' : 'ZP2', '0V') }; } });
    T.push({ modelo: 'DO810 / TU830', prov: 'abb', tipo: 'DO', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DO 16 canales 24 VDC 0,5 A', fuente: F, verificado: false,
      bornes: function (c) { return { out: b('C' + (c + 1), 'CH' + (c + 1)), com: b(c < 8 ? 'ZP1' : 'ZP2', '0V'), sup: b(c < 8 ? 'UP1' : 'UP2', '+24V') }; } });
  })();

  // ── Genéricas (correlativas) ──
  T.push({ modelo: 'AI-8 (alimentación interna)', prov: 'generico', tipo: 'AI', canales: 8, alim: 'interna', desc: 'AI 8 canales 4–20 mA, alimenta el lazo', fuente: 'Genérica', verificado: false,
    bornes: function (c) { return { pwr: b(3 * c + 1, '+24V'), ret: b(3 * c + 2, 'IN' + c), inp: b(3 * c + 2, 'IN' + c), inn: b(3 * c + 3, 'COM') }; } });
  T.push({ modelo: 'AI-8 (alimentación externa)', prov: 'generico', tipo: 'AI', canales: 8, alim: 'externa', desc: 'AI 8 canales 4–20 mA, lazo con fuente externa', fuente: 'Genérica', verificado: false,
    bornes: function (c) { return { inp: b(2 * c + 1, 'IN' + c + '+'), inn: b(2 * c + 2, 'IN' + c + '−') }; } });
  T.push({ modelo: 'AO-8', prov: 'generico', tipo: 'AO', canales: 8, alim: 'interna', desc: 'AO 8 canales 4–20 mA', fuente: 'Genérica', verificado: false,
    bornes: function (c) { return { out: b(2 * c + 1, 'OUT' + c + '+'), rtn: b(2 * c + 2, 'OUT' + c + '−') }; } });
  T.push({ modelo: 'DI-16 24 VDC', prov: 'generico', tipo: 'DI', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DI 16 canales 24 VDC sumidero', fuente: 'Genérica', verificado: false,
    bornes: function (c) { return { inp: b(c + 1, 'DI' + c), com: b(17, 'COM') }; } });
  T.push({ modelo: 'DI-16 120 VAC', prov: 'generico', tipo: 'DI', canales: 16, alim: 'externa', tension: '120 VAC', desc: 'DI 16 canales 120 VAC', fuente: 'Genérica', verificado: false,
    bornes: function (c) { return { inp: b(c + 1, 'DI' + c), com: b(17, 'N') }; } });
  T.push({ modelo: 'DO-16 24 VDC', prov: 'generico', tipo: 'DO', canales: 16, alim: 'externa', tension: '24 VDC', desc: 'DO 16 canales 24 VDC fuente', fuente: 'Genérica', verificado: false,
    bornes: function (c) { return { out: b(c + 1, 'DO' + c), com: b(18, '0V'), sup: b(17, '+24V') }; } });

  var ROLES = { AI: ['pwr', 'ret', 'inp', 'inn'], AO: ['out', 'rtn'], DI: ['pwr', 'inp', 'com'], DO: ['out', 'com', 'sup'] };
  var NOMBRE_ROL = { pwr: 'Alimentación del lazo', ret: 'Retorno lazo 2 hilos', inp: 'Entrada +', inn: 'Entrada − / común', out: 'Salida', rtn: 'Retorno', com: 'Común', sup: 'Alimentación del grupo' };

  function buscar(modelo) { return T.filter(function (t) { return t.modelo === modelo; })[0] || null; }
  // Bornes de un canal con las correcciones guardadas por el usuario ({ 'modelo': { 'canal:rol': 'n|nombre' } })
  function bornes(modelo, canal, override) {
    var t = buscar(modelo); if (!t) return null;
    var r = t.bornes(canal), o = (override || {})[modelo] || {};
    Object.keys(r).forEach(function (k) {
      if (k === 'puentes') return;
      var v = o[canal + ':' + k]; if (v) { var p = String(v).split('|'); r[k] = b(p[0], p[1] || r[k].s); }
    });
    return r;
  }
  window.LAZOS_TARJETAS = { proveedores: PROVEEDORES, lista: T, buscar: buscar, bornes: bornes, roles: ROLES, nombreRol: NOMBRE_ROL,
    deProveedor: function (p, tipo) { return T.filter(function (t) { return t.prov === p && (!tipo || t.tipo === tipo); }); } };
})();
